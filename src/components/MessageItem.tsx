import React, { useRef } from 'react';
import { Message } from '../types/chat';
import { Avatar } from './Avatar';
import { AudioPlayer } from './AudioPlayer';
import { formatMessageTime } from '../lib/utils';
import { Check, CheckCheck, Pin, FileText, Download } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  isSequential: boolean;
  chatType: 'direct' | 'group';
  currentUserId: string;
  onOpenMenu: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  isSequential,
  chatType,
  currentUserId,
  onOpenMenu,
}) => {
  // If user chose "Excluir para mim", do not render
  if (message.hiddenFor?.includes(currentUserId)) {
    return null;
  }

  const isRead = message.readBy && message.readBy.length > 1;
  const timeFormatted = formatMessageTime(message.createdAt);
  const isAudio = Boolean(message.audioData);
  const isPinned = message.pinnedFor?.includes(currentUserId);
  const isDeleted = Boolean(message.deletedForAll);

  const longPressTimerRef = useRef<any>(null);

  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      onOpenMenu(message);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onOpenMenu(message);
  };

  // Render attachment if exists
  const renderAttachment = () => {
    if (!message.attachmentUrl || isDeleted) return null;

    if (message.attachmentType === 'image') {
      return (
        <div className="mb-2 overflow-hidden rounded-xl">
          <img
            src={message.attachmentUrl}
            alt={message.attachmentName || 'Foto anexada'}
            className="max-h-64 sm:max-h-80 w-auto rounded-xl object-contain bg-black/20 hover:opacity-95 transition-opacity cursor-pointer"
            onClick={() => {
              const win = window.open();
              win?.document.write(`<img src="${message.attachmentUrl}" style="max-width:100%;height:auto;margin:auto;" />`);
            }}
          />
        </div>
      );
    }

    if (message.attachmentType === 'txt') {
      return (
        <div className="mb-2 p-2.5 rounded-xl bg-black/20 flex items-center justify-between gap-3 border border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate text-white">
                {message.attachmentName || 'arquivo.txt'}
              </p>
              {message.attachmentSize && (
                <p className="text-[10px] text-zinc-400">
                  {Math.round(message.attachmentSize / 1024)} KB
                </p>
              )}
            </div>
          </div>

          <a
            href={message.attachmentUrl}
            download={message.attachmentName || 'arquivo.txt'}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer flex-shrink-0"
            title="Baixar arquivo txt"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      );
    }

    return null;
  };

  if (isCurrentUser) {
    // Current user's message: Aligned to the RIGHT in an indigo bubble
    return (
      <div
        className={`w-full flex justify-end px-2 sm:px-4 ${isSequential ? 'mt-1' : 'mt-2.5'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0 flex flex-col items-end group">
          <div
            className={`rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-sm min-w-0 break-words [overflow-wrap:anywhere] break-all transition-all select-none sm:select-text cursor-pointer ${
              isDeleted
                ? 'bg-zinc-800/80 text-zinc-400 italic border border-zinc-700/40'
                : 'bg-indigo-600 text-white active:scale-[0.99]'
            }`}
          >
            {/* Pinned banner indicator */}
            {isPinned && (
              <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mb-1 pb-1 border-b border-indigo-400/30">
                <Pin className="w-3 h-3 fill-current" />
                <span>Mensagem fixada</span>
              </div>
            )}

            {/* Attachment */}
            {renderAttachment()}

            {/* Audio or Text */}
            {isAudio && !isDeleted ? (
              <AudioPlayer
                audioSrc={message.audioData!}
                duration={message.audioDuration}
                isCurrentUser={true}
              />
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] break-all">
                {message.text}
              </p>
            )}

            {/* Time & Delivery / Read status & Edited flag */}
            <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5 text-[10px] text-indigo-200 select-none">
              {message.edited && !isDeleted && (
                <span className="italic opacity-80">(editada)</span>
              )}
              <span>{timeFormatted}</span>
              {!isDeleted && (
                isRead ? (
                  <span title="Mensagem lida">
                    <CheckCheck className="w-3.5 h-3.5 text-indigo-200" />
                  </span>
                ) : (
                  <span title="Mensagem enviada">
                    <Check className="w-3.5 h-3.5 text-indigo-300/80" />
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Friend's message: Aligned to the LEFT in a dark zinc bubble with avatar
  return (
    <div
      className={`w-full flex justify-start items-end gap-2 px-2 sm:px-4 ${isSequential ? 'mt-1' : 'mt-2.5'}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
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
      <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[65%] min-w-0 flex flex-col items-start group">
        <div
          className={`rounded-2xl rounded-tl-xs px-4 py-2.5 shadow-sm min-w-0 break-words [overflow-wrap:anywhere] break-all border border-zinc-700/50 transition-all select-none sm:select-text cursor-pointer ${
            isDeleted
              ? 'bg-zinc-850/60 text-zinc-400 italic'
              : 'bg-zinc-800/95 text-zinc-100 active:scale-[0.99]'
          }`}
        >
          {/* Pinned banner indicator */}
          {isPinned && (
            <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mb-1 pb-1 border-b border-zinc-700">
              <Pin className="w-3 h-3 fill-current" />
              <span>Mensagem fixada por você</span>
            </div>
          )}

          {/* Sender name for group chats */}
          {chatType === 'group' && !isSequential && !isDeleted && (
            <p
              className="text-xs font-semibold mb-1 truncate block"
              style={{ color: message.senderAvatarColor || '#818CF8' }}
            >
              {message.senderName}
            </p>
          )}

          {/* Attachment */}
          {renderAttachment()}

          {/* Audio player or text message */}
          {isAudio && !isDeleted ? (
            <AudioPlayer
              audioSrc={message.audioData!}
              duration={message.audioDuration}
              isCurrentUser={false}
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] break-all text-zinc-100">
              {message.text}
            </p>
          )}

          {/* Timestamp & Edited flag */}
          <div className="flex items-center justify-end gap-1.5 mt-1 -mb-0.5 text-[10px] text-zinc-400 select-none">
            {message.edited && !isDeleted && (
              <span className="italic opacity-80">(editada)</span>
            )}
            <span>{timeFormatted}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
