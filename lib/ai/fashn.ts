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

      let subjectPrompt = `a ${options.modelType || 'person'}`;
      if (options.modelType === 'two boys') {
        subjectPrompt = `two boy models standing side by side, one toddler boy and one young boy (siblings), BOTH wearing the exact same identical`;
      } else if (options.modelType === 'two girls') {
        subjectPrompt = `two girl models standing side by side, one toddler girl and one young girl (siblings), BOTH wearing the exact same identical`;
      }

      const promptText = `A highly detailed, professional FULL-BODY fashion photography shot of ${subjectPrompt} ${categoryText}. 
      ${options.style || ''}. 
      CRITICAL INSTRUCTIONS: The model MUST BE STANDING UPRIGHT on their feet. The model MUST BE WEARING STYLISH SHOES (sneakers, boots, sandals, etc) that match the outfit. DO NOT generate barefoot models. DO NOT generate sitting, kneeling, crawling, or lying down poses. Full body must be clearly visible from head to shoes to show the garment's exact length and fit. The models must have natural, candid lifestyle poses. The garments MUST NOT have any price tags, labels, text, or hangers. Photorealistic, ultra detailed 8k.`;

      const inputs: any = {
        product_image: options.garmentImage,
      };

      if (options.modelImage) {
        inputs.model_image = options.modelImage;
        inputs.category = options.category === "tops" || options.category === "bottoms" || options.category === "one-pieces" ? options.category : "tops";
      } else {
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
