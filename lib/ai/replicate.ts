import { AIProvider, AIGenerationOptions, AIGenerationResult } from './provider';
import Replicate from 'replicate';

export class ReplicateProvider implements AIProvider {
  name = 'replicate';

  async generate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error('REPLICATE_API_TOKEN is not configured');

    const replicate = new Replicate({
      auth: apiKey,
    });

    try {
      let vtonCategory = "upper_body";
      if (options.category === "bottoms") vtonCategory = "lower_body";
      if (options.category === "one-pieces") vtonCategory = "dresses";

      let subjectPrompt = options.modelType || 'person';
      if (options.modelType && (options.modelType.includes('girl') || options.modelType === 'woman')) {
        subjectPrompt += ' with long beautiful hair';
      }

      let humanImageUrl = options.modelImage;
      
      if (!humanImageUrl) {
        console.log('Generating human model with FLUX...');
        const fluxPrompt = `A hyper-realistic, raw DSLR masterpiece portrait of ${subjectPrompt}, standing upright, wearing a blank tight white tank top and plain jeans. ENVIRONMENT AND SETTING: ${options.style || 'High-end indoor studio'}. Soft natural skin texture, perfect lighting, full body shot.`;

        const fluxOutput = await replicate.run(
          "black-forest-labs/flux-schnell",
          {
            input: {
              prompt: fluxPrompt,
              aspect_ratio: "3:4",
              output_format: "png",
              num_outputs: 1
            }
          }
        ) as any;

        if (!fluxOutput || fluxOutput.length === 0) {
          throw new Error("Failed to generate human model from FLUX.");
        }
        humanImageUrl = fluxOutput[0];
        
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log('Applying garment using IDM-VTON...');
      
      const vtonOutput = await replicate.run(
        "yisol/idm-vton:c02d9fac2614730240a50eda629ff2d109bb10bc4ce87c4850fa15fbe8e121b6",
        {
          input: {
            crop: false,
            seed: 42,
            steps: 30,
            category: vtonCategory,
            garm_img: options.garmentImage,
            human_img: humanImageUrl,
            garment_des: "a beautiful fashion garment"
          }
        }
      ) as any;

      if (!vtonOutput) {
        throw new Error("Failed to map garment with IDM-VTON.");
      }
      
      const rawUrl = typeof vtonOutput === 'string' ? vtonOutput : (vtonOutput[0] || vtonOutput);
      
      // Proxy image to base64 to avoid Canvas CORS errors
      let finalImageUrl = rawUrl;
      try {
        const imgRes = await fetch(rawUrl);
        if (imgRes.ok) {
           const arrayBuffer = await imgRes.arrayBuffer();
           const buffer = Buffer.from(arrayBuffer);
           const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
           finalImageUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
        }
      } catch(e) {
        console.error("Failed to proxy replicate image", e);
      }

      return {
        id: `replicate-${Date.now()}`,
        imageUrl: finalImageUrl,
        provider: 'replicate',
        model: 'idm-vton',
        cost: 1,
        status: 'completed'
      };
    } catch (error: any) {
      console.error('Replicate Provider Error:', error);
      throw error;
    }
  }

  async getStatus(id: string): Promise<AIGenerationResult> {
     throw new Error('Not implemented for sync mode');
  }
}
