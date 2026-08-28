import { api } from './api.js';
import { Conversation, ChatMessage } from '../types/index.js';

export interface SendMessageOptions {
  message: string;
  conversationId?: string;
  history?: ChatMessage[];
}

export interface SendMessageResult {
  success: boolean;
  conversationId: string;
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export interface ApiWrappedResult<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const aiService = {
  async sendMessage(
    input: string | SendMessageOptions,
    conversationId?: string
  ): Promise<SendMessageResult> {
    let messageText = '';
    let convId = conversationId || null;

    if (typeof input === 'object' && input !== null) {
      messageText = input.message;
      convId = input.conversationId || convId || null;
    } else {
      messageText = String(input);
    }

    const response = await api.post<SendMessageResult>('/ai/chat', {
      message: messageText,
      conversationId: convId,
    });

    return response;
  },

  async streamMessage({
    message,
    conversationId,
    onToken,
    onStart,
    signal,
  }: {
    message: string;
    conversationId?: string;
    onToken: (token: string) => void;
    onStart?: (data: { conversationId: string; userMessage: ChatMessage }) => void;
    signal?: AbortSignal;
  }): Promise<{ conversationId: string; aiMessage?: ChatMessage }> {
    const token = localStorage.getItem('learnpath_token') || localStorage.getItem('token') || '';
    const res = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ message, conversationId }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Streaming failed with status ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No readable stream received');

    const decoder = new TextDecoder();
    let convId = conversationId || '';
    let finalAiMsg: ChatMessage | undefined;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') break;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.type === 'start') {
              convId = parsed.conversationId;
              if (onStart) onStart({ conversationId: parsed.conversationId, userMessage: parsed.userMessage });
            } else if (parsed.type === 'token') {
              onToken(parsed.token);
            } else if (parsed.type === 'done') {
              finalAiMsg = parsed.aiMessage;
            }
          } catch (e) {
            // Ignore parse chunk anomalies
          }
        }
      }
    }

    return { conversationId: convId, aiMessage: finalAiMsg };
  },


  async getConversations(): Promise<ApiWrappedResult<{ conversations: Conversation[] }>> {
    const response = await api.get<ApiWrappedResult<{ conversations: Conversation[] }>>('/conversations');
    return response;
  },

  async listConversations(): Promise<Conversation[]> {
    const response = await this.getConversations();
    return response.data?.conversations || [];
  },

  async getConversation(id: string): Promise<ApiWrappedResult<Conversation>> {
    const response = await api.get<ApiWrappedResult<Conversation>>(`/conversations/${id}`);
    return response;
  },

  async createConversation(
    optionsOrTitle?: string | { title?: string }
  ): Promise<ApiWrappedResult<Conversation>> {
    const title = typeof optionsOrTitle === 'object' ? optionsOrTitle?.title : optionsOrTitle;
    const response = await api.post<ApiWrappedResult<Conversation>>('/conversations', { title });
    return response;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/conversations/${id}`);
  },

  async getMentorContext(): Promise<ApiWrappedResult<any>> {
    const response = await api.get<ApiWrappedResult<any>>('/ai/chat/context');
    return response;
  },
};
