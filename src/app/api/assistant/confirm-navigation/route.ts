import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";

const fallbackDecision = (message: string) => {
  const normalized = message.trim().toLowerCase();
  if (!normalized) return "unclear";

  if (/(^|\b)(yes|yeah|yep|sure|okay|ok|go ahead|please do|do it|take me there|open it|move me|sounds good|why not)(\b|$)/i.test(normalized)) {
    return "confirm";
  }

  if (/(^|\b)(no|nope|nah|not now|stay here|don't|do not|leave it)(\b|$)/i.test(normalized)) {
    return "reject";
  }

  return "unclear";
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message || "").trim();

    if (!message) {
      return NextResponse.json({ decision: "unclear" });
    }

    if (!groq) {
      return NextResponse.json({ decision: fallbackDecision(message) });
    }

    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      temperature: 0,
      max_tokens: 4,
      messages: [
        {
          role: "system",
          content:
            "Classify the user's message as one of: confirm, reject, unclear. This is for confirming whether they want to navigate to another page or section. Return exactly one word: confirm, reject, or unclear.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const rawDecision = completion.choices[0]?.message?.content?.trim().toLowerCase() || "unclear";
    const decision = rawDecision === "confirm" || rawDecision === "reject" || rawDecision === "unclear"
      ? rawDecision
      : fallbackDecision(message);

    return NextResponse.json({ decision });
  } catch {
    return NextResponse.json({ decision: "unclear" });
  }
}