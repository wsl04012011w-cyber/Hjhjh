import React, { useState } from 'react';
import { Message } from '../types/chat';
import { X, Check } from 'lucide-react';

interface EditMessageModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (messageId: string, newText: string) => Promise<void>;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  message,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editText, setEditText] = useState(message?.text || '');
  const [saving, setSaving] = useState(false);

  // Sync state when message changes
  React.useEffect(() => {
    if (message) setEditText(message.text);
  }, [message]);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim() || saving) return;

    try {
      setSaving(true);
      await onSave(message.id, editText.trim());
      onClose();
    } catch (err) {
      console.error('Erro ao editar mensagem:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-white">Editar Mensagem</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoFocus
            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white text-sm resize-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!editText.trim() || saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              {saving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
