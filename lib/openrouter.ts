import axios from 'axios';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

export const AVAILABLE_MODELS: OpenRouterModel[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Most intelligent model, best for complex coding tasks',
    pricing: { prompt: '$3/M tokens', completion: '$15/M tokens' }
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Powerful model with broad knowledge',
    pricing: { prompt: '$10/M tokens', completion: '$30/M tokens' }
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    description: 'Fast and capable for most tasks',
    pricing: { prompt: '$0.35/M tokens', completion: '$1.05/M tokens' }
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    description: 'Open source, good for general tasks',
    pricing: { prompt: '$0.35/M tokens', completion: '$0.40/M tokens' }
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'Balanced performance and cost',
    pricing: { prompt: '$2/M tokens', completion: '$6/M tokens' }
  },
];

export interface ChatCompletionOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}

export class OpenRouterService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(options: ChatCompletionOptions): Promise<string> {
    const {
      model,
      messages,
      temperature = 0.7,
      maxTokens = 4096,
      stream = false,
      onChunk,
    } = options;

    try {
      const response = await axios.post(
        OPENROUTER_API_URL,
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
          stream,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-assistant-pro.app',
            'X-Title': 'AI Assistant Pro',
          },
          responseType: stream ? 'stream' : 'json',
        }
      );

      if (stream && onChunk) {
        let fullResponse = '';
        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  fullResponse += content;
                  onChunk(content);
                }
              } catch (e) {
                console.error('Error parsing stream chunk:', e);
              }
            }
          }
        });
        return new Promise((resolve) => {
          response.data.on('end', () => resolve(fullResponse));
        });
      } else {
        return response.data.choices[0].message.content;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  async getAvailableModels(): Promise<OpenRouterModel[]> {
    return AVAILABLE_MODELS;
  }

  static validateApiKey(apiKey: string): boolean {
    return apiKey.startsWith('sk-or-') && apiKey.length > 20;
  }
}
