import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) {
      return NextResponse.json({ error: "A non-empty prompt is required" }, { status: 400 });
    }

    const apiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://cinetrack.vercel.app", // Optional für OpenRouter Rankings
        "X-Title": "CineTrack", // Optional
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free", // Rasend schnell und extrem schlau
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json({ error: `OpenRouter Error: ${apiResponse.status}` }, { status: 502 });
    }

    const data = await apiResponse.json();
    const resultText = data?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ result: resultText });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}