import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

const SYSTEM = `You are the AI Fashion Director — a professional fashion photographer and creative director for Baby Rose studio. You speak Arabic when the user speaks Arabic.

YOUR PERSONALITY: Creative, enthusiastic, professional like a world-class fashion director. Use expert terminology. When users send images, analyze them with an expert eye.

STRICT RULES:
1. ONLY discuss: fashion, clothing, children's fashion, styling, product photography, catalog design.
2. If asked about ANYTHING else say in Arabic: "انا متخصص فقط في عالم الازياء — كيف يمكنني مساعدتك؟"
3. You have full memory of this conversation.
4. CRITICAL WORKFLOW FOR IMAGE GENERATION:
   If the user asks to generate an image, DO NOT generate it blindly.
   Step 1: Ask ONE multiple-choice question about the Model (e.g. 1. Boy, 2. Girl).
   Step 2: Ask ONE multiple-choice question about the Style/Background.
   Step 3: After the user answers the second question, you MUST IMMEDIATELY output exactly this JSON block and NOTHING else:
   \`\`\`json
   {
     "ACTION": "GENERATE",
     "modelType": "[User's chosen model]",
     "stylePrompt": "[User's chosen style]"
   }
   \`\`\`
   DO NOT write any text before or after the JSON block. Just the JSON.`;

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
              url = `data:${mimeType};base64,${buffer.toString('base64')}`;
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

  const google = createGoogleGenerativeAI({
    apiKey,
  });

  try {
    const result = await streamText({
      model: google('gemini-1.5-flash-latest') as any,
      system: SYSTEM,
      messages: coreMessages,
    });
    return result.toDataStreamResponse();
  } catch (err: any) {
    if (err?.message?.includes('Not Found') || err?.message?.includes('not found')) {
      // Fallback 1: gemini-flash-latest
      try {
        const result2 = await streamText({
          model: google('gemini-flash-latest') as any,
          system: SYSTEM,
          messages: coreMessages,
        });
        return result2.toDataStreamResponse();
      } catch (err2: any) {
        // Fallback 2: gemini-2.5-flash
        try {
          const result3 = await streamText({
            model: google('gemini-2.5-flash') as any,
            system: SYSTEM,
            messages: coreMessages,
          });
          return result3.toDataStreamResponse();
        } catch (err3: any) {
           return Response.json({ error: 'All Gemini models threw Not Found. Error: ' + err3.message }, { status: 500 });
        }
      }
    }
    console.error('Chat API error:', err);
    return Response.json({ error: err?.message || 'Unknown server error' }, { status: 500 });
  }
}
