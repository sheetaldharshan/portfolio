import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const OPERATOR_KEY = process.env.ASSISTANT_OPERATOR_KEY || "";

const isOperatorAuthorized = (request: Request) => {
  if (!OPERATOR_KEY) return false;
  const incoming = request.headers.get("x-operator-key") || "";
  return incoming === OPERATOR_KEY;
};

export async function GET(request: Request) {
  if (!isOperatorAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseServer
    .from("assistant_push_subscriptions")
    .select("id, endpoint, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to list subscriptions" }, { status: 500 });
  }

  return NextResponse.json({ subscriptions: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint || "").trim();
    const role = String(body?.role || "operator").trim();
    const keys = body?.keys;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("assistant_push_subscriptions")
      .upsert(
        [
          {
            endpoint,
            role,
            p256dh: String(keys.p256dh),
            auth: String(keys.auth),
            user_agent: request.headers.get("user-agent") || null,
          },
        ],
        { onConflict: "endpoint" }
      )
      .select("id, endpoint")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, subscription: data });
  } catch (error) {
    console.error("assistant subscribe POST error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint || "").trim();
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("assistant_push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);

    if (error) {
      return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("assistant subscribe DELETE error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
