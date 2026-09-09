export interface AIGenerationOptions {
  garmentImage: string;
  modelImage?: string; // Optional user-provided model image
  category: string;
  modelType: string; // 'boy', 'girl', 'man', 'woman'
  modelAge?: string;
  pose?: string;
  background?: string;
  style?: string;
  resolution?: 'fast' | 'high' | 'ultra';
}

export interface AIGenerationResult {
  id: string;
  imageUrl: string;
  provider: string;
  model: string;
  cost: number;
}

export interface AIProvider {
  name: string;
  generate(options: AIGenerationOptions): Promise<AIGenerationResult>;
  getStatus?(id: string): Promise<AIGenerationResult | { status: 'processing' }>;
}
