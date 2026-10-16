import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { findUserByShortId, createOrGetDirectChat } from '../services/chatService';
import { UserDirectoryEntry } from '../types/chat';
import { Avatar } from './Avatar';
import { X, Search, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NewDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const { userProfile } = useAuth();
  const [shortIdInput, setShortIdInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<UserDirectoryEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [startingChat, setStartingChat] = useState(false);

  // Search when 8 valid chars are entered
  useEffect(() => {
    const clean = shortIdInput.trim().toUpperCase();
    if (clean.length === 8) {
      if (clean === userProfile?.shortId) {
        setFoundUser(null);
        setErrorMsg('Este é o seu próprio ID! Digite o ID de um amigo.');
        return;
      }

      let isMounted = true;
      setSearching(true);
      setErrorMsg(null);

      findUserByShortId(clean)
        .then((user) => {
          if (!isMounted) return;
          if (user) {
            setFoundUser(user);
            setErrorMsg(null);
          } else {
            setFoundUser(null);
            setErrorMsg(`Nenhum usuário encontrado com o ID #${clean}.`);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setErrorMsg('Erro ao buscar usuário. Tente novamente.');
        })
        .finally(() => {
          if (isMounted) setSearching(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setFoundUser(null);
      if (clean.length > 0 && clean.length < 8) {
        setErrorMsg(`Digite os 8 caracteres (faltam ${8 - clean.length})`);
      } else {
        setErrorMsg(null);
      }
    }
  }, [shortIdInput, userProfile?.shortId]);

  if (!isOpen || !userProfile) return null;

  const handleStartChat = async () => {
    if (!foundUser) return;

    try {
      setStartingChat(true);
      const chatId = await createOrGetDirectChat(userProfile, foundUser);
      onChatCreated(chatId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao iniciar conversa');
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Nova Conversa Direta</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-400">
            Digite o ID de 8 caracteres do seu amigo para iniciar um bate-papo direto.
          </p>

          {/* Input field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-mono font-bold">
              #
            </div>
            <input
              type="text"
              value={shortIdInput}
              maxLength={8}
              onChange={(e) => setShortIdInput(e.target.value.toUpperCase())}
              placeholder="Ex: 8K9M2N4X"
              autoFocus
              className="w-full pl-8 pr-10 py-3 rounded-xl bg-zinc-800/90 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white font-mono uppercase tracking-widest text-base placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
            />
            {searching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Error / Status info */}
          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-zinc-400 p-2.5 rounded-lg bg-zinc-800/40">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Found User Card */}
          {foundUser && (
            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-150">
              <Avatar
                name={foundUser.displayName}
                avatarColor={foundUser.avatarColor}
                photoURL={foundUser.photoURL}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">
                  {foundUser.displayName}
                </p>
                <p className="font-mono text-xs text-indigo-300">
                  #{foundUser.shortId}
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-2 bg-zinc-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!foundUser || startingChat}
            onClick={handleStartChat}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {startingChat ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <MessageSquare className="w-4 h-4" />
                <span>Iniciar Conversa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
