import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  async generate(prompt: string) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );

    const data = await res.json();

    console.log("GEMINI:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text || text.trim() === "") {
      throw new Error("AI không trả lời được");
    }

    return text;
  }
}