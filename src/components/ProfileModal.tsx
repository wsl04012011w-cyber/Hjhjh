import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { AVATAR_COLORS } from '../lib/utils';
import { PresenceStatus } from '../types/chat';
import { 
  X, 
  Copy, 
  Check, 
  LogOut, 
  Save, 
  Upload, 
  Trash2, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, updateUserProfile, logout } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [avatarColor, setAvatarColor] = useState(userProfile?.avatarColor || AVATAR_COLORS[0]);
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [status, setStatus] = useState<PresenceStatus>(userProfile?.status || 'online');
  const [statusMessage, setStatusMessage] = useState(userProfile?.statusMessage || '');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!isOpen || !userProfile) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(userProfile.shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setSaveError('A imagem deve ter no máximo 500 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
      setSaveError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setSaveError('O nome de exibição não pode ser vazio.');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);
      await updateUserProfile({
        displayName: displayName.trim(),
        avatarColor,
        photoURL,
        status,
        statusMessage: statusMessage.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setSaveError(err?.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-lg text-white">Meu Perfil</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          {/* ID Showcase Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-zinc-900 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
                  Seu ID de Amigo
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-2xl font-bold tracking-widest text-white">
                    #{userProfile.shortId}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Passe este código para outros usuários te encontrarem e iniciarem uma conversa.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-md active:scale-95 cursor-pointer flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Avatar & Preview */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Foto & Avatar
            </label>
            <div className="flex items-center gap-4">
              <Avatar
                name={displayName || userProfile.displayName}
                avatarColor={avatarColor}
                photoURL={photoURL}
                status={status}
                size="xl"
                showStatus={true}
              />

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 cursor-pointer transition-colors border border-zinc-700">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Enviar foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>

                  {photoURL && (
                    <button
                      type="button"
                      onClick={() => setPhotoURL('')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-900/50 text-xs font-medium text-rose-300 cursor-pointer transition-colors border border-zinc-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover foto</span>
                    </button>
                  )}
                </div>

                {/* Color swatches */}
                <div>
                  <span className="text-[11px] text-zinc-500 block mb-1.5">Cor da Inicial:</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAvatarColor(c)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer border ${
                          avatarColor === c ? 'scale-125 border-white ring-2 ring-indigo-500' : 'border-black/20 hover:scale-110'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Nome de Exibição
            </label>
            <input
              type="text"
              value={displayName}
              maxLength={50}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Como quer ser chamado?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white text-sm"
            />
          </div>

          {/* Status selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Status de Presença
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'online', label: 'Online', color: 'bg-emerald-500' },
                  { id: 'away', label: 'Ausente', color: 'bg-amber-500' },
                  { id: 'busy', label: 'Ocupado', color: 'bg-rose-500' },
                  { id: 'offline', label: 'Invisível', color: 'bg-zinc-400' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    status === s.id
                      ? 'bg-zinc-800 border-indigo-500 text-white shadow-sm'
                      : 'bg-zinc-800/40 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Mensagem de Status / Bio
            </label>
            <input
              type="text"
              value={statusMessage}
              maxLength={100}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="Ex: No trabalho, jogando, disponível para conversar..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 focus:border-indigo-500 focus:outline-none text-white text-sm"
            />
          </div>

          {saveError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>Alterações salvas com sucesso!</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-semibold cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
