import { AIProvider, AIGenerationOptions, AIGenerationResult } from './provider';

const DEFAULT_MODELS: Record<string, string> = {
  man: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&q=80',
  woman: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  boy: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=800&q=80',
  girl: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&q=80',
};

export class FashnProvider implements AIProvider {
  name = 'fashn';

  async generate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      throw new Error('FASHN_API_KEY is not configured');
    }

    let fashnCategory = 'tops';
    if (options.category) {
       if (options.category.toLowerCase().includes('pant') || options.category.toLowerCase().includes('skirt') || options.category.toLowerCase().includes('bottom')) {
         fashnCategory = 'bottoms';
       } else if (options.category.toLowerCase().includes('dress') || options.category.toLowerCase().includes('jumpsuit') || options.category.toLowerCase().includes('one-piece')) {
         fashnCategory = 'one-pieces';
       }
    }

    try {
      console.log('Calling FASHN API...');
      
      const modelName = options.modelImage ? 'tryon-max' : 'product-to-model';
      
      const promptText = `A highly detailed, professional fashion photography shot of a ${options.modelType || 'person'} wearing the garment. ${options.style || 'High fashion, studio lighting, 8k resolution, photorealistic.'}`;
      const negativePrompt = 'ugly, deformed, bad anatomy, mannequins, text, watermark, bad lighting, low quality, cartoon, illustration';

      const inputs: any = {
        product_image: options.garmentImage,
        category: fashnCategory,
        prompt: promptText,
        negative_prompt: negativePrompt,
        num_samples: 1
      };

      if (options.modelImage) {
        inputs.model_image = options.modelImage;
      } else {
        inputs.garment_direction = 'front';
      }

      const response = await fetch('https://api.fashn.ai/v1/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_name: modelName,
          inputs: inputs
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FASHN API Error Details:', errorText);
        throw new Error(`FASHN API Error: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('FASHN returned error:', data.error);
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      if (data.id) {
        return await this.pollStatus(data.id, apiKey);
      }

      const outputUrl = data.output?.[0] || data.image_url;
      
      if (!outputUrl) {
        console.error('Unexpected FASHN response:', data);
        throw new Error('Invalid response format from FASHN API');
      }

      return {
        id: data.id || `fashn-${Date.now()}`,
        imageUrl: outputUrl,
        provider: 'fashn',
        model: modelName,
        cost: 1,
      };
    } catch (error) {
      console.error('Fashn Provider Error:', error);
      throw error;
    }
  }

  private async pollStatus(id: string, apiKey: string): Promise<AIGenerationResult> {
    let attempts = 0;
    const maxAttempts = 40; 
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      });
      
      if (!response.ok) throw new Error('Failed to poll FASHN status');
      
      const data = await response.json();
      
      if (data.status === 'completed' || data.status === 'succeeded') {
        return {
          id: id,
          imageUrl: data.output?.[0] || data.image_url,
          provider: 'fashn',
          model: 'tryon-max',
          cost: 1,
        };
      } else if (data.status === 'failed' || data.error) {
        throw new Error(data.error || 'FASHN generation failed');
      }
      
      attempts++;
    }
    
    throw new Error('Timeout waiting for FASHN API');
  }
}
