import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const SYSTEM = `You are the "AI Fashion Director" — a professional fashion photographer and creative director working exclusively for Baby Rose studio. You speak Arabic when the user speaks Arabic, and English when they speak English.

YOUR PERSONALITY:
- Creative, enthusiastic, and professional like a world-class fashion director.
- Use expert terminology (soft lighting, satin, boho, summer vibe, editorial, flat-lay, etc.)
- When users send you images, analyze them with an expert eye: fabric quality, color palette, season suitability, styling suggestions.

STRICT RULES:
1. You ONLY discuss: fashion, clothing, children's fashion, styling, product photography, catalog design, montage, brand identity, seasonal trends.
2. If asked about ANYTHING else politely say in Arabic: "انا متخصص فقط في عالم الازياء — كيف يمكنني مساعدتك في هذا المجال؟"
3. When you need info about latest trends, use the webSearch tool first, then answer.
4. When user wants to generate professional photos, gather all details then trigger the generateFashionImages tool.
5. You have full memory of this conversation — refer back to previous messages when relevant.`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is missing. Add it to Vercel Environment Variables then redeploy.' },
      { status: 500 }
    );
  }

  // Use Google's OpenAI-compatible endpoint — no extra package needed!
  const google = createOpenAI({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey,
  });

  const { messages } = await req.json();

  try {
    const result = await streamText({
      model: google('gemini-2.0-flash'),
      system: SYSTEM,
      messages,
      tools: {
        webSearch: tool({
          description: 'Search the web for the latest fashion trends, seasonal colors, or fashion-related information.',
          parameters: z.object({
            query: z.string().describe('Search query in English or Arabic'),
          }),
          execute: async ({ query }) => {
            const tavilyKey = process.env.TAVILY_API_KEY;
            if (!tavilyKey) {
              return { error: 'Web search not configured. Add TAVILY_API_KEY to Vercel.' };
            }
            try {
              const res = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: tavilyKey, query, max_results: 5 }),
              });
              const data = await res.json();
              return {
                results: data.results?.map((r: any) => ({
                  title: r.title,
                  content: r.content?.slice(0, 400),
                  url: r.url,
                })) ?? [],
              };
            } catch {
              return { error: 'Search failed.' };
            }
          },
        }),
        generateFashionImages: tool({
          description: 'Trigger professional AI image generation after agreeing with the user on all details.',
          parameters: z.object({
            imageUrls: z.array(z.string()),
            brandName: z.string().optional(),
            promoText: z.string().optional(),
            modelType: z.enum(['boy', 'girl', 'man', 'woman']),
            stylePrompt: z.string().optional(),
          }),
          execute: async (args) => {
            return { status: 'ready', details: args };
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    return Response.json({ error: msg }, { status: 500 });
  }
}
