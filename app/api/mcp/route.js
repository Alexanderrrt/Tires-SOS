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

const langParam = z.enum(["en", "es"]).optional().describe(
  "Language the caller is speaking. Pass 'es' for Spanish so spoken text comes back in Spanish — detect this " +
  "from the caller's own words, not just once at the start of the call.",
);

function resolveLang(lang) {
  return lang === "es" ? "es" : "en";
}

function formatClock(time24, lang) {
  const [hour, minute] = time24.split(":").map(Number);
  return new Intl.DateTimeFormat(lang === "es" ? "es-US" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}

const CLOSED_WORD = { en: "closed", es: "cerrado" };
const TO_WORD = { en: "to", es: "a" };

// Groups consecutive open days with identical hours into one phrase, e.g.
// "Monday to Friday, 9:00 AM to 6:00 PM; Saturday, 9:00 AM to 5:00 PM;
// closed Sunday" — far shorter for a voice model to read than 7 separate lines.
function spokenHours(lang) {
  const byDay = [...SITE.hours].sort((a, b) => a.day - b.day);
  const groups = [];
  for (const entry of byDay) {
    const last = groups[groups.length - 1];
    const key = entry.open && entry.close ? `${entry.open}-${entry.close}` : "closed";
    if (last && last.key === key && last.days[last.days.length - 1] === entry.day - 1) {
      last.days.push(entry.day);
    } else {
      groups.push({ key, days: [entry.day], label: entry.label[lang], open: entry.open, close: entry.close });
    }
  }
  return groups
    .map((group) => {
      const dayLabel =
        group.days.length > 1
          ? `${SITE.hours[group.days[0]].label[lang]} ${TO_WORD[lang]} ${SITE.hours[group.days[group.days.length - 1]].label[lang]}`
          : group.label;
      return group.open && group.close
        ? `${dayLabel}, ${formatClock(group.open, lang)} ${TO_WORD[lang]} ${formatClock(group.close, lang)}`
        : `${CLOSED_WORD[lang]} ${dayLabel}`;
    })
    .join("; ");
}

function flattenSpokenSlots(days, lang) {
  const flat = [];
  for (const day of days) {
    for (const time of day.slots) {
      flat.push({ date: day.date, time, say: formatShopSlot(day.date, time, lang) });
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
        "stating any price to a caller. Pass lang='es' if the caller is speaking Spanish. The result includes a " +
        "'say' field already phrased as a spoken sentence in that language — use it directly instead of " +
        "composing your own price sentence from the raw numbers.",
      inputSchema: {
        lang: langParam,
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
      const lang = resolveLang(args.lang);
      const pricing = await getPricing();
      const result = runPriceEstimateTool(pricing, args);
      const say = result.ok ? renderDeterministicEstimate(result, lang) : null;
      return { content: [{ type: "text", text: JSON.stringify({ ...result, say }) }] };
    },
  );

  server.registerTool(
    "get_available_slots",
    {
      description:
        "Get the shop's next open appointment slots. Pass lang='es' if the caller is speaking Spanish. Returns a " +
        "short list of at most 6 options, each with a 'say' field already phrased for speech in that language " +
        "(e.g. \"Monday, July 13, 9:00 AM\") — read that field aloud verbatim instead of describing the " +
        "date/time yourself, then offer 2-3 of them at a time rather than reading the whole list. When booking, " +
        "pass that same option's 'date' and 'time' fields to book_appointment.",
      inputSchema: { lang: langParam },
    },
    async (args) => {
      const lang = resolveLang(args.lang);
      const { days, timeZone } = await computeAvailableDays();
      const slots = flattenSpokenSlots(days, lang);
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
        "Get the shop's hours, locations, and list of services. Pass lang='es' if the caller is speaking Spanish " +
        "— services and the 'say' field (hours phrased as a short spoken sentence) come back in that language. " +
        "Use 'say' directly instead of reading the raw per-day hours list.",
      inputSchema: { lang: langParam },
    },
    async (args) => {
      const lang = resolveLang(args.lang);
      const info = {
        phone: SITE.phone,
        whatsapp: SITE.whatsapp,
        locations: SITE.locations.map((l) => l.full),
        hours: SITE.hours,
        services: SERVICES.map((s) => s.title[lang]),
        say: spokenHours(lang),
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
