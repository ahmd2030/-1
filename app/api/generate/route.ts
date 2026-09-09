import { NextResponse } from 'next/server';
import { aiRouter } from '@/lib/ai/router';
import { AIGenerationOptions } from '@/lib/ai/provider';

export async function POST(request: Request) {
  try {
    const body: AIGenerationOptions = await request.json();

    if (!body.garmentImage || !body.category || !body.modelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If garmentImage is a Base64 string, upload it to a temporary host (Catbox.moe)
    let finalImageUrl = body.garmentImage;
    if (finalImageUrl.startsWith('data:image')) {
      try {
        console.log("Uploading Base64 image to temporary host from server...");
        const base64Data = finalImageUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', blob, 'garment.jpg');

        const uploadRes = await fetch('https://catbox.moe/user/api.php', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error('Temp upload failed');
        finalImageUrl = await uploadRes.text();
        console.log("Temp image hosted at:", finalImageUrl);
      } catch (err: any) {
        console.error("Temp image upload error:", err);
        return NextResponse.json({ error: 'Failed to process image upload' }, { status: 500 });
      }
    }

    // Process via AI Router with the Hosted URL
    body.garmentImage = finalImageUrl;
    const result = await aiRouter.generateImage(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate image' }, { status: 500 });
  }
}
