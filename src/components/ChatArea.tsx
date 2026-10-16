import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Chat, Message } from '../types/chat';
import { 
  sendMessage, 
  sendMessageWithAttachment,
  sendAudioMessage,
  editMessage,
  deleteMessageForEveryone,
  hideMessageForMe,
  togglePinMessage,
  subscribeToMessages, 
  markChatAsRead 
} from '../services/chatService';
import { MessageItem } from './MessageItem';
import { Avatar } from './Avatar';
import { GroupInfoModal } from './GroupInfoModal';
import { MessageActionMenu } from './MessageActionMenu';
import { EditMessageModal } from './EditMessageModal';
import { 
  Send, 
  ArrowLeft, 
  Users, 
  Copy, 
  Check, 
  Info,
  Sparkles,
  Mic,
  Trash2,
  Paperclip,
  X,
  FileText,
  Pin,
  Phone
} from 'lucide-react';

interface ChatAreaProps {
  chat: Chat;
  onBack: () => void;
  onStartCall: (chat: Chat) => void;
  className?: string;
}

interface PendingAttachment {
  url: string;
  type: 'image' | 'txt';
  name: string;
  size: number;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ chat, onBack, onStartCall, className = '' }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [sending, setSending] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Attachment state
  const [pendingAttachment, setPendingAttachment] = useState<PendingAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Message action menu state
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<Message | null>(null);
  const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  // Cleanup media recording stream on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle file attachment selection (images and .txt)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('O arquivo selecionado deve ter no máximo 2 MB.');
      return;
    }

    if (file.type.startsWith('image/')) {
      // Compress and resize image client-side to maintain high performance
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 900;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);

          setPendingAttachment({
            url: dataUrl,
            type: 'image',
            name: file.name,
            size: file.size,
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else if (file.name.endsWith('.txt') || file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPendingAttachment({
          url: dataUrl,
          type: 'txt',
          name: file.name,
          size: file.size,
        });
      };
      reader.readAsDataURL(file);
    } else {
      alert('Por favor, selecione uma imagem ou um arquivo de texto (.txt).');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputVal.trim() && !pendingAttachment) || !userProfile || sending) return;

    const text = inputVal.trim();
    const attachmentToSend = pendingAttachment;

    setInputVal('');
    setPendingAttachment(null);
    setSending(true);

    // Blur input so mobile keyboards DO NOT reopen automatically
    if (textareaRef.current) {
      textareaRef.current.blur();
    }

    try {
      if (attachmentToSend) {
        await sendMessageWithAttachment(chat, userProfile, text, attachmentToSend);
      } else {
        await sendMessage(chat, userProfile, text);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setInputVal(text); // Restore on error
      setPendingAttachment(attachmentToSend);
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

  // Start audio recording
  const startRecording = async () => {
    setAudioError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setAudioError('Gravação de áudio não suportada pelo seu navegador.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopAndSendRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Erro ao acessar microfone:', err);
      setAudioError('Permita o acesso ao microfone no navegador para gravar áudios.');
      setTimeout(() => setAudioError(null), 4000);
    }
  };

  // Stop recording and send audio message
  const stopAndSendRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const currentDuration = recordingSeconds;

    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      setIsRecording(false);
      setRecordingSeconds(0);

      if (audioBlob.size < 100) return;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        if (base64Data && userProfile) {
          try {
            setSending(true);
            await sendAudioMessage(chat, userProfile, base64Data, Math.max(1, currentDuration));
          } catch (err) {
            console.error('Erro ao enviar áudio:', err);
          } finally {
            setSending(false);
          }
        }
      };
      reader.readAsDataURL(audioBlob);
    };

    recorder.stop();
  };

  const cancelRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Message actions
  const handleEditMessage = async (messageId: string, newText: string) => {
    await editMessage(chat.id, messageId, newText);
  };

  const handleDeleteForMe = async (msg: Message) => {
    if (!userProfile) return;
    await hideMessageForMe(chat.id, msg.id, userProfile.userId);
  };

  const handleDeleteForEveryone = async (msg: Message) => {
    await deleteMessageForEveryone(chat.id, msg.id);
  };

  const handleTogglePin = async (msg: Message) => {
    if (!userProfile) return;
    const isPinned = msg.pinnedFor?.includes(userProfile.userId) || false;
    await togglePinMessage(chat.id, msg.id, userProfile.userId, isPinned);
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

  // Pinned message for current user (most recent pinned)
  const pinnedMessage = messages
    .slice()
    .reverse()
    .find((m) => m.pinnedFor?.includes(userProfile?.userId || ''));

  return (
    <div
      className={`relative flex-1 flex flex-col bg-zinc-950 text-zinc-100 h-full overflow-hidden ${className}`}
    >
      {/* 
        Sleek Glassmorphic Top Bar with gentle gradient and backdrop-blur
        allowing the scrolling messages underneath to appear smoothly blurred.
      */}
      <header className="absolute top-0 left-0 right-0 z-20 h-16 px-4 bg-gradient-to-b from-zinc-950/90 via-zinc-950/75 to-zinc-950/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button on mobile */}
          <button
            onClick={onBack}
            className="md:hidden p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Voltar para conversas"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isGroup ? (
            <div className="w-10 h-10 rounded-xl bg-purple-600/90 flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-purple-400/20">
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
                  className="font-mono text-xs text-indigo-300 hover:text-white flex items-center gap-1 cursor-pointer bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded-lg border border-white/10 transition-colors"
                  title="Clique para copiar ID do amigo"
                >
                  <span>#{shortId}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-zinc-400" />
                  )}
                </button>
              )}
            </div>

            {/* Subtitle: Only show for groups */}
            {isGroup && (
              <p className="text-[11px] text-zinc-400 truncate">
                <button
                  onClick={() => setShowGroupInfo(true)}
                  className="hover:text-indigo-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{memberCount} participantes</span>
                  <Info className="w-3 h-3" />
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onStartCall(chat)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-semibold transition-all active:scale-95 cursor-pointer border border-emerald-500/30 shadow-sm"
            title="Iniciar ligação / chamada de voz"
          >
            <Phone className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Ligar</span>
          </button>

          {isGroup && (
            <button
              onClick={() => setShowGroupInfo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/5 backdrop-blur-md"
            >
              <Users className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Membros</span>
            </button>
          )}
        </div>
      </header>

      {/* Pinned message banner if any */}
      {pinnedMessage && (
        <div className="absolute top-16 left-0 right-0 z-10 px-4 py-1.5 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between text-xs text-zinc-300 animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-amber-400 fill-current flex-shrink-0" />
            <span className="font-semibold text-amber-300 flex-shrink-0">Fixada:</span>
            <span className="truncate text-zinc-300">{pinnedMessage.text}</span>
          </div>
          <button
            onClick={() => handleTogglePin(pinnedMessage)}
            className="text-[10px] text-zinc-400 hover:text-white ml-2 flex-shrink-0 cursor-pointer"
          >
            Desafixar
          </button>
        </div>
      )}

      {/* Messages Stream (padded top to scroll smoothly under glass bar) */}
      <div className={`flex-1 overflow-y-auto px-2 sm:px-4 space-y-1 ${pinnedMessage ? 'pt-26 pb-4' : 'pt-20 pb-4'}`}>
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
                currentUserId={userProfile?.userId || ''}
                onOpenMenu={(m) => setSelectedMessageForAction(m)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Audio permission error notice */}
      {audioError && (
        <div className="mx-4 mb-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <span>{audioError}</span>
          <button onClick={() => setAudioError(null)} className="text-amber-400 hover:text-white ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Pending attachment preview chip */}
      {pendingAttachment && (
        <div className="px-4 pb-1">
          <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 shadow-lg">
            {pendingAttachment.type === 'image' ? (
              <img
                src={pendingAttachment.url}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-lg border border-zinc-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="max-w-xs truncate">
              <p className="font-semibold truncate">{pendingAttachment.name}</p>
              <p className="text-[10px] text-zinc-400">
                {Math.round(pendingAttachment.size / 1024)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingAttachment(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1 cursor-pointer"
              title="Remover anexo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Redesigned Seamless Message Input */}
      <div className="p-3 sm:p-4 bg-zinc-950 flex-shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-4xl mx-auto w-full">
          {/* Hidden file input for photos and txt */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.txt,text/plain"
            className="hidden"
          />

          {isRecording ? (
            /* Active Voice Recording UI */
            <div className="flex-1 min-h-[46px] px-4 py-2.5 rounded-2xl bg-zinc-900 border border-rose-500/40 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="text-xs font-semibold text-rose-300">
                  Gravando áudio...
                </span>
                <span className="font-mono text-xs text-white bg-zinc-800 px-2 py-0.5 rounded-md">
                  {formatSeconds(recordingSeconds)}
                </span>
              </div>

              {/* Cancel recording button */}
              <button
                type="button"
                onClick={cancelRecording}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Cancelar gravação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Input container with Attach button inside on the left */
            <div className="flex-1 min-w-0 relative flex items-center bg-zinc-900 rounded-2xl border border-zinc-800/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
              {/* Attach Button (inside input, left corner) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="pl-3.5 pr-2 py-3 text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer flex-shrink-0 self-end mb-1"
                title="Anexar foto ou arquivo .txt"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <textarea
                ref={textareaRef}
                rows={1}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={pendingAttachment ? 'Adicione uma legenda...' : 'Digite uma mensagem...'}
                className="w-full max-h-36 min-h-[46px] py-3 pr-4 pl-1 bg-transparent text-zinc-100 placeholder:text-zinc-500 text-sm leading-relaxed resize-none outline-none block"
              />
            </div>
          )}

          {/* Audio recording button */}
          {isRecording ? (
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="w-[46px] h-[46px] rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-rose-600/30 cursor-pointer flex-shrink-0"
              title="Parar e enviar áudio"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={startRecording}
                className="w-[46px] h-[46px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-300 hover:text-indigo-400 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer flex-shrink-0"
                title="Gravar áudio"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                type="submit"
                disabled={(!inputVal.trim() && !pendingAttachment) || sending}
                className="w-[46px] h-[46px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-600/30 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex-shrink-0"
                title="Enviar mensagem"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </>
          )}
        </form>
      </div>

      {/* Message Action Menu Modal (Long-press / right-click) */}
      <MessageActionMenu
        isOpen={Boolean(selectedMessageForAction)}
        message={selectedMessageForAction}
        currentUserId={userProfile?.userId || ''}
        onClose={() => setSelectedMessageForAction(null)}
        onEdit={(msg) => setMessageToEdit(msg)}
        onDeleteForMe={(msg) => handleDeleteForMe(msg)}
        onDeleteForEveryone={(msg) => handleDeleteForEveryone(msg)}
        onTogglePin={(msg) => handleTogglePin(msg)}
      />

      {/* Edit Message Modal */}
      <EditMessageModal
        isOpen={Boolean(messageToEdit)}
        message={messageToEdit}
        onClose={() => setMessageToEdit(null)}
        onSave={handleEditMessage}
      />

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
