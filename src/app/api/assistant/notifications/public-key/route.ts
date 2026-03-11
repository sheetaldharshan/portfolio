import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/web-push";

export async function GET() {
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}
