import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, Shield, Hash, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { loginWithGoogle, error, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showHowToTest, setShowHowToTest] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
    } catch {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden select-none">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-zinc-900/90 border border-zinc-800 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Papo
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Mensagens instantâneas simples e modernas para você e seus amigos
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={clearError}
                className="text-xs text-rose-400 underline hover:text-rose-300 mt-1 cursor-pointer"
              >
                Dispensar
              </button>
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-60 cursor-pointer mb-6"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G logo */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com Google</span>
            </>
          )}
        </button>

        {/* Feature Highlights */}
        <div className="space-y-3 pt-4 border-t border-zinc-800 text-xs text-zinc-300">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/40">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">ID de Amigo (8 caracteres)</p>
              <p className="text-zinc-400">Seu código exclusivo para ser encontrado com facilidade</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/40">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">Conversas 1 a 1 & Grupos</p>
              <p className="text-zinc-400">Crie conversas privadas ou salas com múltiplos amigos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/40">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">Tempo Real & Privacidade</p>
              <p className="text-zinc-400">Apenas os participantes têm permissão para ler cada chat</p>
            </div>
          </div>
        </div>

        {/* Helper instructions for testing with 2 users */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <button
            onClick={() => setShowHowToTest(!showHowToTest)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Como testar com dois usuários?</span>
          </button>

          {showHowToTest && (
            <div className="mt-3 p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-left text-xs text-zinc-300 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="font-semibold text-indigo-300">Dica rápida de teste:</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300">
                <li>Faça login aqui na sua janela principal.</li>
                <li>Copie seu ID de 8 caracteres exibido no perfil.</li>
                <li>Abra uma <strong>janela anônima</strong> ou outro navegador (Edge, Chrome, Safari).</li>
                <li>Entre com outra conta Google e adicione o primeiro usuário informando o ID!</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-zinc-500">
        Papo &bull; Mensagens instantâneas em tempo real
      </div>
    </div>
  );
};
