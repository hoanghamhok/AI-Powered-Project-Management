import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'local',
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }

  async generate(input: string | { system: string; prompt: string }): Promise<string> {
    const systemContent = typeof input === 'string' ? undefined : input.system;
    const userContent = typeof input === 'string' ? input : input.prompt;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      ...(systemContent ? [{ role: 'system' as const, content: systemContent }] : []),
      { role: 'user' as const, content: userContent },
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: process.env.LLM_MODEL || 'chat-free',
        messages,
        temperature: 0.2,
        max_tokens: 2048,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (error: any) {
      if (error?.status === 429) return 'AI đang quá tải, vui lòng thử lại sau.';
      return 'AI hiện không khả dụng.';
    }
  }
}