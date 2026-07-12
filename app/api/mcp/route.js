import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getPricing } from "../../../lib/pricing-store";
import { runPriceEstimateTool, renderDeterministicEstimate } from "../../../lib/chat-price-tool";
import { computeAvailableDays } from "../../../lib/availability";
import { createManualAppointment } from "../../../lib/chat-records-store";
import { verifyAccessToken } from "../../../lib/mcp-oauth";
import { formatShopSlot } from "../../../lib/shop-time";
import { SITE, SERVICES } from "../../site.config";

// A voice model has to read tool output aloud in real time, so results here
// are shaped as short, already-speakable strings (e.g. "Monday, July 13,
// 9:00 AM") instead of raw ISO dates/24h times it would have to reformat
// itself — that reformatting step is what was causing stalls and robotic
// phrasing when the caller asked about availability.
const MAX_SPOKEN_SLOTS = 6;

function formatClock(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(
    new Date(Date.UTC(2000, 0, 1, hour, minute)),
  );
}

// Groups consecutive open days with identical hours into one phrase, e.g.
// "Monday to Friday, 9:00 AM to 6:00 PM; Saturday, 9:00 AM to 5:00 PM;
// closed Sunday" — far shorter for a voice model to read than 7 separate lines.
function spokenHours() {
  const byDay = [...SITE.hours].sort((a, b) => a.day - b.day);
  const groups = [];
  for (const entry of byDay) {
    const last = groups[groups.length - 1];
    const key = entry.open && entry.close ? `${entry.open}-${entry.close}` : "closed";
    if (last && last.key === key && last.days[last.days.length - 1] === entry.day - 1) {
      last.days.push(entry.day);
    } else {
      groups.push({ key, days: [entry.day], label: entry.label.en, open: entry.open, close: entry.close });
    }
  }
  return groups
    .map((group) => {
      const dayLabel =
        group.days.length > 1
          ? `${SITE.hours[group.days[0]].label.en} to ${SITE.hours[group.days[group.days.length - 1]].label.en}`
          : group.label;
      return group.open && group.close
        ? `${dayLabel}, ${formatClock(group.open)} to ${formatClock(group.close)}`
        : `closed ${dayLabel}`;
    })
    .join("; ");
}

function flattenSpokenSlots(days) {
  const flat = [];
  for (const day of days) {
    for (const time of day.slots) {
      flat.push({ date: day.date, time, say: formatShopSlot(day.date, time, "en") });
      if (flat.length >= MAX_SPOKEN_SLOTS) return flat;
    }
  }
  return flat;
}

export const dynamic = "force-dynamic";

// Voice/MCP callers (e.g. Grok's Voice Agent) have no browser session, so this
// endpoint accepts either the static MCP_API_KEY directly, or an OAuth access
// token minted by /api/mcp/token (for clients whose UI requires an OAuth flow
// rather than a plain header) — both ultimately gate on the same shared key.
async function isAuthorized(request) {
  const expected = process.env.MCP_API_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return false;
  if (token === expected) return true;
  return verifyAccessToken(token);
}

async function buildServer() {
  const server = new McpServer({ name: "tires-sos", version: "1.0.0" });

  server.registerTool(
    "get_price_estimate",
    {
      description:
        "Compute an exact price estimate from the shop's real, current pricing data. Always call this before " +
        "stating any price to a caller. The result includes a 'say' field already phrased as a spoken sentence — " +
        "use it directly instead of composing your own price sentence from the raw numbers.",
      inputSchema: {
        vehicleClass: z.string().optional().describe("Best-matching vehicle class, if known."),
        brandTier: z.string().optional().describe("'standard' unless the caller asked for economy or premium."),
        services: z
          .array(
            z.object({
              id: z.string(),
              qty: z.number().optional(),
              optionId: z.string().optional(),
            }),
          )
          .describe("One entry per service the caller wants priced."),
      },
    },
    async (args) => {
      const pricing = await getPricing();
      const result = runPriceEstimateTool(pricing, args);
      const say = result.ok ? renderDeterministicEstimate(result, "en") : null;
      return { content: [{ type: "text", text: JSON.stringify({ ...result, say }) }] };
    },
  );

  server.registerTool(
    "get_available_slots",
    {
      description:
        "Get the shop's next open appointment slots. Returns a short list of at most 6 options, each with a 'say' " +
        "field that is already phrased for speech (e.g. \"Monday, July 13, 9:00 AM\") — read that field aloud " +
        "verbatim instead of describing the date/time yourself, then offer 2-3 of them at a time rather than " +
        "reading the whole list. When booking, pass that same option's 'date' and 'time' fields to book_appointment.",
      inputSchema: {},
    },
    async () => {
      const { days, timeZone } = await computeAvailableDays();
      const slots = flattenSpokenSlots(days);
      return { content: [{ type: "text", text: JSON.stringify({ timeZone, slots }) }] };
    },
  );

  server.registerTool(
    "book_appointment",
    {
      description:
        "Book a confirmed shop appointment once the caller has given service, vehicle, name, phone, and picked " +
        "one option returned by get_available_slots.",
      inputSchema: {
        customerName: z.string(),
        phone: z.string(),
        service: z.string(),
        vehicle: z.string(),
        scheduledDate: z.string().describe("The 'date' field from the chosen get_available_slots option (YYYY-MM-DD)."),
        scheduledTime: z.string().describe("The 'time' field from the chosen get_available_slots option (24h HH:MM)."),
        notes: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const result = await createManualAppointment(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ok: true, appointmentId: result.appointment?.id, status: result.appointment?.status }),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ ok: false, error: error.message, code: error.code }) }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "get_shop_info",
    {
      description:
        "Get the shop's hours, locations, and list of services. Includes a 'say' field with the hours already " +
        "phrased as a short spoken sentence — use it directly instead of reading the raw per-day hours list.",
      inputSchema: {},
    },
    async () => {
      const info = {
        phone: SITE.phone,
        whatsapp: SITE.whatsapp,
        locations: SITE.locations.map((l) => l.full),
        hours: SITE.hours,
        services: SERVICES.map((s) => s.title.en),
        say: spokenHours(),
      };
      return { content: [{ type: "text", text: JSON.stringify(info) }] };
    },
  );

  return server;
}

async function handle(request) {
  if (!(await isAuthorized(request))) {
    const origin = new URL(request.url).origin;
    return Response.json(
      { error: "unauthorized" },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer resource_metadata="${origin}/.well-known/oauth-authorization-server"`,
        },
      },
    );
  }

  const server = await buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
