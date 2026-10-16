import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, Copy, Check, UserPlus } from 'lucide-react';

interface EmptyChatStateProps {
  onOpenFriendsModal: () => void;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({
  onOpenFriendsModal,
}) => {
  const { userProfile } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleCopyId = () => {
    if (!userProfile?.shortId) return;
    navigator.clipboard.writeText(userProfile.shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-100 select-none">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Ambient Icon */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-3xl blur-xl" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-600/30 text-white">
            <MessageSquare className="w-10 h-10" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Bem-vindo ao Papo!
          </h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Selecione uma conversa ou gerencie seus amigos para começar a conversar.
          </p>
        </div>

        {/* User's ID card */}
        {userProfile && (
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-lg text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
                  Compartilhe seu ID com amigos
                </p>
                <p className="font-mono text-xl font-bold text-indigo-400 mt-0.5">
                  #{userProfile.shortId}
                </p>
              </div>

              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 font-semibold text-xs border border-indigo-500/30 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar ID</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Seus amigos podem te adicionar usando este código de 8 caracteres.
            </p>
          </div>
        )}

        {/* Action Button */}
        <div>
          <button
            onClick={onOpenFriendsModal}
            className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.99] cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Ver Amigos & Adicionar Novo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
