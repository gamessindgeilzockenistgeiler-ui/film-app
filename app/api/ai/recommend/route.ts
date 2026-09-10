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

    const client = new GoogleGenAI({ apiKey });

    const interaction = await client.interactions.create({
      model: 'gemini-3.8-flash',
      input: prompt,
    });

    return Response.json({ result: interaction.output_text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return Response.json({ error: message }, { status: 500 });
  }
}