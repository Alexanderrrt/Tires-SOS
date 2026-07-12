import { createClient } from "@supabase/supabase-js";

const DEFAULT_CLIENTS = [
  {
    id: "tires-sos",
    client_name: "Tires SOS Rescue",
    business_email: "tiressosrescue@gmail.com",
    monthly_fee: 450,
    ad_budget: 500,
    status: "active",
  },
];

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^﻿/, "").trim();
}

export async function GET() {
  const url = cleanEnv(process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("dashboard_clients")
        .select("id, client_name, business_email, monthly_fee, ad_budget, status")
        .order("client_name");
      if (!error && data && data.length > 0) {
        return Response.json(data);
      }
    } catch {
      // fall through to defaults
    }
  }

  return Response.json(DEFAULT_CLIENTS);
}
