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

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onBack, className = '' }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
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
      <div className="h-16 px-4 border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md flex items-center justify-between flex-shrink-0 select-none">
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
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 mb-3 shadow-xl">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-200">
              {isGroup ? `Início do grupo ${chat.name}` : `Conversa com ${title}`}
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              {isGroup
                ? 'Este é o começo do seu grupo. Envie uma mensagem para começar!'
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

      {/* Redesigned Seamless Message Input */}
      <div className="p-3 sm:p-4 bg-zinc-950 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2.5 max-w-4xl mx-auto w-full">
          <div className="flex-1 min-w-0 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              className="w-full max-h-36 min-h-[46px] py-3 px-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 text-zinc-100 placeholder:text-zinc-500 text-sm leading-relaxed resize-none outline-none transition-all block"
            />
          </div>

          <button
            type="submit"
            disabled={!inputVal.trim() || sending}
            className="w-[46px] h-[46px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex-shrink-0"
            title="Enviar mensagem"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4 ml-0.5" />
            )}
          </button>
        </form>
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
