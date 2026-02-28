import { useState, useCallback, useEffect, useRef } from 'react';
import { buildSystemPrompt, buildCoachContext } from '@/utils/coachSystemPrompt';
import type { PersonalRecord } from '@/utils/progressionEngine';
import type { MealEntry } from '@/hooks/useNutritionTracker';
import { fetchWithTimeout, TimeoutError } from '@/lib/fetchWithTimeout';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CoachChatParams {
  completedSessionCount: number;
  allPRs: PersonalRecord[];
  recentSessions: { date: string; totalVolume: number; prCount: number; rpe?: number | null }[];
  latestWeight: number | null;
  weightDelta: number | null;
  goalWeight: number | null;
  weightLogs: { date: string; weight: number }[];
  dailyNutritionTotals: { calories: number; protein: number; carbs: number; fat: number };
  meals: MealEntry[];
}

const STORAGE_KEY = 'coach_chat_messages';
const MAX_STORED = 200;
const MAX_API_MESSAGES = 50;
const GEMINI_PROXY = '/.netlify/functions/gemini-proxy';
const GEMINI_STREAM_PROXY = '/.netlify/functions/gemini-proxy-stream';

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  const trimmed = messages.slice(-MAX_STORED);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

/** Merge consecutive same-role messages (Gemini requires alternating user/model turns). */
function mergeConsecutive(msgs: { role: string; parts: { text: string }[] }[]) {
  const merged: typeof msgs = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) {
      last.parts[0].text += '\n' + m.parts[0].text;
    } else {
      merged.push({ role: m.role, parts: [{ text: m.parts[0].text }] });
    }
  }
  return merged;
}

export function useCoachChat(params: CoachChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [sending, setSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // Cancel in-flight request on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || sending) return;

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    saveMessages(updated);
    setSending(true);
    setError(null);
    setStreamingContent('');

    try {
      const ctx = buildCoachContext(paramsRef.current);
      const systemPrompt = buildSystemPrompt(ctx);

      const recentMsgs = updated.slice(-MAX_API_MESSAGES);
      const contents = mergeConsecutive(
        recentMsgs.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }))
      );

      if (contents.length > 0 && contents[0].role !== 'user') {
        contents.shift();
      }

      const requestBody = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 8192,
        },
      };

      // Try streaming first
      let reply = '';
      let streamed = false;

      try {
        const response = await fetchWithTimeout(GEMINI_STREAM_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          timeoutMs: 60_000,
          signal: controller.signal,
        });

        if (response.ok && response.body) {
          setIsStreaming(true);
          streamed = true;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = '';
          let buffer = '';

          while (true) {
            if (controller.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.text) {
                    accumulated += parsed.text;
                    setStreamingContent(accumulated);
                  }
                } catch {
                  // skip
                }
              }
            }
          }

          reply = accumulated;
        }
      } catch (streamErr) {
        // If user aborted (navigated away), stop silently
        if (streamErr instanceof DOMException && streamErr.name === 'AbortError') throw streamErr;
        // Streaming failed, fall through to non-streaming
      }

      // Fallback to non-streaming if streaming didn't work
      if (!streamed || !reply) {
        setIsStreaming(false);
        setStreamingContent('');

        const response = await fetchWithTimeout(GEMINI_PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          timeoutMs: 30_000,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || `API error (${response.status})`);
        }

        const data = await response.json();
        reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (!reply) {
        throw new Error('No response from Coach Dom. Try again.');
      }

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      const withReply = [...updated, assistantMsg];
      setMessages(withReply);
      saveMessages(withReply);
    } catch (err: any) {
      // Silently ignore AbortError (user navigated away or sent new message)
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (err instanceof TimeoutError) {
        setError('Response is taking too long. Please try again.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setSending(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [messages, sending]);

  const clearChat = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setError(null);
  }, []);

  return { messages, sending, isStreaming, streamingContent, error, sendMessage, clearChat };
}
