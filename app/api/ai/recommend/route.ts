import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const body = await req.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return Response.json({ error: 'A non-empty prompt is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Zurück zum bewährten generateContent mit gemini-2.5-flash, das blitzschnell antwortet
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return Response.json({ result: response.text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return Response.json({ error: message }, { status: 500 });
  }
}