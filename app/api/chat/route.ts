import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const SYSTEM = `You are the AI Fashion Director — a professional fashion photographer and creative director for Baby Rose studio. You speak Arabic when the user speaks Arabic.

YOUR PERSONALITY: Creative, enthusiastic, professional like a world-class fashion director. Use expert terminology (soft lighting, satin, boho, summer vibe, editorial, flat-lay, etc.). When users send images, analyze them with an expert eye.

STRICT RULES:
1. ONLY discuss: fashion, clothing, children's fashion, styling, product photography, catalog design, montage, brand identity, seasonal trends.
2. If asked about ANYTHING else say in Arabic: "انا متخصص فقط في عالم الازياء — كيف يمكنني مساعدتك؟"
3. You have full memory of this conversation.
4. Be creative, inspiring, and very helpful.`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is missing. Add it to Vercel Environment Variables then redeploy.' },
      { status: 500 }
    );
  }

  const { messages } = await req.json();

  // Manually convert to CoreMessage[] since useChat sends content as an array for images
  const coreMessages = messages.map((m: any) => {
    if (Array.isArray(m.content)) {
      return {
        role: m.role,
        content: m.content.map((part: any) => {
          if (part.type === 'text') return { type: 'text', text: part.text };
          if (part.type === 'image_url') return { type: 'image', image: new URL(part.image_url.url) };
          return part;
        }),
      };
    }
    return m;
  });

  const google = createOpenAI({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey,
  });

  try {
    const result = await streamText({
      model: google('gemini-flash-latest'),
      system: SYSTEM,
      messages: coreMessages,
      tools: {
        webSearch: tool({
          description: 'Search the web for the latest fashion trends, seasonal colors, or fashion-related information.',
          parameters: z.object({
            query: z.string().describe('Search query in English or Arabic'),
          }),
          execute: async ({ query }) => {
            const tavilyKey = process.env.TAVILY_API_KEY;
            if (!tavilyKey) return { error: 'Web search not configured.' };
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
            const { FashnProvider } = await import('@/lib/ai/fashn');
            const provider = new FashnProvider();
            
            // Assume the first image is the product, and second (if exists) is inspiration
            const garmentImage = args.imageUrls[0];
            const modelImage = args.imageUrls[1];
            
            if (!garmentImage) {
              return { error: 'لا يوجد صورة منتج. يرجى رفع صورة المنتج أولاً.' };
            }

            try {
              const result = await provider.generate({
                garmentImage,
                modelImage,
                category: 'tops', // default category
                modelType: args.modelType,
                style: args.stylePrompt,
              });

              return {
                status: 'success',
                imageUrl: result.imageUrl,
                brandName: args.brandName,
                promoText: args.promoText,
                message: 'تم توليد الصورة بنجاح!'
              };
            } catch (error: any) {
              return { status: 'error', error: error.message };
            }
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    const msg = err?.message || 'Unknown error';
    console.error('Chat API error:', msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
