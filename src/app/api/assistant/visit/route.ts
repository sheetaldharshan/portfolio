import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendWebPush } from "@/lib/web-push";

const maybeSendEmailAlert = async (payload: Record<string, unknown>) => {
  const webhook = process.env.ASSISTANT_EMAIL_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("assistant visit email alert webhook error", error);
  }
};

const maybeSendWhatsAppAlert = async (payload: Record<string, unknown>) => {
  const webhook = process.env.ASSISTANT_WHATSAPP_WEBHOOK_URL;
  if (!webhook) return;

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("assistant visit whatsapp alert webhook error", error);
  }
};

const maybeSendTelegramAlert = async (text: string) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (error) {
    console.error("assistant visit telegram alert error", error);
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const path = String(body?.path || "/").slice(0, 200);
    const visitorSessionId = String(body?.visitorSessionId || "").slice(0, 120);
    const referrer = String(body?.referrer || "direct").slice(0, 600);
    const language = String(body?.language || "unknown").slice(0, 80);
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (!visitorSessionId) {
      return NextResponse.json({ error: "visitorSessionId is required" }, { status: 400 });
    }

    const alertPayload = {
      type: "visit",
      title: "New Website Visitor",
      message: `A visitor opened ${path}`,
      path,
      referrer,
      language,
      userAgent,
      occurredAt: new Date().toISOString(),
    };

    await Promise.all([
      maybeSendEmailAlert(alertPayload),
      maybeSendWhatsAppAlert(alertPayload),
      maybeSendTelegramAlert(
        `New website visitor\nPath: ${path}\nReferrer: ${referrer}\nLanguage: ${language}`
      ),
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
                title: "New Website Visitor",
                body: `Visitor opened ${path}`,
                url: "/admin/chat",
                tag: `visit-${visitorSessionId}`,
              }
            );
          } catch {
            // Keep API stable even if push fails.
          }
        })
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("assistant visit POST error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
