import { describe, it, expect } from 'vitest';

describe('OpenRouter API Integration', () => {
  it('should validate OpenRouter API key', async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    // Test API call to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  it('should make a test chat completion request', async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is not set');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Say hello briefly',
          },
        ],
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('choices');
    expect(data.choices.length).toBeGreaterThan(0);
    expect(data.choices[0]).toHaveProperty('message');
  });
});
