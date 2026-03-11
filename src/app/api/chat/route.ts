import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { supabase } from "@/lib/supabase";
import { projects as fallbackProjects } from "@/data/config";

type ProjectPayloadItem = {
    title: string;
    description: string;
    tags: string[];
    link?: string;
    image_url?: string;
};

const PROJECT_CONTEXT_CACHE_TTL_MS = Number(process.env.PROJECT_CONTEXT_CACHE_TTL_MS || 5 * 60 * 1000);
const GROQ_CHAT_MODEL = process.env.GROQ_CHAT_MODEL || "llama-3.1-8b-instant";
const GROQ_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 700);

let projectPayloadCache: { expiresAt: number; payload: ProjectPayloadItem[] } | null = null;

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

const normalizeFallbackProjects = (): ProjectPayloadItem[] => fallbackProjects.map((p) => ({
    title: p.title,
    description: p.description,
    tags: Array.isArray(p.tags) ? p.tags : [],
    link: p.link || undefined,
    image_url: p.image,
}));

const getProjectPayload = async (): Promise<ProjectPayloadItem[]> => {
    const now = Date.now();
    if (projectPayloadCache && projectPayloadCache.expiresAt > now) {
        return projectPayloadCache.payload;
    }

    const { data: projects } = await supabase
        .from("projects")
        .select("title, description, tags, link, image_url")
        .order("order", { ascending: true });

    const normalizedSupabaseProjects = (projects || []).map((p: { title: string; description: string; tags?: string[] | null; link?: string | null; image_url?: string | null }) => ({
        title: p.title,
        description: p.description,
        tags: Array.isArray(p.tags) ? p.tags : [],
        link: p.link || undefined,
        image_url: p.image_url || undefined,
    }));

    const payload = normalizedSupabaseProjects.length > 0 ? normalizedSupabaseProjects : normalizeFallbackProjects();

    projectPayloadCache = {
        payload,
        expiresAt: now + PROJECT_CONTEXT_CACHE_TTL_MS,
    };

    return payload;
};

export async function POST(req: Request) {
    try {
        const { messages, language } = await req.json();

        const userMessages = Array.isArray(messages)
            ? messages.filter((m: { role?: string; content?: string }) => m?.role === "user" && typeof m?.content === "string")
            : [];
        const latestUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";

        const PROJECT_QUERY_REGEX = /(project|projects|portfolio|work|works|show\s+me\s+.*project|what\s+have\s+you\s+built|case\s*stud(y|ies))/i;
        const isProjectIntent = PROJECT_QUERY_REGEX.test(latestUserMessage || "");

        const projectPayload = await getProjectPayload();

        const projectsContext = projectPayload.map((p) =>
            `- ${p.title}: ${p.description} (Tech: ${(p.tags || []).join(", ")}) ${p.link ? `[Link](${p.link})` : ""}`
        ).join("\n") || "No specific projects listed yet.";

        const systemPrompt = `You are an AI replica of Sheetal Dharshan, a Full-Stack Developer & AI Enthusiast. 
Your goal is to answer questions about Sheetal's work, projects, skills, and experience in a helpful and friendly manner.

Sheetal's Portfolio Projects:
${projectsContext}

Sheetal specializes in:
- Frontend: React, Next.js, TypeScript, Tailwind CSS
- Backend: Node.js, Python, Express, FastAPI
- Database: PostgreSQL, MongoDB, Redis

Experience: 2+ years of building web applications.
Education: Bachelor's in Computer Science.

IMPORTANT INSTRUCTION FOR PROJECT RESPONSES:
When the user asks about projects, portfolios, or your work, you MUST include the exact marker [SHOW_PROJECTS] on its own line at the END of your response. Write a brief intro sentence before it but do NOT list the projects as text — the frontend will render them as visual cards automatically. Example:
"Here are some of my notable projects that showcase my skills:
[SHOW_PROJECTS]"

Keep your responses concise, professional, and matching the persona.
Respond in the language specified: ${language || "en"}.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            model: GROQ_CHAT_MODEL,
            temperature: 0.7,
            max_tokens: GROQ_MAX_TOKENS,
            top_p: 1,
            stream: false,
        });

        const content = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

        // Deterministic project-card behavior: include cards for marker OR project-intent prompts.
        const hasProjects = content.includes("[SHOW_PROJECTS]") || isProjectIntent;

        const finalContent = hasProjects && !content.includes("[SHOW_PROJECTS]")
            ? `${content.trim()}\n\n[SHOW_PROJECTS]`
            : content;

        return NextResponse.json({
            content: finalContent,
            ...(hasProjects && { projects: projectPayload })
        });
    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json({ error: "Failed to fetch from Groq" }, { status: 500 });
    }
}
