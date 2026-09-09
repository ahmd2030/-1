import { AIProvider, AIGenerationOptions, AIGenerationResult } from './provider';
import { FashnProvider } from './fashn';
// import { FalProvider } from './fal'; // We will implement this later

export class AIRouter {
  private primaryProvider: AIProvider;
  private secondaryProvider: AIProvider | null;

  constructor() {
    this.primaryProvider = new FashnProvider();
    // this.secondaryProvider = new FalProvider();
    this.secondaryProvider = null; 
  }

  async generateImage(options: AIGenerationOptions): Promise<AIGenerationResult> {
    try {
      console.log(`Routing request to primary provider: ${this.primaryProvider.name}`);
      // Based on options.resolution or options.style, we might route to secondary later.
      return await this.primaryProvider.generate(options);
    } catch (error) {
      console.error(`Primary provider ${this.primaryProvider.name} failed:`, error);
      
      if (this.secondaryProvider) {
        console.log(`Falling back to secondary provider: ${this.secondaryProvider.name}`);
        return await this.secondaryProvider.generate(options);
      }
      
      throw error; // Throw the actual error so it propagates to the UI
    }
  }
}

export const aiRouter = new AIRouter();
