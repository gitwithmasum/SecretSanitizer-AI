import { WebsiteAdapter } from './types';
import { ChatGPTAdapter } from './chatgpt';
import { ClaudeAdapter } from './claude';
import { GeminiAdapter } from './gemini';
import { CopilotAdapter } from './copilot';
import { PerplexityAdapter } from './perplexity';
import { GenericAIAdapter } from './generic';

export class AdapterRegistry {
  private static adapters: WebsiteAdapter[] = [
    new ChatGPTAdapter(),
    new ClaudeAdapter(),
    new GeminiAdapter(),
    new CopilotAdapter(),
    new PerplexityAdapter()
  ];

  private static genericAdapter = new GenericAIAdapter();

  /**
   * Finds the best matching adapter for a given hostname
   */
  public static getAdapterForHost(hostname: string): WebsiteAdapter {
    for (const adapter of this.adapters) {
      if (adapter.matchDomain(hostname)) {
        return adapter;
      }
    }
    return this.genericAdapter;
  }

  /**
   * Lists all primary supported platforms
   */
  public static getAllAdapters(): WebsiteAdapter[] {
    return [...this.adapters];
  }
}
