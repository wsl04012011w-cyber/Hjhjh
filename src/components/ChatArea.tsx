import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chat, Message } from '../types/chat';
import { 
  sendMessage, 
  subscribeToMessages, 
  markChatAsRead 
} from '../services/chatService';
import { MessageItem } from './MessageItem';
import { Avatar } from './Avatar';
import { GroupInfoModal } from './GroupInfoModal';
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Smile, 
  Copy, 
  Check, 
  Info,
  Sparkles
} from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  onBack: () => void;
  className?: string;
}

const COMMON_EMOJIS = ['😊', '👍', '❤️', '🔥', '🚀', '🎉', '😂', '💬', '👏', '✨'];

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onBack, className = '' }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mark chat as read
  useEffect(() => {
    if (chat && userProfile) {
      markChatAsRead(chat.id, userProfile.userId);
    }
  }, [chat.id, userProfile?.userId]);

  // Real-time messages subscription
  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      chat.id,
      (newMessages) => {
        setMessages(newMessages);
        if (userProfile) {
          markChatAsRead(chat.id, userProfile.userId);
        }
      },
      (err) => {
        console.error('Erro ao escutar mensagens:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [chat.id, userProfile?.userId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || !userProfile || sending) return;

    const text = inputVal.trim();
    setInputVal('');
    setSending(true);

    try {
      await sendMessage(chat, userProfile, text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setInputVal(text); // Restore on error
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setInputVal((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Header information
  const isGroup = chat.type === 'group';
  const otherParticipant = !isGroup
    ? Object.values(chat.participantDetails || {}).find(
        (p) => p.userId !== userProfile?.userId
      )
    : null;

  const title = isGroup ? chat.name : otherParticipant?.displayName || 'Amigo';
  const shortId = otherParticipant?.shortId;
  const memberCount = Object.keys(chat.participantDetails || {}).length;

  const handleCopyShortId = () => {
    if (!shortId) return;
    navigator.clipboard.writeText(shortId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div
      className={`flex-1 flex flex-col bg-zinc-950 text-zinc-100 h-full overflow-hidden ${className}`}
    >
      {/* Top Chat Header */}
      <div className="h-16 px-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center justify-between flex-shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Voltar para conversas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isGroup ? (
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          ) : (
            <Avatar
              name={title}
              avatarColor={otherParticipant?.avatarColor}
              photoURL={otherParticipant?.photoURL}
              size="md"
            />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-[200px] sm:max-w-xs">
                {title}
              </h2>
              {shortId && (
                <button
                  onClick={handleCopyShortId}
                  className="font-mono text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20"
                  title="Clique para copiar ID do amigo"
                >
                  <span>#{shortId}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 truncate">
              {isGroup ? (
                <button
                  onClick={() => setShowGroupInfo(true)}
                  className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{memberCount} participantes</span>
                  <Info className="w-3 h-3" />
                </button>
              ) : (
                'Conversa direta e segura'
              )}
            </p>
          </div>
        </div>

        {/* Right action */}
        {isGroup && (
          <button
            onClick={() => setShowGroupInfo(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Membros</span>
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 px-2 sm:px-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-zinc-200">
              {isGroup ? `Início do grupo ${chat.name}` : `Conversa com ${title}`}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              {isGroup
                ? 'Este é o começo do seu grupo. Envie a primeira mensagem para quebrar o gelo!'
                : `Você e ${title} estão conectados. Mande uma mensagem agora!`}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.senderId === userProfile?.userId;
            const prevMsg = messages[index - 1];
            
            // Check if sequential (same sender within 2 minutes)
            let isSequential = false;
            if (prevMsg && prevMsg.senderId === msg.senderId) {
              const prevTime = prevMsg.createdAt?.toMillis
                ? prevMsg.createdAt.toMillis()
                : new Date(prevMsg.createdAt).getTime();
              const currTime = msg.createdAt?.toMillis
                ? msg.createdAt.toMillis()
                : new Date(msg.createdAt).getTime();
              
              if (currTime - prevTime < 120000) {
                isSequential = true;
              }
            }

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isCurrentUser={isCurrentUser}
                isSequential={isSequential}
                chatType={chat.type}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Bar Picker */}
      {showEmojiPicker && (
        <div className="px-4 py-2 bg-zinc-900/90 border-t border-zinc-800 flex items-center gap-1.5 overflow-x-auto select-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="text-xs text-zinc-500 mr-1 flex-shrink-0">Emojis:</span>
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleAddEmoji(emoji)}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-lg transition-transform hover:scale-125 cursor-pointer flex-shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Box */}
      <div className="p-3 sm:p-4 bg-zinc-900/90 border-t border-zinc-800/80">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-xl transition-colors cursor-pointer flex-shrink-0 ${
              showEmojiPicker
                ? 'bg-indigo-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Inserir emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Mensagem para ${title}... (Enter para enviar)`}
              className="w-full max-h-32 min-h-[42px] px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 focus:border-indigo-500 focus:outline-none text-zinc-100 placeholder:text-zinc-500 text-sm resize-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim() || sending}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex-shrink-0"
            title="Enviar mensagem"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-zinc-500 mt-1.5 pl-1 hidden sm:block">
          Dica: Pressione <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">Enter</kbd> para enviar e <kbd className="px-1 py-0.5 rounded bg-zinc-800 text-zinc-400">Shift + Enter</kbd> para quebrar linha.
        </p>
      </div>

      {/* Group Info Modal */}
      {showGroupInfo && isGroup && (
        <GroupInfoModal
          isOpen={showGroupInfo}
          onClose={() => setShowGroupInfo(false)}
          chat={chat}
        />
      )}
    </div>
  );
};
