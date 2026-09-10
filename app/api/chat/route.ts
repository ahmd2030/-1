import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai('gpt-4o'),
    system: 'ÃäÊ ãÓÇÚÏ Ğßí ãÎÑÌ ÃÒíÇÁ ãÍÊÑİ áãæŞÚ Baby Rose. ÇÓãß ÇáãÎÑÌ ÇáĞßí. ãåãÊß åí ãÓÇÚÏÉ ÇáãÓÊÎÏãíä İí ÊæáíÏ ÕæÑ ÇÍÊÑÇİíÉ áãáÇÈÓ ÇáÃØİÇá æÛíÑåÇ. ÚäÏãÇ íÑİÚ ÇáãÓÊÎÏã ÕæÑ æíØáÈ ÊÚÏíáÇÊ (ÅÖÇİÉ ÔÚÇÑ¡ ÊÛííÑ ÇáãæÏíá¡ ÊÍÏíÏ ÇáãŞÇÓ)¡ Şã ÈÊÍáíá ØáÈå ÈáØİ æÇÍÊÑÇİíÉ. ÇÓÃáå ÃÓÆáÉ ÊæÖíÍíÉ ÅĞÇ áÒã ÇáÃãÑ (ãËáÇğ: åá ÊİÖá ÎáİíÉ ÇÓÊæÏíæ Ãã ØÈíÚÉ¿ åá ÊÑíÏ ÇáãæÏíá æáÏ Ãã ÈäÊ¿). ÈãÌÑÏ Ãä ÊÊİŞÇ Úáì ÇáÊİÇÕíá¡ Şã ÈÊÔÛíá ÃÏÇÉ ÊæáíÏ ÇáÕæÑ. ßä ãÈÏÚÇğ æÛíÑ ÊŞáíÏí İí ÑÏæÏß.',
    messages,
    tools: {
      generateFashionImages: {
        description: 'Şã ÈÊÔÛíá åĞå ÇáÃÏÇÉ áÈÏÁ ÊæáíÏ ÇáÕæÑ ÈÚÏ ÇáÇÊİÇŞ ãÚ ÇáãÓÊÎÏã Úáì ÇáÊİÇÕíá',
        parameters: z.object({
          imageUrls: z.array(z.string()).describe('ÑæÇÈØ ÇáÕæÑ ÇáÊí ÑİÚåÇ ÇáãÓÊÎÏã'),
          brandName: z.string().optional().describe('ÇÓã ÇáÈÑÇäÏ ÇáãØáæÈ ÅÖÇİÊå ááÕæÑÉ'),
          promoText: z.string().optional().describe('ÇáäÕ ÇáÏÚÇÆí Ãæ ÑŞã ÇáãæÏíá Ãæ ÇáãŞÇÓ ÇáãØáæÈ ÅÖÇİÊå'),
          modelType: z.enum(['boy', 'girl', 'man', 'woman']).describe('äæÚ ÇáÚÇÑÖ ÇáãØáæÈ'),
          stylePrompt: z.string().optional().describe('æÕİ ÓÊÇíá ÇáÅÖÇÁÉ Ãæ ÇáÎáİíÉ ÅĞÇ Êã ÇáÇÊİÇŞ ÚáíåÇ'),
        }),
        execute: async (args) => {
          // The actual generation will be handled by the client UI to avoid Vercel timeouts.
          // We just return the parsed intent to the client.
          return { status: 'starting_generation', details: args };
        }
      }
    }
  });

  return result.toDataStreamResponse();
}
