import React, { useState } from 'react';
import { Chat } from '../types/chat';
import { Avatar } from './Avatar';
import { X, Users, Copy, Check, Crown } from 'lucide-react';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  onOpenDirectChat?: (shortId: string) => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  isOpen,
  onClose,
  chat,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (shortId: string) => {
    navigator.clipboard.writeText(shortId);
    setCopiedId(shortId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const participants = Object.values(chat.participantDetails || {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white truncate max-w-[240px]">
                {chat.name}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {participants.length} participante{participants.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Lista de Participantes
          </p>

          <div className="space-y-2">
            {participants.map((p) => {
              const isCreator = p.userId === chat.createdBy;
              return (
                <div
                  key={p.userId}
                  className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={p.displayName}
                      avatarColor={p.avatarColor}
                      photoURL={p.photoURL}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate">
                          {p.displayName}
                        </span>
                        {isCreator && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            title="Criador do Grupo"
                          >
                            <Crown className="w-3 h-3" />
                            Criador
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs text-zinc-400 block">
                        #{p.shortId}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopy(p.shortId)}
                    className="p-2 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700/60 transition-colors cursor-pointer flex-shrink-0"
                    title="Copiar ID do usuário"
                  >
                    {copiedId === p.shortId ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex justify-end bg-zinc-900/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
