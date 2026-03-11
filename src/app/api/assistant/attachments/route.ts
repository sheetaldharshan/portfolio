import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const ATTACHMENTS_BUCKET = process.env.ASSISTANT_ATTACHMENTS_BUCKET || "assistant-attachments";
const MAX_FILE_SIZE_BYTES = Number(process.env.ASSISTANT_MAX_FILE_BYTES || 10 * 1024 * 1024);

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const conversationId = String(formData.get("conversationId") || "").trim();
    const file = formData.get("file");

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: `File exceeds ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))}MB limit` }, { status: 400 });
    }

    const { data: conversation } = await supabaseServer
      .from("assistant_conversations")
      .select("id")
      .eq("id", conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = sanitizeFileName(file.name || "upload.bin");
    const path = `${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${fileName}`;

    const { error: uploadError } = await supabaseServer.storage
      .from(ATTACHMENTS_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: `Upload failed. Ensure bucket '${ATTACHMENTS_BUCKET}' exists and is accessible.`,
        },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseServer.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);

    return NextResponse.json({
      attachment: {
        name: file.name,
        url: publicData.publicUrl,
        type: file.type || "application/octet-stream",
        size: file.size,
        path,
      },
    });
  } catch (error) {
    console.error("assistant attachments POST error", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
