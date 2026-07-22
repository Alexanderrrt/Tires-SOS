import { callGroqChat, groqReplyText } from "./groq-client.js";

export const jsonAiClient = {
  messages: {
    async create({ messages, max_tokens: maxTokens = 1024 }) {
      const result = await callGroqChat(messages, {
        maxTokens,
        temperature: 0.2,
        timeoutMs: 30_000,
        backoffMs: 1_500,
      });
      const text = groqReplyText(result);
      if (!text) throw new Error(result?.error || "AI provider returned an empty response.");
      return { content: [{ text }] };
    },
  },
};
