import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Users, Shield, Hash, HelpCircle, AlertCircle, Eye, EyeOff, ArrowLeft, Mail, Lock, User } from 'lucide-react';

type AuthView = 'login' | 'register' | 'forgot';

export const LoginScreen: React.FC = () => {
  const { loginWithEmail, registerWithEmail, resetPassword, error, clearError } = useAuth();
  
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHowToTest, setShowHowToTest] = useState(false);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      return;
    }

    try {
      setLoading(true);
      if (view === 'login') {
        await loginWithEmail(trimmedEmail, password);
      } else if (view === 'register') {
        if (!displayName.trim()) {
          throw new Error('Por favor, informe seu nome de exibição.');
        }
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres.');
        }
        await registerWithEmail(displayName.trim(), trimmedEmail, password);
      } else if (view === 'forgot') {
        await resetPassword(trimmedEmail);
        setSuccessMessage('Instruções de recuperação enviadas para o seu e-mail!');
      }
    } catch (err: any) {
      // Handled in context or caught here
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
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Papo
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {view === 'login' && 'Entre com sua conta para conversar com amigos'}
            {view === 'register' && 'Crie sua conta gratuita em segundos'}
            {view === 'forgot' && 'Recupere o acesso à sua conta'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300 text-xs sm:text-sm">
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

        {/* Success notification */}
        {successMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm">
            {successMessage}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAction} className="space-y-4">
          {view === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nome de exibição
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome ou apelido"
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {view !== 'forgot' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {view === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Confirmar senha
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          )}

          {view === 'login' && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => { setView('forgot'); clearError(); }}
                className="text-xs text-indigo-400 hover:underline cursor-pointer"
              >
                Esqueceu sua senha?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              <>
                {view === 'login' && 'Entrar'}
                {view === 'register' && 'Criar Conta'}
                {view === 'forgot' && 'Enviar Instruções'}
              </>
            )}
          </button>
        </form>

        {/* View Switchers */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          {view === 'login' && (
            <p>
              Não tem uma conta?{' '}
              <button
                onClick={() => { setView('register'); clearError(); }}
                className="text-indigo-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Cadastre-se
              </button>
            </p>
          )}

          {view === 'register' && (
            <p>
              Já tem uma conta?{' '}
              <button
                onClick={() => { setView('login'); clearError(); }}
                className="text-indigo-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                Faça login
              </button>
            </p>
          )}

          {view === 'forgot' && (
            <button
              onClick={() => { setView('login'); clearError(); }}
              className="inline-flex items-center gap-1.5 text-indigo-400 font-semibold hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao login</span>
            </button>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="space-y-3 pt-5 mt-5 border-t border-zinc-800 text-xs text-zinc-300">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/40">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">ID de Amigo (8 caracteres)</p>
              <p className="text-[11px] text-zinc-400">Seu código exclusivo para ser encontrado</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/40">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200">Conversas & Chamadas de Voz</p>
              <p className="text-[11px] text-zinc-400">Chats diretos, em grupo e ligações P2P</p>
            </div>
          </div>
        </div>

        {/* Helper instructions for testing with 2 users */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 text-center">
          <button
            onClick={() => setShowHowToTest(!showHowToTest)}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Como testar com dois usuários?</span>
          </button>

          {showHowToTest && (
            <div className="mt-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-left text-xs text-zinc-300 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="font-semibold text-indigo-300">Dica rápida de teste:</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-[11px]">
                <li>Crie uma conta aqui na sua janela principal.</li>
                <li>Copie seu ID de 8 caracteres exibido no perfil.</li>
                <li>Abra uma <strong>janela anônima</strong> ou outro navegador.</li>
                <li>Cadastre outra conta e adicione o primeiro usuário informando o ID!</li>
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
