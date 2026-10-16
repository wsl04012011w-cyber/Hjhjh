import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Chat } from '../types/chat';
import { Avatar } from './Avatar';
import { formatChatListTime } from '../lib/utils';
import { 
  MessageSquare, 
  Users, 
  Plus, 
  Search, 
  Settings, 
  Moon, 
  Sun, 
  Copy, 
  Check, 
  UserPlus
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenNewDirectModal: () => void;
  onOpenNewGroupModal: () => void;
  onOpenProfileModal: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenNewDirectModal,
  onOpenNewGroupModal,
  onOpenProfileModal,
  className = '',
}) => {
  const { userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'group'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyMyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile?.shortId) return;
    navigator.clipboard.writeText(userProfile.shortId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Filter chats by tab and query
  const filteredChats = chats.filter((chat) => {
    if (activeTab === 'direct' && chat.type !== 'direct') return false;
    if (activeTab === 'group' && chat.type !== 'group') return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    if (chat.type === 'group') {
      return chat.name.toLowerCase().includes(query);
    } else {
      // Find other participant's name or short ID
      const otherParticipant = Object.values(chat.participantDetails || {}).find(
        (p) => p.userId !== userProfile?.userId
      );
      if (!otherParticipant) return false;
      return (
        otherParticipant.displayName.toLowerCase().includes(query) ||
        otherParticipant.shortId.toLowerCase().includes(query)
      );
    }
  });

  const directCount = chats.filter((c) => c.type === 'direct').length;
  const groupCount = chats.filter((c) => c.type === 'group').length;

  return (
    <aside
      className={`w-full md:w-80 lg:w-88 flex flex-col bg-zinc-900 dark:bg-zinc-950 border-r border-zinc-800 dark:border-zinc-800/80 h-full select-none ${className}`}
    >
      {/* Top Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-600/30">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Papo</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Amigos
              </span>
            </h1>
            <p className="text-[11px] text-zinc-400">Conversas em tempo real</p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNewDirectModal}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-indigo-600 text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Nova Conversa Direta (por ID)"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewGroupModal}
            className="p-2 rounded-xl bg-zinc-800/80 hover:bg-purple-600 text-zinc-300 hover:text-white transition-all shadow-sm cursor-pointer"
            title="Criar Novo Grupo"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/60 focus:border-indigo-500 focus:outline-none text-zinc-200 placeholder:text-zinc-500 text-xs transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-1 border-b border-zinc-800/60">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <span>Todas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/60 text-zinc-300">
            {chats.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('direct')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'direct'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <span>Diretas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/60 text-zinc-300">
            {directCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'group'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
          }`}
        >
          <span>Grupos</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-700/60 text-zinc-300">
            {groupCount}
          </span>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filteredChats.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 text-zinc-500 mx-auto flex items-center justify-center mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-zinc-300">Nenhuma conversa encontrada</p>
            <p className="text-xs text-zinc-500 mt-1">
              Inicie um chat direto informando o ID de um amigo ou crie um grupo!
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={onOpenNewDirectModal}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                + Nova Conversa Direta
              </button>
              <button
                onClick={onOpenNewGroupModal}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                + Criar Grupo
              </button>
            </div>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = chat.id === activeChatId;
            const isUnread = chat.unreadBy?.includes(userProfile?.userId || '');

            let title = '';
            let subtitle = chat.lastMessageText || 'Conversa iniciada';
            let avatarName = '';
            let avatarColor = '#6366F1';
            let photoURL: string | undefined = undefined;
            let shortIdTag = '';

            if (chat.type === 'group') {
              title = chat.name;
              avatarName = chat.name;
              avatarColor = '#8B5CF6';
            } else {
              // Direct chat: get the other participant
              const other = Object.values(chat.participantDetails || {}).find(
                (p) => p.userId !== userProfile?.userId
              );
              title = other?.displayName || 'Amigo';
              avatarName = other?.displayName || 'A';
              avatarColor = other?.avatarColor || '#6366F1';
              photoURL = other?.photoURL;
              shortIdTag = other?.shortId ? `#${other.shortId}` : '';
            }

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center gap-3 relative ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-300 hover:bg-zinc-800/70 hover:text-white'
                }`}
              >
                {/* Avatar */}
                {chat.type === 'group' ? (
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${
                      isSelected ? 'bg-indigo-700' : 'bg-purple-600'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                ) : (
                  <Avatar
                    name={avatarName}
                    avatarColor={avatarColor}
                    photoURL={photoURL}
                    size="md"
                  />
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-sm truncate">
                        {title}
                      </span>
                      {shortIdTag && !isSelected && (
                        <span className="font-mono text-[10px] text-zinc-400">
                          {shortIdTag}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] flex-shrink-0 ml-1.5 ${
                        isSelected ? 'text-indigo-200' : 'text-zinc-400'
                      }`}
                    >
                      {formatChatListTime(chat.lastMessageAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs truncate ${
                        isSelected
                          ? 'text-indigo-100'
                          : isUnread
                          ? 'text-white font-semibold'
                          : 'text-zinc-400'
                      }`}
                    >
                      {subtitle}
                    </p>

                    {isUnread && (
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ml-1.5 ${
                          isSelected ? 'bg-white' : 'bg-indigo-500 ring-2 ring-indigo-400/30'
                        }`}
                        title="Nova mensagem"
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* User Bar / Footer */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-900/90 dark:bg-zinc-950/90 flex items-center justify-between">
        <button
          onClick={onOpenProfileModal}
          className="flex items-center gap-2.5 min-w-0 flex-1 hover:bg-zinc-800/60 p-1.5 rounded-xl transition-colors cursor-pointer text-left mr-1"
          title="Ver perfil e opções"
        >
          <Avatar
            name={userProfile?.displayName || 'Usuário'}
            avatarColor={userProfile?.avatarColor}
            photoURL={userProfile?.photoURL}
            status={userProfile?.status}
            size="md"
            showStatus={true}
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs text-white truncate">
              {userProfile?.displayName}
            </p>
            <div className="flex items-center gap-1">
              <span className="font-mono text-[11px] text-indigo-400 truncate">
                #{userProfile?.shortId}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Quick Copy Short ID */}
          <button
            onClick={handleCopyMyId}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Copiar meu ID de amigo"
          >
            {copiedId ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Profile Modal trigger */}
          <button
            onClick={onOpenProfileModal}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Configurações do perfil"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
