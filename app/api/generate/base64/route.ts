import { NextResponse } from 'next/server';
import Replicate from 'replicate';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60;

async function uploadToHost(base64Image: string) {
  try {
    const parts = base64Image.split(';');
    const mimeMatch = parts[0].match(/:(.*?)$/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpg';
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    
    const buffer = Buffer.from(base64Data, 'base64');
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('fileToUpload', new Blob([buffer], { type: mimeType }), 'image.' + ext);

    const uploadRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload image to catbox');
    }

    const url = await uploadRes.text();
    return url;
  } catch (e) {
    console.error("uploadToHost error:", e);
    return base64Image; // fallback to base64 if upload fails
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { garmentImage, modelImage, modelType, style, category, replicateStep, humanImageUrl } = body;

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
      
      const fluxPrompt = `A hyper-realistic, raw DSLR masterpiece portrait of ${subjectPrompt}, standing upright, wearing a blank tight white tank top and plain jeans. ENVIRONMENT AND SETTING: ${style || 'High-end indoor studio'}. Soft natural skin texture, perfect lighting, full body shot.`;
      
      console.log("Creating FLUX prediction...");
      const prediction = await replicate.predictions.create({
        model: "black-forest-labs/flux-schnell",
        input: {
          prompt: fluxPrompt,
          aspect_ratio: "3:4",
          output_format: "png",
          num_outputs: 1
        }
      });
      
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
      
      let garmInput = garmentImage;
      if (garmentImage && garmentImage.startsWith('data:')) {
        garmInput = await uploadToHost(garmentImage);
      }
      
      let humanInput = humanImageUrl || modelImage;
      if (humanInput && humanInput.startsWith('data:')) {
        humanInput = await uploadToHost(humanInput);
      }
      
      console.log("Creating IDM-VTON prediction with URL inputs...");
      const prediction = await replicate.predictions.create({
        version: "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
        input: {
          crop: false,
          seed: 42,
          steps: 30,
          category: vtonCategory,
          garm_img: garmInput,
          human_img: humanInput,
          garment_des: "a beautiful fashion garment"
        }
      });
      
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
