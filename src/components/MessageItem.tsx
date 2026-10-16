import React from 'react';
import { Message } from '../types/chat';
import { Avatar } from './Avatar';
import { formatMessageTime } from '../lib/utils';
import { Check, CheckCheck } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isSequential: boolean;
  chatType: 'direct' | 'group';
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  isSequential,
  chatType,
}) => {
  const isRead = message.readBy && message.readBy.length > 1;

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-1 hover:bg-zinc-800/20 dark:hover:bg-zinc-800/30 transition-colors rounded-xl ${
        isSequential ? 'mt-0.5' : 'mt-3'
      }`}
    >
      {/* Avatar or spacer for sequential messages */}
      {!isSequential ? (
        <Avatar
          name={message.senderName}
          avatarColor={message.senderAvatarColor}
          photoURL={message.senderPhotoURL}
          size="md"
        />
      ) : (
        <div className="w-10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {formatMessageTime(message.createdAt)?.split(' às ')[1] || ''}
          </span>
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {!isSequential && (
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs font-bold"
              style={{ color: message.senderAvatarColor || '#818CF8' }}
            >
              {message.senderName}
            </span>
            {isCurrentUser && (
              <span className="text-[10px] text-zinc-400 font-normal">
                (você)
              </span>
            )}
            <span className="text-[10px] text-zinc-400">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Text bubble */}
        <div className="flex items-end gap-2 flex-wrap">
          <div
            className={`text-sm break-words leading-relaxed whitespace-pre-wrap select-text ${
              isCurrentUser
                ? 'text-zinc-100'
                : 'text-zinc-200'
            }`}
          >
            {message.text}
          </div>

          {/* Delivery & Read Receipts for current user */}
          {isCurrentUser && (
            <div
              className="flex items-center gap-0.5 text-[10px] text-zinc-400 flex-shrink-0 mb-0.5 select-none"
              title={isRead ? 'Lido' : 'Enviado'}
            >
              {isRead ? (
                <span className="flex items-center gap-0.5 text-indigo-400" title="Mensagem lida">
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[9px]">Lido</span>
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-zinc-400" title="Enviada">
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-[9px]">Enviado</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
