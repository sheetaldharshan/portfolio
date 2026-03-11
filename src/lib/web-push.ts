import webPush, { PushSubscription } from "web-push";

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

let configured = false;

const ensureWebPushConfigured = () => {
  if (configured) return true;
  if (!vapidPublicKey || !vapidPrivateKey) return false;

  webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  configured = true;
  return true;
};

export const sendWebPush = async (
  subscription: PushSubscription,
  payload: Record<string, unknown>
) => {
  if (!ensureWebPushConfigured()) return;

  try {
    await webPush.sendNotification(subscription, JSON.stringify(payload), {
      TTL: 60,
      urgency: "high",
    });
  } catch (error) {
    console.error("web push send error", error);
    throw error;
  }
};

export const getVapidPublicKey = () => vapidPublicKey;
