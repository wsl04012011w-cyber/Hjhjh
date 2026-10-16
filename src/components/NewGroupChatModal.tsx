import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { findUserByShortId, createGroupChat } from '../services/chatService';
import { UserDirectoryEntry } from '../types/chat';
import { Avatar } from './Avatar';
import { X, Users, Plus, AlertCircle, Trash2 } from 'lucide-react';

interface NewGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export const NewGroupChatModal: React.FC<NewGroupChatModalProps> = ({
  isOpen,
  onClose,
  onChatCreated,
}) => {
  const { userProfile } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [shortIdInput, setShortIdInput] = useState('');
  const [members, setMembers] = useState<UserDirectoryEntry[]>([]);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);

  if (!isOpen || !userProfile) return null;

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = shortIdInput.trim().toUpperCase();

    if (cleanId.length !== 8) {
      setErrorMsg('O ID de usuário deve ter exatamente 8 caracteres.');
      return;
    }

    if (cleanId === userProfile.shortId) {
      setErrorMsg('Você já está incluído no grupo como criador.');
      return;
    }

    if (members.some(m => m.shortId === cleanId)) {
      setErrorMsg('Este amigo já foi adicionado à lista.');
      return;
    }

    try {
      setSearching(true);
      setErrorMsg(null);
      const friend = await findUserByShortId(cleanId);
      if (!friend) {
        setErrorMsg(`Nenhum usuário encontrado com o ID #${cleanId}.`);
        return;
      }

      setMembers(prev => [...prev, friend]);
      setShortIdInput('');
    } catch {
      setErrorMsg('Erro ao procurar usuário. Tente novamente.');
    } finally {
      setSearching(false);
    }
  };

  const handleRemoveMember = (shortId: string) => {
    setMembers(prev => prev.filter(m => m.shortId !== shortId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setErrorMsg('Dê um nome para o seu grupo.');
      return;
    }

    if (members.length === 0) {
      setErrorMsg('Adicione pelo menos um amigo ao grupo.');
      return;
    }

    try {
      setCreatingGroup(true);
      setErrorMsg(null);
      const chatId = await createGroupChat(userProfile, groupName.trim(), members);
      onChatCreated(chatId);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao criar grupo.');
    } finally {
      setCreatingGroup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Criar Novo Grupo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Group Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Nome do Grupo
            </label>
            <input
              type="text"
              value={groupName}
              maxLength={60}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ex: Turma da Faculdade, Jogatina..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Add member by ID */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Adicionar Membros por ID
            </label>
            <form onSubmit={handleAddMember} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 font-mono font-bold">
                  #
                </div>
                <input
                  type="text"
                  value={shortIdInput}
                  maxLength={8}
                  onChange={(e) => setShortIdInput(e.target.value.toUpperCase())}
                  placeholder="ID de 8 caracteres"
                  className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-zinc-800/90 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white font-mono uppercase text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={searching || shortIdInput.trim().length !== 8}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
              >
                {searching ? (
                  <div className="w-3.5 h-3.5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span>Adicionar</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="flex items-start gap-2 text-xs text-rose-300 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Member List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Membros selecionados ({members.length + 1})</span>
              <span className="text-[11px] text-zinc-500">Você + {members.length} adicionados</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {/* Creator item */}
              <div className="p-2.5 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar
                    name={userProfile.displayName}
                    avatarColor={userProfile.avatarColor}
                    photoURL={userProfile.photoURL}
                    size="sm"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {userProfile.displayName} <span className="text-[10px] text-indigo-400 font-normal">(Você / Criador)</span>
                    </p>
                    <p className="font-mono text-[10px] text-zinc-500">#{userProfile.shortId}</p>
                  </div>
                </div>
              </div>

              {/* Added members */}
              {members.map((member) => (
                <div
                  key={member.shortId}
                  className="p-2.5 rounded-xl bg-zinc-800/70 border border-zinc-700/60 flex items-center justify-between animate-in fade-in duration-150"
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={member.displayName}
                      avatarColor={member.avatarColor}
                      photoURL={member.photoURL}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-semibold text-white">{member.displayName}</p>
                      <p className="font-mono text-[10px] text-zinc-400">#{member.shortId}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.shortId)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
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
            disabled={!groupName.trim() || members.length === 0 || creatingGroup}
            onClick={handleCreateGroup}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            {creatingGroup ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>Criar Grupo</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
