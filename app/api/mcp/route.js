import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { getPricing } from "../../../lib/pricing-store";
import { buildPriceEstimateTool, runPriceEstimateTool } from "../../../lib/chat-price-tool";
import { computeAvailableDays } from "../../../lib/availability";
import { createManualAppointment } from "../../../lib/chat-records-store";
import { SITE, SERVICES } from "../../site.config";

export const dynamic = "force-dynamic";

// Voice/MCP callers (e.g. Grok's Voice Agent) have no browser session, so this
// endpoint is authenticated with a static bearer token instead of the chat
// cookie/turnstile flow the web chat uses.
function isAuthorized(request) {
  const expected = process.env.MCP_API_KEY;
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === expected;
}

async function buildServer() {
  const server = new McpServer({ name: "tires-sos", version: "1.0.0" });

  server.registerTool(
    "get_price_estimate",
    {
      description:
        "Compute an exact price estimate from the shop's real, current pricing data. Always call this before stating any price to a caller.",
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
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  );

  server.registerTool(
    "get_available_slots",
    {
      description: "Get the shop's next open appointment slots for the coming week.",
      inputSchema: {},
    },
    async () => {
      const result = await computeAvailableDays();
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    },
  );

  server.registerTool(
    "book_appointment",
    {
      description:
        "Book a confirmed shop appointment once the caller has given service, vehicle, name, phone, and picked an open date/time from get_available_slots.",
      inputSchema: {
        customerName: z.string(),
        phone: z.string(),
        service: z.string(),
        vehicle: z.string(),
        scheduledDate: z.string().describe("YYYY-MM-DD, must be one of get_available_slots' returned dates."),
        scheduledTime: z.string().describe("HH:MM (24h), must be one of that date's returned slots."),
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
      description: "Get the shop's hours, locations, and list of services.",
      inputSchema: {},
    },
    async () => {
      const info = {
        phone: SITE.phone,
        whatsapp: SITE.whatsapp,
        locations: SITE.locations.map((l) => l.full),
        hours: SITE.hours,
        services: SERVICES.map((s) => s.title.en),
      };
      return { content: [{ type: "text", text: JSON.stringify(info) }] };
    },
  );

  return server;
}

async function handle(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const server = await buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(request);
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
