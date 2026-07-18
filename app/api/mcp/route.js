import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getPricing } from "../../../lib/pricing-store";
import { runPriceEstimateTool, renderDeterministicEstimate } from "../../../lib/chat-price-tool";
import { computeAvailableDays } from "../../../lib/availability";
import { createManualAppointment } from "../../../lib/chat-records-store";
import { deliverLeadNotification } from "../../../lib/lead-notification-service";
import { verifyAccessToken } from "../../../lib/mcp-oauth";
import { formatShopSlot } from "../../../lib/shop-time";
import { SITE, SERVICES } from "../../site.config";

const MAX_SPOKEN_SLOTS = 6;

const langParam = z.enum(["en", "es"]).optional().describe(
  "Language the caller is speaking. Pass 'es' for Spanish and 'en' for English.",
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
      const firstDay = byDay.find((entry) => entry.day === group.days[0]);
      const lastDay = byDay.find((entry) => entry.day === group.days[group.days.length - 1]);
      const dayLabel = group.days.length > 1
        ? `${firstDay.label[lang]} ${TO_WORD[lang]} ${lastDay.label[lang]}`
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
export const maxDuration = 30;

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
        "Compute an exact estimate from Tires SOS's current pricing. Always call this before stating a price. " +
        "Pass the caller's language and speak the returned 'say' text directly.",
      inputSchema: {
        lang: langParam,
        vehicleClass: z.string().optional().describe("Best-matching vehicle class, if known."),
        brandTier: z.string().optional().describe("Use 'standard' unless the caller asks for economy or premium."),
        services: z.array(z.object({
          id: z.string(),
          qty: z.number().optional(),
          optionId: z.string().optional(),
        })).describe("One entry per service the caller wants priced."),
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
        "Get the next open Tires SOS appointment slots. Pass the caller's language. Read the option 'say' fields " +
        "naturally, offer only 2-3 at a time, and use the exact date/time values when booking.",
      inputSchema: { lang: langParam },
    },
    async (args) => {
      const lang = resolveLang(args.lang);
      const { days, timeZone } = await computeAvailableDays();
      return {
        content: [{ type: "text", text: JSON.stringify({ timeZone, slots: flattenSpokenSlots(days, lang) }) }],
      };
    },
  );

  server.registerTool(
    "book_appointment",
    {
      description:
        "Book a confirmed Tires SOS appointment only after the caller provides service, vehicle, name, phone, " +
        "and explicitly chooses an option returned by get_available_slots.",
      inputSchema: {
        lang: langParam,
        customerName: z.string(),
        phone: z.string(),
        service: z.string(),
        vehicle: z.string(),
        scheduledDate: z.string().describe("Chosen option's date field (YYYY-MM-DD)."),
        scheduledTime: z.string().describe("Chosen option's time field (24h HH:MM)."),
        notes: z.string().optional(),
      },
    },
    async (args) => {
      const lang = resolveLang(args.lang);
      try {
        const result = await createManualAppointment({ ...args, source: "Voice", lang });
        let notification = { accepted: false, status: "pending", attempts: 0 };
        try {
          notification = await deliverLeadNotification({ id: result.lead?.id });
        } catch {
          // The appointment is durable even if Gmail is temporarily unavailable.
        }
        const slot = formatShopSlot(args.scheduledDate, args.scheduledTime, lang);
        const say = lang === "es"
          ? `Listo. Tu cita en Tires SOS está confirmada para ${slot}.`
          : `You're all set. Your Tires SOS appointment is confirmed for ${slot}.`;
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              ok: true,
              appointmentId: result.appointment?.id,
              status: result.appointment?.status,
              notification,
              say,
            }),
          }],
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
        "Get Tires SOS's phone, WhatsApp, locations, hours, and services. Pass the caller's language and use the " +
        "short 'say' hours text instead of reading the raw schedule.",
      inputSchema: { lang: langParam },
    },
    async (args) => {
      const lang = resolveLang(args.lang);
      const info = {
        phone: SITE.phone,
        whatsapp: SITE.whatsapp,
        locations: SITE.locations.map((location) => location.full),
        hours: SITE.hours,
        services: SERVICES.map((service) => service.title[lang]),
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
          "Cache-Control": "no-store",
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
