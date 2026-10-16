import React from 'react';
import { Message } from '../types/chat';
import { 
  Pencil, 
  Trash2, 
  UserX, 
  Pin, 
  PinOff, 
  X,
  FileText
} from 'lucide-react';

interface MessageActionMenuProps {
  message: Message | null;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (message: Message) => void;
  onDeleteForMe: (message: Message) => void;
  onDeleteForEveryone: (message: Message) => void;
  onTogglePin: (message: Message) => void;
}

export const MessageActionMenu: React.FC<MessageActionMenuProps> = ({
  message,
  currentUserId,
  isOpen,
  onClose,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  onTogglePin,
}) => {
  if (!isOpen || !message) return null;

  const isSender = message.senderId === currentUserId;
  const isDeleted = Boolean(message.deletedForAll);
  const isAudio = Boolean(message.audioData);
  const isPinned = message.pinnedFor?.includes(currentUserId);
  const canEdit = isSender && !isDeleted && !isAudio;
  const canDeleteForEveryone = isSender && !isDeleted;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xs bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-3 shadow-2xl space-y-1 animate-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-2 sm:hidden" />

        {/* Preview of message text */}
        <div className="px-3 py-2 border-b border-zinc-800 mb-1">
          <p className="text-xs text-zinc-400 font-medium truncate">
            {message.audioData ? '🎤 Mensagem de voz' : message.text}
          </p>
        </div>

        {/* 1. Editar mensagem */}
        {canEdit && (
          <button
            onClick={() => {
              onClose();
              onEdit(message);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer text-left"
          >
            <Pencil className="w-4 h-4 text-indigo-400" />
            <span>Editar mensagem</span>
          </button>
        )}

        {/* 2. Fixar mensagem para mim */}
        <button
          onClick={() => {
            onClose();
            onTogglePin(message);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer text-left"
        >
          {isPinned ? (
            <>
              <PinOff className="w-4 h-4 text-amber-400" />
              <span>Desafixar para mim</span>
            </>
          ) : (
            <>
              <Pin className="w-4 h-4 text-amber-400" />
              <span>Fixar mensagem para mim</span>
            </>
          )}
        </button>

        {/* 3. Excluir para mim */}
        <button
          onClick={() => {
            onClose();
            onDeleteForMe(message);
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer text-left"
        >
          <UserX className="w-4 h-4 text-zinc-400" />
          <span>Excluir para mim</span>
        </button>

        {/* 4. Excluir para todos */}
        {canDeleteForEveryone && (
          <button
            onClick={() => {
              onClose();
              onDeleteForEveryone(message);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition-colors cursor-pointer text-left"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir para todos</span>
          </button>
        )}

        {/* Cancel button */}
        <div className="pt-1 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="w-full py-2 text-center text-xs text-zinc-400 hover:text-zinc-200 font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
