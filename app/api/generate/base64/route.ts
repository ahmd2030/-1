import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export const maxDuration = 60;

const withRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
  let attempt = 0;
  while (true) {
    try { return await fn(); }
    catch (e: any) {
      if (attempt < maxRetries && e.message && (e.message.includes('429') || e.message.includes('Too Many Requests'))) {
        console.log(`Rate limited (429). Attempt ${attempt + 1}. Waiting 8 seconds before retry...`);
        await new Promise(r => setTimeout(r, 8000));
        attempt++;
        continue;
      }
      throw e;
    }
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, replicateStep, humanImageUrl, garmentDesc } = body;

    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) throw new Error('REPLICATE_API_TOKEN is not configured');
    const replicate = new Replicate({ auth: apiKey });

    // Ensure garmentImage is properly formatted if used
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
      
      console.log("Creating FLUX prediction...");
      const prediction = await withRetry(() => replicate.predictions.create({
        model: "black-forest-labs/flux-schnell",
        input: {
          prompt: fluxPrompt,
          aspect_ratio: "3:4",
          output_format: "png",
          num_outputs: 1
        }
      }));
      
      return NextResponse.json({
        id: prediction.id,
        provider: 'replicate',
        stage: 'flux',
        status: 'processing'
      });
    } 
    else if (replicateStep === 2) {
      // Step 2: Apply Garment using IDM-VTON
      let vtonCategory = "upper_body";
      if (category === "bottoms") vtonCategory = "lower_body";
      if (category === "one-pieces") vtonCategory = "dresses";
      
      // Convert Data URIs to Buffers so Replicate SDK uploads them natively
      let finalGarmInput: any = garmInput;
      if (typeof garmInput === 'string' && garmInput.startsWith('data:')) {
        const b64Data = garmInput.split(',')[1];
        if (b64Data) finalGarmInput = Buffer.from(b64Data, 'base64');
      }
      
      let humanInput: any = humanImageUrl || modelImage;
      if (typeof humanInput === 'string' && humanInput.startsWith('data:')) {
        const b64Data = humanInput.split(',')[1];
        if (b64Data) humanInput = Buffer.from(b64Data, 'base64');
      }
      
      console.log("Removing background from garment image...");
      let cleanGarmInput = finalGarmInput;
      try {
        const rembgOutput = await withRetry(() => replicate.run(
          "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
          { input: { image: finalGarmInput } }
        ));
        if (rembgOutput) {
          if (typeof rembgOutput === 'string') {
            cleanGarmInput = rembgOutput;
          } else if (typeof rembgOutput === 'object' && typeof (rembgOutput as any).getReader === 'function') {
            const chunks: any[] = [];
            const reader = (rembgOutput as any).getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
            }
            cleanGarmInput = Buffer.concat(chunks);
          } else if (Array.isArray(rembgOutput)) {
             cleanGarmInput = rembgOutput[0];
          } else {
             // Fallback
             cleanGarmInput = rembgOutput;
          }
        }
      } catch (err) {
        console.error("Rembg failed, falling back to original", err);
      }

      console.log("Creating IDM-VTON prediction with native Buffer upload...");
      const prediction = await withRetry(() => replicate.predictions.create({
        version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: vtonCategory,
          garm_img: cleanGarmInput,
          human_img: humanInput,
          garment_des: garmentDesc || "a beautiful fashion garment"
        }
      }));
      
      return NextResponse.json({
        id: prediction.id,
        provider: 'replicate',
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
