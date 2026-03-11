import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const OPERATOR_KEY = process.env.ASSISTANT_OPERATOR_KEY || "";

type ConversationStatus = "ai_active" | "human_takeover" | "resolved";

const isOperatorAuthorized = (request: Request) => {
  if (!OPERATOR_KEY) return false;
  const incoming = request.headers.get("x-operator-key") || "";
  return incoming === OPERATOR_KEY;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "visitor";

    if (mode === "admin") {
      if (!isOperatorAuthorized(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data, error } = await supabaseServer
        .from("assistant_conversations")
        .select("*")
        .order("last_message_at", { ascending: false })
        .limit(100);

      if (error) {
        return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
      }

      return NextResponse.json({ conversations: data || [] });
    }

    const visitorSessionId = String(url.searchParams.get("visitorSessionId") || "").trim();
    if (!visitorSessionId) {
      return NextResponse.json({ error: "visitorSessionId is required" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("assistant_conversations")
      .select("*")
      .eq("visitor_session_id", visitorSessionId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
    }

    return NextResponse.json({ conversation: data || null });
  } catch (error) {
    console.error("assistant conversations GET error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const visitorSessionId = String(body?.visitorSessionId || "").trim();
    const visitorName = typeof body?.visitorName === "string" ? body.visitorName.trim() : null;
    const visitorEmail = typeof body?.visitorEmail === "string" ? body.visitorEmail.trim() : null;

    if (!visitorSessionId) {
      return NextResponse.json({ error: "visitorSessionId is required" }, { status: 400 });
    }

    const { data: existing } = await supabaseServer
      .from("assistant_conversations")
      .select("*")
      .eq("visitor_session_id", visitorSessionId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const patch: { visitor_name?: string; visitor_email?: string } = {};
      if (visitorName && visitorName !== existing.visitor_name) patch.visitor_name = visitorName;
      if (visitorEmail && visitorEmail !== existing.visitor_email) patch.visitor_email = visitorEmail;

      if (Object.keys(patch).length > 0) {
        const { data: updated, error: updateError } = await supabaseServer
          .from("assistant_conversations")
          .update(patch)
          .eq("id", existing.id)
          .select("*")
          .single();

        if (updateError) {
          return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
        }

        return NextResponse.json({ conversation: updated });
      }

      return NextResponse.json({ conversation: existing });
    }

    const { data: created, error: createError } = await supabaseServer
      .from("assistant_conversations")
      .insert([
        {
          visitor_session_id: visitorSessionId,
          visitor_name: visitorName,
          visitor_email: visitorEmail,
        },
      ])
      .select("*")
      .single();

    if (createError) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    return NextResponse.json({ conversation: created });
  } catch (error) {
    console.error("assistant conversations POST error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isOperatorAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const conversationId = String(body?.conversationId || "").trim();
    const status = String(body?.status || "").trim() as ConversationStatus;

    if (!conversationId || !["ai_active", "human_takeover", "resolved"].includes(status)) {
      return NextResponse.json({ error: "conversationId and valid status are required" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("assistant_conversations")
      .update({ status })
      .eq("id", conversationId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update conversation status" }, { status: 500 });
    }

    return NextResponse.json({ conversation: data });
  } catch (error) {
    console.error("assistant conversations PATCH error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
