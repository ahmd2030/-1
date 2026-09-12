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
  const coreMessages = await Promise.all(messages.map(async (m: any) => {
    if (Array.isArray(m.content)) {
      const content = await Promise.all(m.content.map(async (part: any) => {
        if (part.type === 'text') return { type: 'text', text: part.text };
        if (part.type === 'image_url') {
          let url = part.image_url.url;
          // If it's already base64, just use it.
          if (url.startsWith('http')) {
            try {
              const res = await fetch(url);
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const mimeType = res.headers.get('content-type') || 'image/jpeg';
              url = `data:${mimeType};base64,${buffer.toString('base64')}`;
            } catch (e) {
              console.error('Failed to fetch image for base64 conversion', e);
            }
          }
          return { type: 'image', image: url };
        }
        return part;
      }));
      return { role: m.role, content };
    }
    return m;
  }));

  // Collect all base64 images from the user's history
  const allUserImages: string[] = [];
  coreMessages.forEach(m => {
    if (m.role === 'user' && Array.isArray(m.content)) {
      m.content.forEach((part: any) => {
        if (part.type === 'image') allUserImages.push(part.image);
      });
    }
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
          description: 'Trigger professional AI image generation after agreeing with the user on all details. Always use the most recently uploaded image.',
          parameters: z.object({
            imageIndex: z.number().optional().describe("0 for the very first image uploaded, 1 for the second, etc. If omitted, uses the most recently uploaded image."),
            brandName: z.string().optional(),
            promoText: z.string().optional(),
            modelType: z.enum(['boy', 'girl', 'man', 'woman']),
            stylePrompt: z.string().optional(),
          }),
          execute: async (args) => {
            const { FashnProvider } = await import('@/lib/ai/fashn');
            const provider = new FashnProvider();
            
            // Get image from the accumulated history
            const targetIndex = args.imageIndex !== undefined ? args.imageIndex : allUserImages.length - 1;
            const garmentImage = allUserImages[targetIndex];
            
            if (!garmentImage) {
              return { error: 'لا يوجد صورة منتج. يرجى رفع صورة المنتج أولاً.' };
            }

            try {
              const result = await provider.generate({
                garmentImage, // Pass base64 directly to FASHN
                category: 'tops',
                modelType: args.modelType,
                style: args.stylePrompt,
              });

              return {
                status: 'success',
                imageUrl: result.imageUrl, // FASHN returns a URL
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
    let msg = err?.message || 'Unknown error';
    if (err?.value || err?.cause) {
      msg += ` | Details: ${JSON.stringify(err.value || err.cause)}`;
    }
    console.error('Chat API error:', err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
