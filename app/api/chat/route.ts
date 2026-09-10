import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: 'أنت مساعد ذكي مخرج أزياء محترف لموقع Baby Rose. اسمك المخرج الذكي. مهمتك هي مساعدة المستخدمين في توليد صور احترافية لملابس الأطفال وغيرها. عندما يرفع المستخدم صور ويطلب تعديلات (إضافة شعار، تغيير الموديل، تحديد المقاس)، قم بتحليل طلبه بلطف واحترافية. اسأله أسئلة توضيحية إذا لزم الأمر. بمجرد أن تتفقا على التفاصيل، قم بتشغيل أداة توليد الصور.',
    messages,
    tools: {
      generateFashionImages: tool({
        description: 'قم بتشغيل هذه الأداة لبدء توليد الصور بعد الاتفاق مع المستخدم على التفاصيل',
        parameters: z.object({
          imageUrls: z.array(z.string()),
          brandName: z.string().optional(),
          promoText: z.string().optional(),
          modelType: z.enum(['boy', 'girl', 'man', 'woman']),
          stylePrompt: z.string().optional(),
        }),
        execute: async (args) => {
          return { status: 'starting_generation', details: args };
        }
      })
    }
  });

  return result.toDataStreamResponse();
}