import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Chat } from '../types/chat';
import { Avatar } from './Avatar';
import { formatChatListTime } from '../lib/utils';
import { 
  Settings, 
  Moon, 
  Sun, 
  Copy, 
  Check, 
  LogOut,
  Users
} from 'lucide-react';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenProfileModal: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chats,
  activeChatId,
  onSelectChat,
  onOpenProfileModal,
  className = '',
}) => {
  const { userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleCopyMyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userProfile?.shortId) return;
    navigator.clipboard.writeText(userProfile.shortId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <aside
      className={`w-full md:w-80 lg:w-88 flex flex-col bg-zinc-900 dark:bg-zinc-950 border-r border-zinc-800 dark:border-zinc-800/80 h-full select-none ${className}`}
    >
      {/* 
        Clean chat list filling the sidebar directly (no top bar, no search input, no tabs)
      */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {chats.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <p className="text-sm font-medium text-zinc-400">Nenhuma conversa ainda</p>
            <p className="text-xs text-zinc-500 mt-1">
              Use o botão de amigos no canto inferior para encontrar e adicionar amigos pelo ID!
            </p>
          </div>
        ) : (
          chats.map((chat) => {
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
              // Direct chat: other participant
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

      {/* 
        Minimized Bottom Bar:
        Contains ONLY the profile avatar with NO dividing line.
        When clicked, opens a clean dropdown menu with user info & settings.
      */}
      <div className="p-3 bg-zinc-900/90 dark:bg-zinc-950/90 flex items-center relative">
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="p-1 rounded-full hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer flex items-center justify-center focus:outline-none"
            title="Menu do Perfil"
          >
            <Avatar
              name={userProfile?.displayName || 'Usuário'}
              avatarColor={userProfile?.avatarColor}
              photoURL={userProfile?.photoURL}
              status={userProfile?.status}
              size="md"
              showStatus={true}
            />
          </button>

          {/* Profile Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-64 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              {/* User Header */}
              <div className="p-2.5 rounded-xl bg-zinc-800/60 mb-1">
                <p className="font-semibold text-xs text-white truncate">
                  {userProfile?.displayName}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-xs text-indigo-400 font-bold">
                    #{userProfile?.shortId}
                  </span>
                  <button
                    onClick={handleCopyMyId}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white px-2 py-0.5 rounded bg-zinc-700/60 transition-colors cursor-pointer"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Menu items */}
              <div className="space-y-0.5 text-xs text-zinc-300">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>Configurações do Perfil</span>
                </button>

                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer text-left"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Tema Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Tema Escuro</span>
                    </>
                  )}
                </button>

                <div className="my-1 border-t border-zinc-800" />

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
