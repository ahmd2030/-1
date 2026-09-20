import { AIProvider, AIGenerationOptions, AIGenerationResult } from './provider';

export class FashnProvider implements AIProvider {
  name = 'fashn';

  async generate(options: AIGenerationOptions): Promise<AIGenerationResult> {
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) throw new Error('FASHN_API_KEY is not configured');

    try {
      const modelName = options.modelImage ? 'tryon-max' : 'product-to-model';
      
      let categoryText = "garment";
      if (options.category === "tops") categoryText = "top/shirt/jacket";
      if (options.category === "bottoms") categoryText = "pants/skirt/bottoms";
      if (options.category === "one-pieces") categoryText = "dress/jumpsuit/matching two-piece outfit/full set";

      let subjectPrompt = options.modelType || 'person';
      const isFemale = subjectPrompt.includes('girl') || subjectPrompt === 'woman';
      const isMale = subjectPrompt.includes('boy') || subjectPrompt === 'man';
      
      let genderModifiers = "";
      if (isFemale) {
        genderModifiers = "(STRICTLY FEMALE model, very feminine facial features, very long beautiful flowing hair:1.5)";
      } else if (isMale) {
        genderModifiers = "(STRICTLY MALE model, handsome masculine facial features, short stylish boys haircut:1.5)";
      }
      
      subjectPrompt = `a ${subjectPrompt} ${genderModifiers}`;
      
      if (options.modelType === 'two boys') {
        subjectPrompt = `two boy models standing side by side, one toddler boy and one young boy (siblings), BOTH wearing the exact same identical`;
      } else if (options.modelType === 'two girls') {
        subjectPrompt = `two girl models with long beautiful hair standing side by side, one toddler girl and one young girl (siblings), BOTH wearing the exact same identical`;
      }

      // Restructured to force the AI to process the ENVIRONMENT first, then the SUBJECT.
      const promptText = `SUBJECT: A highly detailed, professional FULL-BODY fashion photography shot of ${subjectPrompt} wearing the exact ${categoryText}. 
      ENVIRONMENT AND SETTING: ${options.style || 'High-end indoor studio'}. 
      CRITICAL INSTRUCTIONS: ABSOLUTELY PRESERVE THE EXACT COLOR, TEXTURE, FABRIC, AND CUT OF THE UPLOADED GARMENT. DO NOT ALTER OR CHANGE ANY DETAILS OF THE GARMENT'S DESIGN. DO NOT MIRROR OR FLIP THE GARMENT. Any text, numbers, or logos on the clothing MUST remain exactly as they appear in the original image. The model MUST BE STANDING UPRIGHT on their feet. The model MUST be wearing fashionable shoes matching the outfit. DO NOT generate barefoot models. Full body must be clearly visible from head to shoes to show the garment's exact length and fit. The models must have natural, candid lifestyle poses. The garments MUST NOT have any price tags, labels, text, or hangers. Hyper-realistic, ultra detailed 8k, raw photo, DSLR, Fujifilm XT4, masterpiece.`;

      const inputs: any = {
        product_image: options.garmentImage,
      };

      if (options.modelImage) {
        inputs.model_image = options.modelImage;
        // category is only supported by tryon-max model (when model image is provided)
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
        throw new Error(`FASHN API Error: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      if (options.returnIdOnly && data.id) {
        return {
          id: data.id,
          provider: 'fashn',
          model: modelName,
          cost: 1,
          status: 'processing'
        };
      }

      if (data.id) {
        return await this.pollStatus(data.id, apiKey);
      }

      const outputUrl = data.output?.[0] || data.image_url;
      
      if (!outputUrl) {
        throw new Error('Invalid response format from FASHN API');
      }

      return {
        id: data.id || `fashn-${Date.now()}`,
        imageUrl: outputUrl,
        provider: 'fashn',
        model: modelName,
        cost: 1,
        status: 'completed'
      };
    } catch (error) {
      console.error('Fashn Provider Error:', error);
      throw error;
    }
  }

  async getStatus(id: string): Promise<AIGenerationResult> {
    const apiKey = process.env.FASHN_API_KEY;
    if (!apiKey) throw new Error('FASHN_API_KEY is not configured');

    const response = await fetch(`https://api.fashn.ai/v1/status/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      const errTxt = await response.text();
      console.error('Fashn status error:', errTxt);
      throw new Error(`Failed to poll FASHN status: ${response.status}`);
    }
    
    const data = await response.json();
    const statusStr = (data.status || '').toLowerCase();
    
    if (statusStr === 'completed' || statusStr === 'succeeded') {
      let finalImg = data.image_url;
      if (data.output) {
        finalImg = Array.isArray(data.output) ? data.output[0] : data.output;
      }
      return {
        id: id,
        imageUrl: finalImg,
        provider: 'fashn',
        model: 'tryon-max',
        cost: 1,
        status: 'completed'
      };
    } else if (statusStr === 'failed' || data.error) {
      throw new Error(data.error?.message || data.error || 'Generation failed');
    }
    
    return {
      id: id,
      provider: 'fashn',
      model: 'tryon-max',
      cost: 1,
      status: 'processing'
    };
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
      const statusStr = (data.status || '').toLowerCase();
      
      if (statusStr === 'completed' || statusStr === 'succeeded') {
        let finalImg = data.image_url;
        if (data.output) {
          finalImg = Array.isArray(data.output) ? data.output[0] : data.output;
        }
        return {
          id: id,
          imageUrl: finalImg,
          provider: 'fashn',
          model: 'tryon-max',
          cost: 1,
        };
      } else if (statusStr === 'failed' || data.error) {
        throw new Error(data.error || 'FASHN generation failed');
      }
      
      attempts++;
    }
    
    throw new Error('Timeout waiting for FASHN API');
  }
}
