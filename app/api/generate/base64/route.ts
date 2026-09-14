import { NextResponse } from 'next/server';
import Replicate from 'replicate';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { garmentImage, modelType, category, style, status } = body;

    // Check for Replicate token
    const apiKey = process.env.REPLICATE_API_TOKEN;
    if (!apiKey) {
      return NextResponse.json({ error: 'REPLICATE_API_TOKEN is missing.' }, { status: 500 });
    }

    const replicate = new Replicate({
      auth: apiKey,
    });

    console.log('Starting Replicate Pipeline (FLUX + IDM-VTON)...');

    // 1. Map Category
    let vtonCategory = "upper_body";
    if (category === "bottoms") vtonCategory = "lower_body";
    if (category === "one-pieces") vtonCategory = "dresses";

    let subjectPrompt = `a ${modelType || 'person'}`;
    if (modelType && (modelType.includes('girl') || modelType === 'woman')) {
      subjectPrompt += ' with long beautiful hair';
    }

    // 2. Step 1: Generate the Human Model using FLUX (Ultra-fast and cheap)
    console.log('Generating human model with FLUX...');
    const fluxPrompt = `A hyper-realistic, raw DSLR masterpiece portrait of ${subjectPrompt}, standing upright, wearing a blank tight white tank top and plain jeans. 
    ENVIRONMENT AND SETTING: ${style || 'High-end indoor studio'}. 
    Soft natural skin texture, perfect lighting, full body shot.`;

    const fluxOutput = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: fluxPrompt,
          width: 768,
          height: 1024,
          refine: "expert_ensemble_refiner",
          apply_watermark: false,
          num_inference_steps: 25
        }
      }
    ) as any;

    if (!fluxOutput) {
      throw new Error("SDXL output is null or undefined.");
    }
    
    // Sometimes Replicate returns a single string instead of an array, or a stream
    let humanImageUrl = "";
    if (Array.isArray(fluxOutput) && fluxOutput.length > 0) {
      humanImageUrl = fluxOutput[0];
    } else if (typeof fluxOutput === 'string') {
      humanImageUrl = fluxOutput;
    } else if (fluxOutput && typeof fluxOutput === 'object' && fluxOutput.url) {
      humanImageUrl = fluxOutput.url;
    } else {
      throw new Error("SDXL returned unknown format: " + JSON.stringify(fluxOutput));
    }

    
    console.log('Human generated:', humanImageUrl);

    // 3. Step 2: Dress the Human using IDM-VTON
    console.log('Applying garment using IDM-VTON...');
    // Add a 3 second delay to prevent Replicate's 429 Too Many Requests (burst limit)
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Make sure garmentImage is a proper Data URI if it's base64
    let garmInput = garmentImage;
    if (!garmInput.startsWith('data:')) {
      garmInput = `data:image/jpeg;base64,${garmInput}`;
    }

    const vtonOutput = await replicate.run(
      "yisol/idm-vton:c02d9fac2614730240a50eda629ff2d109bb10bc4ce87c4850fa15fbe8e121b6",
      {
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: vtonCategory,
          garm_img: garmInput,
          human_img: humanImageUrl,
          garment_des: "a beautiful garment"
        }
      }
    ) as any;

    if (!vtonOutput) {
      throw new Error("Failed to map garment with IDM-VTON.");
    }

    console.log('VTON completed. Output:', vtonOutput);

    // Fetch the result to return as base64 to bypass CORS issues on Canvas
    const imgRes = await fetch(vtonOutput);
    const arrayBuffer = await imgRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const finalBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;

    return NextResponse.json({ imageUrl: finalBase64 });
  } catch (error: any) {
    console.error('Replicate error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
