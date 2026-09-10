import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Vercel Serverless: eigenes Timeout-Limit setzen (max. je nach Plan,
// Hobby=10s, Pro=60s Standard, mit config bis 300s möglich)
export const maxDuration = 30; // Sekunden
export const runtime = "nodejs"; // @google/genai braucht Node-Runtime, kein Edge

// gemini-2.5-flash ist für neue Nutzer nicht mehr verfügbar.
// Aktuell (Stand: heute) gültige Nachfolger: "gemini-3.6-flash" (Juli 2026)
// oder das neuere, günstigere "gemini-3.7-flash". Bei Bedarf hier tauschen.
const MODEL_NAME = "gemini-3.6-flash";

// Client außerhalb des Handlers instanziieren → wird zwischen
// Invocations desselben Warm-Containers wiederverwendet.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const prompt = (body as { prompt?: unknown })?.prompt;
  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return NextResponse.json(
      { error: "Field 'prompt' (non-empty string) is required" },
      { status: 400 }
    );
  }

  // Eigener Timeout, damit ein hängender Request nicht bis zum
  // Plattform-Timeout läuft und der Client sauber ein Fehler-JSON bekommt
  // statt einer Endlos-Ladeschleife.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      // config wird ans zugrunde liegende fetch durchgereicht
      config: {
        abortSignal: controller.signal,
      },
    });

    const result = response.text ?? "";

    return NextResponse.json({ result });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Upstream request to Gemini timed out" },
        { status: 504 }
      );
    }

    console.error("Gemini generateContent failed:", err);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}