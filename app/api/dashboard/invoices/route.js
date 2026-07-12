import { createClient } from "@supabase/supabase-js";

// Invoice list for the Billing view. Reads the invoices table when
// Supabase has one; otherwise returns an auto-generated draft for the
// current month from the standard fee structure so the view is usable
// before the database is set up.

const FEES = { maintenance: 150, ad_management: 300, ad_spend: 500 };

function cleanEnv(value) {
  if (typeof value !== "string") return value;
  return value.replace(/^﻿/, "").trim();
}

function draftInvoice() {
  const now = new Date();
  const month = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  return {
    id: `draft-${now.getFullYear()}-${now.getMonth() + 1}`,
    month,
    items: [
      { label: "Website maintenance & API usage", amount: FEES.maintenance },
      { label: "Ad management service", amount: FEES.ad_management },
      { label: "Ad spend reimbursement", amount: FEES.ad_spend },
    ],
    total: FEES.maintenance + FEES.ad_management + FEES.ad_spend,
    status: "draft",
    generated: true,
  };
}

export async function GET() {
  const url = cleanEnv(process.env.SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (url && key) {
    try {
      const supabase = createClient(url, key, { auth: { persistSession: false } });
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(24);
      if (!error && data && data.length > 0) {
        const invoices = data.map((inv) => ({
          id: inv.id,
          month: inv.invoice_date || inv.created_at?.slice(0, 7) || "—",
          items: [
            inv.website_fee ? { label: "Website delivery", amount: inv.website_fee } : null,
            inv.maintenance_fee ? { label: "Maintenance & API usage", amount: inv.maintenance_fee } : null,
            inv.management_fee ? { label: "Ad management service", amount: inv.management_fee } : null,
            inv.ad_spend ? { label: "Ad spend reimbursement", amount: inv.ad_spend } : null,
          ].filter(Boolean),
          total: inv.total_amount || 0,
          status: inv.status || "pending",
          generated: false,
        }));
        return Response.json({ invoices });
      }
    } catch {
      // fall through to draft
    }
  }

  return Response.json({ invoices: [draftInvoice()] });
}
