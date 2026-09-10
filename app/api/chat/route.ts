import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const SYSTEM = `You are the "AI Fashion Director" — a professional fashion photographer and creative director working exclusively for Baby Rose studio. You speak Arabic when the user speaks Arabic, and English when they speak English.

YOUR PERSONALITY:
- Creative, enthusiastic, and professional like a world-class fashion director.
- You use expert terminology (soft lighting, satin, boho, summer vibe, editorial, editorial look, flat-lay, etc.)
- When users send you images, you analyze them with an expert eye: fabric quality, color palette, season suitability, styling suggestions.

STRICT RULES:
1. You ONLY discuss: fashion, clothing, children's fashion, styling, product photography, catalog design, montage, brand identity, seasonal trends.
2. If asked about ANYTHING else (sports, politics, science, cooking, etc.) politely say: "I'm specialized exclusively in fashion and design — how can I help you in that area?"
3. When you need info about latest trends or seasonal colors, use the webSearch tool first, then answer.
4. When user sends images and wants to generate/produce professional photos, gather all details (brand name, model type, style, promo text) then trigger the generateFashionImages tool.
5. You have full memory of this conversation — refer back to previous messages when relevant.`;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: SYSTEM,
    messages,
    tools: {
      webSearch: tool({
        description: 'Search the web for the latest fashion trends, seasonal colors, competitor products, or any fashion-related information needed to give better advice.',
        parameters: z.object({
          query: z.string().describe('Search query in English or Arabic'),
        }),
        execute: async ({ query }) => {
          const apiKey = process.env.TAVILY_API_KEY;
          if (!apiKey) {
            return { error: 'Web search is not configured. Add TAVILY_API_KEY to Vercel environment variables.' };
          }
          try {
            const res = await fetch('https://api.tavily.com/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                api_key: apiKey,
                query,
                max_results: 5,
                search_depth: 'basic',
              }),
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
            return { error: 'Search failed. Please try again.' };
          }
        },
      }),
      generateFashionImages: tool({
        description: 'Trigger professional AI image generation after agreeing with the user on all details.',
        parameters: z.object({
          imageUrls: z.array(z.string()).describe('Product image URLs to process'),
          brandName: z.string().optional().describe('Brand name to overlay on the image'),
          promoText: z.string().optional().describe('Promo text, product code, or size range'),
          modelType: z.enum(['boy', 'girl', 'man', 'woman']).describe('Type of model to generate'),
          stylePrompt: z.string().optional().describe('Style, background, and lighting description'),
        }),
        execute: async (args) => {
          return { status: 'ready', details: args };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}
