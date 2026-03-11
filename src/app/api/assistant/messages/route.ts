import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabaseServer } from "@/lib/supabase-server";
import { sendWebPush } from "@/lib/web-push";

type AssistantAttachment = {
  name: string;
  url: string;
  type?: string;
  size?: number;
};

const OPERATOR_KEY = process.env.ASSISTANT_OPERATOR_KEY || "";
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";
const GROQ_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 450);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const isOperatorAuthorized = (request: Request) => {
  if (!OPERATOR_KEY) return false;
  const incoming = request.headers.get("x-operator-key") || "";
  return incoming === OPERATOR_KEY;
};

const buildAssistantPrompt = (language: string) =>
  `You are SheetalDharshan Assistant, an AI helper for Sheetal Dharshan's portfolio website.\nBe concise, warm, and helpful. If the user asks for hiring, services, or project details, guide them clearly.\nRespond in language: ${language || "en"}.`;

const maybeSendEmailAlert = async (payload: {
  conversationId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  message: string;
}) => {
  const webhook = process.env.ASSISTANT_EMAIL_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("assistant email alert webhook error", error);
  }
};

const maybeSendWhatsAppAlert = async (payload: {
  conversationId: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  message: string;
}) => {
  const webhook = process.env.ASSISTANT_WHATSAPP_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("assistant whatsapp alert webhook error", error);
  }
};

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId") || "";
  const actor = request.nextUrl.searchParams.get("actor") || "visitor";
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("assistant_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }

  if (actor === "operator") {
    if (isOperatorAuthorized(request)) {
      await supabaseServer
        .from("assistant_conversations")
        .update({ unread_for_operator: 0 })
        .eq("id", conversationId);
    }
  } else {
    await supabaseServer
      .from("assistant_conversations")
      .update({ unread_for_visitor: 0 })
      .eq("id", conversationId);
  }

  return NextResponse.json({ messages: data || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const conversationId = String(body?.conversationId || "").trim();
    const content = String(body?.content || "").trim();
    const senderRole = String(body?.senderRole || "visitor").trim();
    const language = String(body?.language || "en").trim();
    const skipAiResponse = Boolean(body?.skipAiResponse);
    const attachments: AssistantAttachment[] = Array.isArray(body?.attachments)
      ? body.attachments
          .filter((item: unknown) => {
            if (!item || typeof item !== "object") return false;
            const candidate = item as { name?: unknown; url?: unknown };
            return typeof candidate.name === "string" && typeof candidate.url === "string";
          })
          .map((item: unknown) => {
            const typed = item as AssistantAttachment;
            return {
              name: typed.name,
              url: typed.url,
              type: typed.type,
              size: typed.size,
            };
          })
      : [];

    if (!conversationId || (!content && attachments.length === 0)) {
      return NextResponse.json({ error: "conversationId and content or attachments are required" }, { status: 400 });
    }

    if (!["visitor", "operator"].includes(senderRole)) {
      return NextResponse.json({ error: "Invalid senderRole" }, { status: 400 });
    }

    if (senderRole === "operator" && !isOperatorAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: conversation, error: conversationError } = await supabaseServer
      .from("assistant_conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const senderLabel =
      senderRole === "operator"
        ? "Sheetal Dharshan"
        : (conversation.visitor_name as string | null) || "You";

    const { data: insertedMessage, error: insertError } = await supabaseServer
      .from("assistant_messages")
      .insert([
        {
          conversation_id: conversationId,
          sender_role: senderRole,
          sender_label: senderLabel,
          content,
          attachments,
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
    }

    const baseConversationPatch = {
      last_message_at: new Date().toISOString(),
      unread_for_operator: senderRole === "visitor" ? Number(conversation.unread_for_operator || 0) + 1 : Number(conversation.unread_for_operator || 0),
      unread_for_visitor: senderRole === "operator" ? Number(conversation.unread_for_visitor || 0) + 1 : 0,
    };

    await supabaseServer
      .from("assistant_conversations")
      .update(baseConversationPatch)
      .eq("id", conversationId);

    let assistantMessage = null;

    if (senderRole === "visitor" && conversation.status === "ai_active" && !skipAiResponse) {
      try {
        const { data: history } = await supabaseServer
          .from("assistant_messages")
          .select("sender_role, content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(14);

        const mappedHistory = (history || []).map((item) => ({
          role: (item.sender_role === "visitor" ? "user" : "assistant") as "user" | "assistant",
          content: item.content,
        }));

        const completion = await groq.chat.completions.create({
          messages: [{ role: "system" as const, content: buildAssistantPrompt(language) }, ...mappedHistory],
          model: GROQ_CHAT_MODEL,
          temperature: 0.6,
          max_tokens: GROQ_MAX_TOKENS,
        });

        const aiContent = completion.choices[0]?.message?.content?.trim() || "I am here. Could you share a bit more detail?";

        const { data: aiInserted } = await supabaseServer
          .from("assistant_messages")
          .insert([
            {
              conversation_id: conversationId,
              sender_role: "assistant",
              sender_label: "SheetalDharshan Assistant",
              content: aiContent,
              attachments: [],
            },
          ])
          .select("*")
          .single();

        assistantMessage = aiInserted || null;

        await supabaseServer
          .from("assistant_conversations")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", conversationId);
      } catch (aiError) {
        console.error("assistant ai response error", aiError);

        const fallbackContent = "I received your message. Please give me a moment while I prepare the best response.";
        const { data: fallbackInserted } = await supabaseServer
          .from("assistant_messages")
          .insert([
            {
              conversation_id: conversationId,
              sender_role: "assistant",
              sender_label: "SheetalDharshan Assistant",
              content: fallbackContent,
              attachments: [],
            },
          ])
          .select("*")
          .single();

        assistantMessage = fallbackInserted || null;
      }

    }

    if (senderRole === "visitor") {
      await Promise.all([
        maybeSendEmailAlert({
          conversationId,
          visitorName: conversation.visitor_name,
          visitorEmail: conversation.visitor_email,
          message: content,
        }),
        maybeSendWhatsAppAlert({
          conversationId,
          visitorName: conversation.visitor_name,
          visitorEmail: conversation.visitor_email,
          message: content,
        }),
      ]);

      const { data: subscriptions } = await supabaseServer
        .from("assistant_push_subscriptions")
        .select("endpoint, p256dh, auth")
        .eq("role", "operator");

      if (subscriptions && subscriptions.length > 0) {
        await Promise.all(
          subscriptions.map(async (subscription) => {
            try {
              await sendWebPush(
                {
                  endpoint: subscription.endpoint,
                  keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                  },
                },
                {
                  title: "New visitor message",
                  body: content
                    ? `${conversation.visitor_name || "Visitor"}: ${content.slice(0, 110)}`
                    : `${conversation.visitor_name || "Visitor"} sent an attachment`,
                  url: "/admin/chat",
                  tag: `assistant-${conversationId}`,
                }
              );
            } catch {
              // Keep main chat flow resilient even if push delivery fails.
            }
          })
        );
      }
    }

    return NextResponse.json({ message: insertedMessage, assistantMessage });
  } catch (error) {
    console.error("assistant messages POST error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
