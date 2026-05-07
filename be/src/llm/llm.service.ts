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

  async generate(prompt: string) {
    try {
        const response = await this.client.chat.completions.create({
          model: 'chat-free',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        return response.choices[0]?.message?.content || '';
      } catch (error: any) {
        console.error(error);

        if (error?.status === 429) {
          return 'AI đang quá tải, vui lòng thử lại sau vài giây.';
        }

        return 'AI hiện không khả dụng.';
      }
  }
}