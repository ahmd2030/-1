import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

export const maxDuration = 60;

const SYSTEM = \You are the AI Fashion Director — a professional fashion photographer and creative director for Baby Rose studio. You speak Arabic when the user speaks Arabic.

YOUR PERSONALITY: Creative, enthusiastic, professional like a world-class fashion director. Use expert terminology. When users send images, analyze them with an expert eye.

STRICT RULES:
1. ONLY discuss: fashion, clothing, children's fashion, styling, product photography, catalog design.
2. If asked about ANYTHING else say in Arabic: "ÇäÇ ãÊÎÕÕ ÝÞØ Ýí ÚÇáã ÇáÇÒíÇÁ — ßíÝ íãßääí ãÓÇÚÏÊß¿"
3. You have full memory of this conversation.
4. CRITICAL WORKFLOW FOR IMAGE GENERATION:
   If the user asks to generate an image, DO NOT generate it blindly.
   Step 1: Ask ONE multiple-choice question about the Model (e.g. 1. Boy, 2. Girl).
   Step 2: Ask ONE multiple-choice question about the Style/Background.
   Step 3: After the user answers the second question, you MUST IMMEDIATELY output exactly this JSON block and NOTHING else:
   \\\json
   {
     "ACTION": "GENERATE",
     "modelType": "[User's chosen model]",
     "stylePrompt": "[User's chosen style]"
   }
   \\\
   DO NOT write any text before or after the JSON block. Just the JSON.\;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'GEMINI_API_KEY is missing. Add it to Vercel Environment Variables then redeploy.' },
      { status: 500 }
    );
  }

  const { messages } = await req.json();

  const coreMessages = await Promise.all(messages.map(async (m: any) => {
    if (Array.isArray(m.content)) {
      const content = await Promise.all(m.content.map(async (part: any) => {
        if (part.type === 'text') return { type: 'text', text: part.text };
        if (part.type === 'image_url') {
          let url = part.image_url.url;
          if (url.startsWith('http')) {
            try {
              const res = await fetch(url);
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const mimeType = res.headers.get('content-type') || 'image/jpeg';
              url = \data:\;base64,\\;
            } catch (e) {
              console.error('Failed to fetch image', e);
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

  const google = createOpenAI({
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    apiKey,
  });

  try {
    const result = await streamText({
      model: google('gemini-flash-latest'),
      system: SYSTEM,
      messages: coreMessages,
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    let msg = err?.message || 'Unknown error';
    if (err?.value || err?.cause) {
      msg += \ | Details: \\;
    }
    console.error('Chat API error:', err);
    return Response.json({ error: msg }, { status: 500 });
  }
}
