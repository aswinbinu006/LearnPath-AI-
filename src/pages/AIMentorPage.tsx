import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService.js';
import { Conversation, ChatMessage } from '../types/index.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { useAuth } from '../contexts/AuthContext.js';
import { useToast } from '../contexts/ToastContext.js';
import {
  Send,
  Plus,
  Bot,
  MessageSquare,
  Zap,
  Layers,
  Code,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  AlertTriangle,
  ArrowRight,
  Trash2,
  Cpu,
  GraduationCap,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  ChevronRight,
  Square,
  CheckCircle2,
} from 'lucide-react';

import { cn } from '../lib/utils.js';

interface MentorContextData {
  targetRole: string;
  experienceLevel: string;
  currentFocus: string;
  isRoadmapMastered?: boolean;
  totalProgress?: number;
  currentCourse: {
    title: string;
    slug: string;
    category: string;
    isCompleted?: boolean;
  } | null;
  currentLesson: {
    title: string;
    type: string;
  } | null;
  weakSkills: Array<{
    name: string;
    severity: string;
    description: string;
  }>;
  recommendedNextStep?: {
    title: string;
    slug: string;
    reason: string;
  } | null;
  suggestedQuestions: string[];
}

export const AIMentorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [mentorContext, setMentorContext] = useState<MentorContextData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchInitialData = async () => {
    try {
      const [convRes, contextRes] = await Promise.all([
        aiService.getConversations(),
        aiService.getMentorContext(),
      ]);

      if (convRes.success && convRes.data.conversations.length > 0) {
        setConversations(convRes.data.conversations);
        if (!activeConvId) {
          const firstConv = convRes.data.conversations[0];
          setActiveConvId(firstConv.id);
          loadConversation(firstConv.id);
        }
      }

      if (contextRes.success && contextRes.data) {
        setMentorContext(contextRes.data);
      }
    } catch (err) {
      console.error('Failed to load AI Mentor data:', err);
      toast.error('Failed to initialize AI Mentor context.', 'Network Notice');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await aiService.getConversation(id);
      if (res.success && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    if (activeConvId) {
      loadConversation(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, streamingText]);

  const handleCreateNewChat = async () => {
    try {
      const res = await aiService.createConversation({
        title: 'New Mentoring Session',
      });
      if (res.success) {
        setConversations([res.data, ...conversations]);
        setActiveConvId(res.data.id);
        setMessages(res.data.messages || []);
        toast.info('Created new mentoring session', 'AI Session');
      }
    } catch (err) {
      console.error('Failed to create new chat:', err);
      toast.error('Failed to initialize conversation.');
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiService.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id) {
        if (remaining.length > 0) {
          setActiveConvId(remaining[0].id);
        } else {
          setActiveConvId('');
          setMessages([]);
        }
      }
      toast.success('Session removed', 'Deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    if (streamingText) {
      const partialMsg: ChatMessage = {
        id: `partial-${Date.now()}`,
        role: 'assistant',
        content: streamingText,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, partialMsg]);
      setStreamingText('');
    }
    toast.info('Response generation stopped', 'Stopped');
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsSending(true);
    setStreamingText('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      let currentConvId = activeConvId;
      const res = await aiService.streamMessage({
        conversationId: activeConvId || undefined,
        message: text,
        signal: controller.signal,
        onStart: (data) => {
          if (!activeConvId) {
            setActiveConvId(data.conversationId);
            currentConvId = data.conversationId;
            fetchInitialData();
          }
        },
        onToken: (tok) => {
          setStreamingText((prev) => prev + tok);
        },
      });

      if (res.aiMessage) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          tempUserMsg,
          res.aiMessage!,
        ]);
      } else if (streamingText) {
        const finalMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: streamingText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, finalMsg]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Failed to stream message:', err);
        toast.error('AI response error. Reconnecting...', 'AI Fallback');
      }
    } finally {
      setIsSending(false);
      setStreamingText('');
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    toast.success('Code snippet copied to clipboard!', 'Copied');
    setTimeout(() => setCopiedCodeId(null), 2000);
  };


  const activeConv = conversations.find((c) => c.id === activeConvId);
  const todayList = conversations.filter((c) => c.timeGroup === 'TODAY');
  const yesterdayList = conversations.filter((c) => c.timeGroup === 'YESTERDAY');
  const previousList = conversations.filter(
    (c) => c.timeGroup !== 'TODAY' && c.timeGroup !== 'YESTERDAY'
  );

  // Markdown formatter
  const renderInlineFormatted = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-bold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={pIdx}
            className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-50 dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-mono text-xs font-semibold border border-blue-100 dark:border-neutral-800"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderFormattedMessage = (content: string) => {
    const blockParts = content.split(/(```[\s\S]*?```)/g);

    return blockParts.map((block, bIdx) => {
      if (block.startsWith('```')) {
        const rawLines = block.slice(3, -3).trim().split('\n');
        const lang = rawLines[0].trim().toLowerCase();
        const hasLangTag = /^[a-z0-9_#-]+$/.test(lang);
        const codeLines = hasLangTag ? rawLines.slice(1) : rawLines;
        const codeText = codeLines.join('\n');
        const blockId = `code-block-${bIdx}`;

        return (
          <div
            key={bIdx}
            className="my-3.5 rounded-xl overflow-hidden border border-slate-200/90 dark:border-neutral-800 bg-slate-950 text-slate-100 shadow-sm"
          >
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 select-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-1 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  {hasLangTag ? lang : 'CODE'}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(codeText, blockId)}
                type="button"
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCodeId === blockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-xs font-mono overflow-x-auto leading-relaxed text-blue-100 selection:bg-blue-600">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }

      const lines = block.split('\n');
      return (
        <div key={bIdx} className="space-y-2">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={lIdx} className="h-1.5" />;

            if (trimmed.startsWith('### ')) {
              return (
                <h4
                  key={lIdx}
                  className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1"
                >
                  {renderInlineFormatted(trimmed.slice(4))}
                </h4>
              );
            }
            if (trimmed.startsWith('#### ')) {
              return (
                <h5
                  key={lIdx}
                  className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 mt-2.5 mb-1"
                >
                  {renderInlineFormatted(trimmed.slice(5))}
                </h5>
              );
            }
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
              return (
                <div key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm ml-2">
                  <span className="text-blue-500 mt-1.5 shrink-0 text-[10px]">•</span>
                  <span className="leading-relaxed">{renderInlineFormatted(trimmed.slice(2))}</span>
                </div>
              );
            }

            return (
              <p key={lIdx} className="text-xs sm:text-sm leading-relaxed">
                {renderInlineFormatted(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="h-full w-full flex-1 flex overflow-hidden bg-white dark:bg-black relative">
      {/* ── 1. Collapsible Left Sessions Sidebar ────────────────────── */}
      {showHistory && (
        <div className="w-72 border-r border-slate-200/90 dark:border-neutral-800 flex flex-col bg-slate-50/90 dark:bg-neutral-950 shrink-0 z-20 animate-in slide-in-from-left-4 duration-200">
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-slate-200/80 dark:border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-500" />
              <span>Past Sessions</span>
            </span>
            <button
              onClick={() => setShowHistory(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-200/60 dark:hover:bg-neutral-800 cursor-pointer"
              title="Close history"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 border-b border-slate-200/60 dark:border-neutral-800/80">
            <button
              onClick={handleCreateNewChat}
              type="button"
              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {conversations.length === 0 ? (
              <div className="text-center py-8 px-2 space-y-1.5 text-slate-400 dark:text-neutral-500">
                <MessageSquare className="w-6 h-6 mx-auto stroke-1 text-slate-300 dark:text-neutral-600" />
                <p className="text-xs font-medium">No previous sessions</p>
                <p className="text-[10px]">Your chat conversations will be saved here automatically.</p>
              </div>
            ) : (
              <>
                {/* Today Group */}
                {todayList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 px-2 block">
                      Today
                    </span>
                    {todayList.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                        }}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                          activeConvId === conv.id
                            ? 'bg-blue-50 dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-neutral-800'
                            : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100/80 dark:hover:bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity cursor-pointer"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yesterday Group */}
                {yesterdayList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 px-2 block">
                      Yesterday
                    </span>
                    {yesterdayList.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setActiveConvId(conv.id)}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                          activeConvId === conv.id
                            ? 'bg-blue-50 dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-neutral-800'
                            : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100/80 dark:hover:bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Previous Group */}
                {previousList.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 px-2 block">
                      Previous Sessions
                    </span>
                    {previousList.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => setActiveConvId(conv.id)}
                        className={`group flex items-center justify-between px-2.5 py-2 rounded-xl cursor-pointer transition-all ${
                          activeConvId === conv.id
                            ? 'bg-blue-50 dark:bg-neutral-900 text-blue-600 dark:text-blue-400 font-semibold border border-blue-200/60 dark:border-neutral-800'
                            : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100/80 dark:hover:bg-neutral-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{conv.title}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          type="button"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Center Chat Thread Area (Full-Width Clean Layout) ─── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black h-full">
        {/* Chat Header Bar */}
        <div className="h-14 px-4 sm:px-6 border-b border-slate-200/90 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-black shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showHistory
                  ? 'bg-blue-50 dark:bg-neutral-900 border-blue-200 dark:border-neutral-700 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={showHistory ? 'Hide history sidebar' : 'Show chat history'}
            >
              {showHistory ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              <span className="hidden sm:inline">Sessions</span>
              {conversations.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-neutral-800 text-[10px] font-mono">
                  {conversations.length}
                </span>
              )}
            </button>

            <div className="h-4 w-px bg-slate-200 dark:border-neutral-800" />

            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 flex items-center justify-center text-blue-600 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {activeConv?.title || 'AI Engineering Mentor'}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Active Track: {mentorContext?.targetRole || user?.targetRole || 'Software Engineer'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateNewChat}
              type="button"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>

            <button
              onClick={() => setShowContextPanel(!showContextPanel)}
              type="button"
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showContextPanel
                  ? 'bg-blue-50 dark:bg-neutral-900 border-blue-200 dark:border-neutral-700 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-neutral-950 border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Toggle Learning Context Panel"
            >
              {showContextPanel ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Context</span>
            </button>
          </div>
        </div>

        {/* Messages List / Clean Welcoming Hero State */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:py-6">
          <div className="max-w-3xl mx-auto w-full min-h-full flex flex-col justify-center space-y-5">
            {messages.length === 0 && !streamingText && (
              <div className="w-full py-4 px-2 text-center my-auto">
                {/* Glowing Mentor Avatar */}
                <div className="relative mb-4 inline-block">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 border border-blue-400/30">
                    <Bot className="w-7 h-7 sm:w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-black flex items-center justify-center shadow-xs">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Welcoming Greeting */}
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  How can I assist your {mentorContext?.targetRole || user?.targetRole || 'Engineering'} journey?
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-neutral-400 mt-1.5 max-w-md mx-auto leading-relaxed">
                  I am your context-aware technical mentor. Ask me to break down concepts, debug code, review architecture, or conduct interview practice.
                </p>

                {/* 4 Interactive Starter Prompt Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-6 text-left">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        `What are the most critical milestones and skills I should focus on next to advance as a ${mentorContext?.targetRole || user?.targetRole || 'Software Engineer'}?`
                      )
                    }
                    className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-950/70 hover:bg-blue-50/50 dark:hover:bg-neutral-900 hover:border-blue-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Curriculum Guidance
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Explore top milestones and next steps tailored to your track.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        `Can you review code with me? I will paste a snippet and you can analyze time/space complexity and suggest clean-code improvements.`
                      )
                    }
                    className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-950/70 hover:bg-blue-50/50 dark:hover:bg-neutral-900 hover:border-blue-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
                        <Code className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Code Review & Refactor
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Optimize algorithms, check for bugs, and enforce clean architecture.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        `Explain key system design & architecture patterns used in modern production ${mentorContext?.targetRole || user?.targetRole || 'applications'}.`
                      )
                    }
                    className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-950/70 hover:bg-blue-50/50 dark:hover:bg-neutral-900 hover:border-blue-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        System Architecture
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Scalable patterns, caching, concurrency, and decoupling trade-offs.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        `Give me a realistic technical interview question for a ${mentorContext?.experienceLevel || user?.experienceLevel || 'Intermediate'} ${mentorContext?.targetRole || user?.targetRole || 'Software Engineer'}.`
                      )
                    }
                    className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-950/70 hover:bg-blue-50/50 dark:hover:bg-neutral-900 hover:border-blue-300 dark:hover:border-neutral-700 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Mock Interview Simulation
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                      Practice answering real questions and receive constructive feedback.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg) => {
              const isBot = msg.role === 'assistant' || msg.role === 'system';

              if (isBot) {
                return (
                  <div key={msg.id} className="flex items-start gap-3 w-full">
                    <div className="w-7 h-7 sm:w-8 h-8 rounded-xl bg-blue-50 dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 block">
                        AI Mentor
                      </span>
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200/80 dark:border-neutral-800 text-slate-900 dark:text-neutral-100 shadow-xs leading-relaxed">
                        {renderFormattedMessage(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex flex-col items-end space-y-1 w-full">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 pr-1">
                    You
                  </span>
                  <div className="max-w-xl p-3.5 sm:p-4 rounded-2xl bg-blue-600 text-white text-xs sm:text-sm leading-relaxed shadow-sm font-medium">
                    {msg.content}
                  </div>
                </div>
              );
            })}

            {/* Live Streaming Message Bubble */}
            {streamingText && (
              <div className="flex items-start gap-3 w-full">
                <div className="w-7 h-7 sm:w-8 h-8 rounded-xl bg-blue-50 dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-neutral-500 flex items-center gap-1.5">
                    <span>AI Mentor</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] text-blue-500 font-mono">Streaming response...</span>
                  </span>
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-blue-500/30 text-slate-900 dark:text-neutral-100 shadow-xs relative leading-relaxed">
                    {renderFormattedMessage(streamingText)}
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
                  </div>
                </div>
              </div>
            )}

            {isSending && !streamingText && (
              <div className="flex items-start gap-3 max-w-xl">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-neutral-900 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input Composer (Centered Floating Column) ───────── */}
        <div className="px-4 pb-4 pt-1 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-black dark:via-black/95 dark:to-transparent shrink-0">
          <div className="max-w-3xl mx-auto w-full space-y-2">
            {/* Dynamic Suggested Prompt Chips */}
            {mentorContext?.suggestedQuestions && mentorContext.suggestedQuestions.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </span>
                {mentorContext.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    type="button"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 text-[11px] font-medium text-slate-600 dark:text-neutral-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap cursor-pointer transition-colors shrink-0 shadow-2xs"
                  >
                    <span>{q}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border border-slate-200/90 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-950/90 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 shadow-lg shadow-black/5 transition-all">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask AI Mentor anything about your course, code challenge, or architecture..."
                  disabled={isSending}
                  className="flex-1 bg-transparent border-0 px-3 py-1 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />

                {isSending ? (
                  <button
                    type="button"
                    onClick={handleStopGeneration}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="w-9 h-9 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* ── 3. Right Context Panel (Cursor AI / Copilot Style) ─── */}
      {showContextPanel && (
        <div className="w-80 border-l border-slate-200/90 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-950 p-4 space-y-4 overflow-y-auto shrink-0 hidden lg:block animate-in slide-in-from-right-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>Learning Context</span>
            </h4>
            <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              Live Sync
            </span>
          </div>

          {/* Active Target Role */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Target Engineering Role
            </span>
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {mentorContext?.targetRole || user?.targetRole || 'Frontend Engineer'}
              </h5>
              <Badge variant="blue" size="sm">
                {mentorContext?.experienceLevel || user?.experienceLevel || 'Intermediate'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
              Focus: {mentorContext?.currentFocus || 'Engineering Mastery'}
            </p>
          </div>

          {/* Current Active Course & Lesson / Completed Track */}
          {mentorContext?.currentCourse && (
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              mentorContext.currentCourse.isCompleted
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20'
                : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  mentorContext.currentCourse.isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {mentorContext.currentCourse.isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      <span>Curriculum Status</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-3 h-3" />
                      <span>Current Milestone</span>
                    </>
                  )}
                </span>
                <span className={`text-[10px] font-semibold ${
                  mentorContext.currentCourse.isCompleted ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  {mentorContext.currentCourse.isCompleted ? 'Mastered 🎉' : 'In Progress'}
                </span>
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {mentorContext.currentCourse.isCompleted
                  ? 'All Roadmap Phases Completed!'
                  : mentorContext.currentCourse.title}
              </h5>
              {mentorContext.currentLesson && !mentorContext.currentCourse.isCompleted && (
                <div className="p-2 rounded-lg bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 text-[11px]">
                  <span className="text-[10px] text-slate-400 block">Current Milestone:</span>
                  <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate block">
                    {mentorContext.currentLesson.title}
                  </span>
                </div>
              )}
              {mentorContext.currentCourse.isCompleted && (
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                  Your competencies are verified and ready to share with hiring managers.
                </p>
              )}
              <Button
                variant={mentorContext.currentCourse.isCompleted ? 'primary' : 'primary'}
                size="sm"
                className="w-full text-xs font-semibold mt-1 cursor-pointer"
                onClick={() => navigate(mentorContext.currentCourse?.isCompleted ? '/recruiter-portfolio' : `/courses/${mentorContext.currentCourse?.slug}`)}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {mentorContext.currentCourse.isCompleted ? 'View Recruiter Portfolio' : 'Resume Course'}
              </Button>
            </div>
          )}

          {/* Diagnosed Weak Skills / Skill Gaps */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Diagnosed Skill Gaps</span>
            </span>
            <div className="space-y-1.5">
              {mentorContext?.weakSkills && mentorContext.weakSkills.length > 0 ? (
                mentorContext.weakSkills.map((gap, gIdx) => (
                  <div
                    key={gIdx}
                    onClick={() =>
                      handleSendMessage(
                        `Can you coach me on ${gap.name}? Explain key concepts and test my knowledge with a code exercise.`
                      )
                    }
                    className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-900 hover:border-blue-500 border border-slate-200 dark:border-neutral-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 group-hover:text-blue-500">
                        {gap.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          gap.severity === 'Critical'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {gap.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400 mt-0.5">
                      {gap.description}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 dark:text-neutral-500 text-center py-2">
                  No critical skill gaps diagnosed yet. Take an assessment to calibrate your radar.
                </p>
              )}
            </div>
          </div>

          {/* Quick Context Action Prompts */}
          <div className="p-3.5 rounded-xl border border-slate-200/90 dark:border-neutral-800 bg-white dark:bg-black space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Coaching Actions
            </span>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    `Give me a 5-question technical quiz on my target role (${mentorContext?.targetRole || user?.targetRole || 'Engineer'})`
                  )
                }
                className="w-full text-left p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-[11px] font-medium text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>🎯 Generate Mock Interview Quiz</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    'Analyze the most common system design pitfalls and performance bottlenecks in web applications.'
                  )
                }
                className="w-full text-left p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-[11px] font-medium text-slate-700 dark:text-neutral-300 transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>⚡ System Design Architecture Guide</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIMentorPage;
