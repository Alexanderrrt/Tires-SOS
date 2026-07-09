const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";

export async function notifyLead({ type, name, phone, email, message, vehicle, service }) {
  const body = [
    `LEAD: ${type || "CHAT"}`,
    `Name: ${name || "N/A"}`,
    `Phone: ${phone || "N/A"}`,
    email ? `Email: ${email}` : null,
    vehicle ? `Vehicle: ${vehicle}` : null,
    service ? `Service: ${service}` : null,
    `Msg: ${(message || "N/A").slice(0, 240)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const payload = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY,
    template_params: {
      to_email: "9834564801@vtext.com",
      from_name: name || "Website Lead",
      from_email: email || "lead@tiressos.com",
      message: body,
    },
  };

  const res = await fetch(EMAILJS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`EmailJS send failed (${res.status}): ${text}`);
  }
}
