import { AIProvider, AIGenerationOptions, AIGenerationResult } from './provider';

export class FashnProvider implements AIProvider {
  name = 'fashn';

  async generate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) {
      throw new Error('FASHN_API_KEY is not configured');
    }

    try {
      console.log('Calling FASHN API...');
      
      const modelName = options.modelImage ? 'tryon-max' : 'product-to-model';
      
      let categoryText = "garment";
      if (options.category === "tops") categoryText = "top/shirt/jacket";
      if (options.category === "bottoms") categoryText = "pants/skirt/bottoms";
      if (options.category === "one-pieces") categoryText = "dress/jumpsuit/full outfit";

      const promptText = `A highly detailed, professional fashion photography shot of a ${options.modelType || 'person'} wearing the ${categoryText}. ${options.style || 'High fashion, studio lighting, 8k resolution, photorealistic.'}, photorealistic, best quality, ultra detailed`;

      const inputs: any = {
        product_image: options.garmentImage,
      };

      // FASHN's tryon-max model accepts these, but product-to-model only accepts product_image and prompt!
      if (options.modelImage) {
        inputs.model_image = options.modelImage;
        inputs.category = options.category === "tops" || options.category === "bottoms" || options.category === "one-pieces" ? options.category : "tops";
      } else {
        // For product-to-model, we only send product_image and prompt. No category, no negative_prompt, no num_samples.
        inputs.prompt = promptText;
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
