import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, replicateStep, humanImageUrl, garmentDesc } = body;

    let garmInput = garmentImage;
    if (garmInput && !garmInput.startsWith('data:') && !garmInput.startsWith('http')) {
      garmInput = `data:image/jpeg;base64,${garmInput}`;
    }

    if (replicateStep === 1) {
      // Step 1: Generate Human Model using FLUX
      let subjectPrompt = modelType || 'person';
      if (modelType && (modelType.includes('girl') || modelType === 'woman')) {
        subjectPrompt += ' with long beautiful hair';
      }
      
      let baseOutfit = "a blank tight white tank top and plain jeans";
      if (category === "bottoms") baseOutfit = "a plain t-shirt and tight white shorts";
      if (category === "one-pieces") baseOutfit = "a plain tight white full-body bodysuit or simple white dress";
      
      const fluxPrompt = `A hyper-realistic, raw DSLR masterpiece portrait of ${subjectPrompt}, standing upright, wearing ${baseOutfit}. ENVIRONMENT AND SETTING: ${style || 'High-end indoor studio'}. Soft natural skin texture, perfect lighting, full body shot.`;
      
      console.log("Creating FLUX prediction on Fal.ai...");
      const { request_id } = await fal.queue.submit("fal-ai/flux/schnell", {
        input: {
          prompt: fluxPrompt,
          image_size: "portrait_4_3",
          num_images: 1,
          sync_mode: false
        }
      });
      
      return NextResponse.json({
        id: request_id + '|fal-ai/flux/schnell',
        provider: 'fal',
        stage: 'flux',
        status: 'processing'
      });
    } 
    else if (replicateStep === 2) {
      // Step 2: Apply Garment using Fashn v1.6 on Fal.ai!
      
      let humanInput = humanImageUrl || modelImage;
      if (typeof humanInput === 'string' && !humanInput.startsWith('data:') && !humanInput.startsWith('http')) {
        humanInput = `data:image/jpeg;base64,${humanInput}`;
      }
      
      let fashnCategory: "tops" | "bottoms" | "one-pieces" = "tops";
      if (category === "bottoms") fashnCategory = "bottoms";
      if (category === "one-pieces") fashnCategory = "one-pieces";
      
      console.log("Removing background on Fal.ai to clean flatlay...");
      let cleanGarmInput = garmInput;
      try {
        const bgResult = await fal.subscribe("fal-ai/bria/background/remove", {
          input: { image_url: garmInput }
        });
        if (bgResult?.data?.image?.url) {
          cleanGarmInput = bgResult.data.image.url;
        }
      } catch (err) {
        console.error("BG removal failed, using original garment", err);
      }

      console.log("Creating Fashn v1.6 prediction on Fal.ai...");
      const { request_id } = await fal.queue.submit("fal-ai/fashn/tryon/v1.6", {
        input: {
          model_image: humanInput,
          garment_image: cleanGarmInput,
          category: fashnCategory
        }
      });
      
      return NextResponse.json({
        id: request_id + '|fal-ai/fashn/tryon/v1.6',
        provider: 'fal',
        stage: 'vton',
        status: 'processing'
      });
    }

    return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
  } catch (error: any) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
