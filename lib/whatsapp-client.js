const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || "v23.0";

export function whatsappConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim() && process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
}

export async function sendWhatsAppText(to, body) {
  if (!whatsappConfigured()) throw new Error("WhatsApp Cloud API is not configured.");
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID.trim()}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type: "text", text: { body } }),
      cache: "no-store",
    },
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `WhatsApp API HTTP ${response.status}`);
  return data;
}

export async function uploadWhatsAppMedia(file) {
  if (!whatsappConfigured()) throw new Error("WhatsApp Cloud API is not configured.");
  const form = new FormData();
  form.set("messaging_product", "whatsapp");
  form.set("file", file, file.name);
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID.trim()}/media`, {
    method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN.trim()}` }, body: form, cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) throw new Error(data?.error?.message || `WhatsApp media upload HTTP ${response.status}`);
  return data.id;
}

export async function sendWhatsAppMedia(to, { mediaId, type, filename, caption }) {
  const media = { id: mediaId };
  if (caption) media.caption = caption.slice(0, 1024);
  if (type === "document" && filename) media.filename = filename.slice(0, 240);
  const response = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID.trim()}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN.trim()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, type, [type]: media }), cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || `WhatsApp media send HTTP ${response.status}`);
  return data;
}
