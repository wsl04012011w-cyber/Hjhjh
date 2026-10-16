import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { findUserByShortId, createOrGetDirectChat } from '../services/chatService';
import { Chat, UserDirectoryEntry } from '../types/chat';
import { Avatar } from './Avatar';
import { 
  Users, 
  UserPlus, 
  X, 
  Search, 
  MessageSquare, 
  Copy, 
  Check, 
  AlertCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  onOpenChat: (chatId: string) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  chats,
  onOpenChat,
}) => {
  const { userProfile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [shortIdInput, setShortIdInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<UserDirectoryEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addingFriend, setAddingFriend] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Extract all unique friends from 1:1 direct chats
  const friendsList = React.useMemo(() => {
    if (!userProfile) return [];
    const directChats = chats.filter((c) => c.type === 'direct');
    const friendsMap = new Map<string, { user: any; chatId: string }>();

    for (const chat of directChats) {
      const other = Object.values(chat.participantDetails || {}).find(
        (p) => p.userId !== userProfile.userId
      );
      if (other && !friendsMap.has(other.userId)) {
        friendsMap.set(other.userId, { user: other, chatId: chat.id });
      }
    }

    return Array.from(friendsMap.values());
  }, [chats, userProfile]);

  // Search when typing 8 chars
  useEffect(() => {
    const clean = shortIdInput.trim().toUpperCase();
    if (clean.length === 8) {
      if (clean === userProfile?.shortId) {
        setFoundUser(null);
        setErrorMsg('Este é o seu próprio ID!');
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
            setErrorMsg(`Nenhum amigo encontrado com o ID #${clean}.`);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setErrorMsg('Erro ao buscar ID.');
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

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddAndChat = async () => {
    if (!foundUser) return;
    try {
      setAddingFriend(true);
      setErrorMsg(null);
      const chatId = await createOrGetDirectChat(userProfile, foundUser);
      onOpenChat(chatId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao adicionar amigo');
    } finally {
      setAddingFriend(false);
    }
  };

  const filteredFriends = friendsList.filter(({ user }) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      user.displayName.toLowerCase().includes(q) ||
      user.shortId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <span>Amigos</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-normal">
                  {friendsList.length}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShortIdInput('');
                setFoundUser(null);
                setErrorMsg(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                showAddForm
                  ? 'bg-zinc-800 text-zinc-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Voltar para lista' : 'Adicionar amigo'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Friend Form View */}
        {showAddForm ? (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <h3 className="font-semibold text-sm text-white">Adicionar amigo por ID</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Peça o código de 8 caracteres do seu amigo e digite abaixo.
              </p>
            </div>

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

            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-zinc-400 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {foundUser && (
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={foundUser.displayName}
                    avatarColor={foundUser.avatarColor}
                    photoURL={foundUser.photoURL}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white truncate">
                      {foundUser.displayName}
                    </p>
                    <p className="font-mono text-xs text-indigo-300">
                      #{foundUser.shortId}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleAddAndChat}
                  disabled={addingFriend}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer flex-shrink-0"
                >
                  {addingFriend ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Conversar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Friends List View */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Search filter if there are friends */}
            {friendsList.length > 3 && (
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filtrar amigos..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/60 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {filteredFriends.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 text-zinc-500 mx-auto flex items-center justify-center mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm text-zinc-200">
                  {friendsList.length === 0 ? 'Nenhum amigo ainda' : 'Nenhum amigo encontrado com essa busca'}
                </h4>
                <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                  {friendsList.length === 0
                    ? 'Adicione seus amigos usando o código ID de 8 caracteres deles para começar a conversar!'
                    : 'Tente outro nome ou código de ID.'}
                </p>
                {friendsList.length === 0 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar novo amigo</span>
                  </button>
                )}
              </div>
            ) : (
              filteredFriends.map(({ user, chatId }) => (
                <div
                  key={user.userId}
                  className="p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={user.displayName}
                      avatarColor={user.avatarColor}
                      photoURL={user.photoURL}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-white truncate">
                        {user.displayName}
                      </p>
                      <button
                        onClick={() => handleCopy(user.shortId)}
                        className="font-mono text-xs text-zinc-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copiar ID"
                      >
                        <span>#{user.shortId}</span>
                        {copiedId === user.shortId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenChat(chatId);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer flex-shrink-0 border border-zinc-700 hover:border-indigo-500"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Conversar</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/60 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span>Seu ID:</span>
            <span className="font-bold text-indigo-400">#{userProfile.shortId}</span>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
