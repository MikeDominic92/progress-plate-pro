import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useProgression } from '@/hooks/useProgression';
import { useWeightTracker } from '@/hooks/useWeightTracker';
import { useNutritionTracker } from '@/hooks/useNutritionTracker';
import { useCoachChat } from '@/hooks/useCoachChat';
import type { ChatMessage } from '@/hooks/useCoachChat';
import { format } from 'date-fns';
import BottomNav from '@/components/BottomNav';

const SUGGESTED_PROMPTS = [
  'How am I doing?',
  "What's my next workout?",
  'Am I hitting my protein?',
  'Tips for hip thrusts',
];

function formatTime(iso: string) {
  try {
    return format(new Date(iso), 'h:mm a');
  } catch {
    return '';
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 max-w-[85%]">
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/5 border border-white/10">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary/20 border border-primary/30 rounded-br-sm'
            : 'bg-white/5 border border-white/10 rounded-bl-sm'
        }`}
      >
        <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p className="text-[0.65rem] text-white/30 mt-1.5">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}

export default function CoachPage() {
  const navigate = useNavigate();
  const { username } = useAuthenticatedUser();
  const { completedSessionCount, allPRs, recentSessions } = useProgression(username);
  const { latestWeight, weightDelta, goalWeight, weightLogs } = useWeightTracker(username);
  const { dailyTotals, meals } = useNutritionTracker();

  const { messages, sending, error, sendMessage, clearChat } = useCoachChat({
    completedSessionCount,
    allPRs,
    recentSessions,
    latestWeight,
    weightDelta,
    goalWeight,
    weightLogs,
    dailyNutritionTotals: dailyTotals,
    meals,
  });

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptChip = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-card/30" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(340_82%_66%/0.1),transparent_50%)]" />

      <div className="relative z-10 max-w-lg mx-auto h-screen flex flex-col pb-14">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-background/80 backdrop-blur-sm">
          <Button
            aria-label="Go back"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/60 hover:text-white"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white/90">Coach Dom</h1>
            <p className="text-[0.65rem] text-white/40 truncate">Your AI fitness & nutrition coach</p>
          </div>
          {messages.length > 0 && (
            <Button
              aria-label="Clear chat"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/40 hover:text-red-400"
              onClick={clearChat}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && !sending ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <MessageSquare className="h-12 w-12 text-white/15" />
              <div>
                <p className="text-sm text-white/60 font-medium">Hey {username}, I'm Coach Dom.</p>
                <p className="text-xs text-white/30 mt-1">Ask me anything about your workouts, nutrition, or progress.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptChip(prompt)}
                    className="px-3 py-1.5 text-xs text-white/60 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:text-white/80 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} />
              ))}
              {sending && <TypingIndicator />}
              {error && (
                <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                  {error}
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-white/10 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Coach Dom..."
              disabled={sending}
              className="flex-1 bg-white/5 border border-white/10 focus:border-primary/40 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-white/90 placeholder:text-white/30 disabled:opacity-50 transition-colors"
            />
            <Button
              aria-label="Send message"
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="icon"
              className="h-10 w-10 bg-primary/20 border border-primary/30 hover:bg-primary/30 rounded-xl disabled:opacity-30 transition-colors"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
