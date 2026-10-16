import React from 'react';
import { PresenceStatus } from '../types/chat';

interface AvatarProps {
  name: string;
  avatarColor?: string;
  photoURL?: string;
  status?: PresenceStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarColor = '#6366F1',
  photoURL,
  status,
  size = 'md',
  className = '',
  showStatus = false,
}) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-16 h-16 text-xl font-bold',
  }[size];

  const statusDotSize = {
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border-[1.5px]',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
    xl: 'w-4 h-4 bottom-1 right-1 border-2',
  }[size];

  const statusColor = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    busy: 'bg-rose-500',
    offline: 'bg-zinc-400',
  }[status || 'offline'];

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={name}
          className={`${sizeClasses} rounded-full object-cover shadow-sm border border-black/10 dark:border-white/10`}
          onError={(e) => {
            // Fallback to initial if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses} rounded-full flex items-center justify-center text-white shadow-sm select-none border border-black/10 dark:border-white/10`}
          style={{ backgroundColor: avatarColor }}
        >
          {initial}
        </div>
      )}

      {showStatus && status && (
        <span
          className={`absolute rounded-full border-white dark:border-zinc-900 ${statusColor} ${statusDotSize}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
