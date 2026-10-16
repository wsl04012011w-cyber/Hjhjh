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
  const timeFormatted = formatMessageTime(message.createdAt);

  if (isCurrentUser) {
    // Current user's message: Aligned to the RIGHT in an indigo bubble
    return (
      <div className={`w-full flex justify-end px-2 sm:px-4 ${isSequential ? 'mt-1' : 'mt-2.5'}`}>
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0 flex flex-col items-end">
          <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm min-w-0 break-words [overflow-wrap:anywhere] break-all">
            {/* Message text */}
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] break-all select-text">
              {message.text}
            </p>

            {/* Time & Delivery / Read status */}
            <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5 text-[10px] text-indigo-200 select-none">
              <span>{timeFormatted}</span>
              {isRead ? (
                <span title="Mensagem lida">
                  <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                </span>
              ) : (
                <span title="Mensagem enviada">
                  <Check className="w-3.5 h-3.5 text-indigo-300/80" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Friend's message: Aligned to the LEFT in a dark zinc bubble with avatar
  return (
    <div className={`w-full flex justify-start items-end gap-2 px-2 sm:px-4 ${isSequential ? 'mt-1' : 'mt-2.5'}`}>
      {/* Friend's avatar on the left */}
      {!isSequential ? (
        <Avatar
          name={message.senderName}
          avatarColor={message.senderAvatarColor}
          photoURL={message.senderPhotoURL}
          size="sm"
          className="mb-1 flex-shrink-0"
        />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message bubble */}
      <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0 flex flex-col items-start">
        <div className="bg-zinc-850 bg-zinc-800/90 text-zinc-100 rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-sm border border-zinc-700/50 min-w-0 break-words [overflow-wrap:anywhere] break-all">
          {/* Sender name for group chats */}
          {chatType === 'group' && !isSequential && (
            <p
              className="text-xs font-semibold mb-1 truncate block"
              style={{ color: message.senderAvatarColor || '#818CF8' }}
            >
              {message.senderName}
            </p>
          )}

          {/* Message text with complete anti-overflow wrapping */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] break-all select-text text-zinc-100">
            {message.text}
          </p>

          {/* Timestamp */}
          <div className="flex items-center justify-end mt-1 -mb-0.5 text-[10px] text-zinc-400 select-none">
            <span>{timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
