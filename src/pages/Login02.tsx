import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Wifi, WifiOff, AlertCircle, Moon, Sun } from 'lucide-react';
import { useBackend } from '../providers/BackendProvider';
import { useTheme } from '../providers/ThemeProvider';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Login02Props {
  className?: string;
}

export function Login02({ className }: Login02Props) {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, loading: authLoading } = useBackend();
  const { theme, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Carregar email salvo
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({
        ...prev,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar conexão
    if (!isOnline) {
      setError('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
      return;
    }

    // Validações básicas
    if (!formData.email || !formData.password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Iniciando login...');
      await signIn(formData.email, formData.password);
      
      // Salvar/remover email conforme preferência
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      console.log('✅ Login bem-sucedido, redirecionando...');
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      
      // Mensagens de erro mais amigáveis
      if (error.message?.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos.');
      } else if (error.message?.includes('Network')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.message?.includes('timeout')) {
        setError('O servidor está demorando para responder. Tente novamente.');
      } else {
        setError(error.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Limpar erro ao digitar
    if (error) setError('');
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Por favor, digite seu email primeiro.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Aqui você implementaria a lógica de reset de senha do Supabase
      // await supabase.auth.resetPasswordForEmail(formData.email)
      
      // Por enquanto, simulamos o envio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setResetEmailSent(true);
      setShowForgotPassword(false);
      console.log('📧 Email de reset enviado para:', formData.email);
    } catch (error: any) {
      console.error('❌ Erro ao enviar email de reset:', error);
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Se está verificando autenticação inicial
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background text-foreground">


      {/* Status de Conexão */}
      {!isOnline && (
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse z-50">
          <WifiOff className="w-5 h-5" />
          <span>Sem conexão</span>
        </div>
      )}

      {/* Lado esquerdo - Imagem da Fazenda */}
      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <img
          src="/fazenda-ceac.jpg"
          alt="Fazenda CEAC - Peões Trabalhando no Curral"
          className="h-full w-full object-cover dark:brightness-[0.3] dark:contrast-125"
        />
        {/* Overlay com informações */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent dark:from-black/80 dark:via-black/40" />
        <div className="absolute bottom-0 left-0 p-8 text-white">
          <h2 className="text-3xl font-bold mb-2 drop-shadow-lg">CEAC Agropecuária</h2>
          <p className="text-lg opacity-90 drop-shadow-md">
            Sistema de Gestão Completa para Pecuária de Corte
          </p>
          <p className="text-sm opacity-75 mt-2 drop-shadow-md">
            Controle total do seu rebanho, desde a compra até a venda
          </p>
        </div>
      </div>

      {/* Lado direito - Formulário de Login */}
      <div className="flex items-center justify-center py-12 relative">
        {/* Botão Dark Mode - Canto superior direito do formulário */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-lg bg-background/80 backdrop-blur-sm border border-border hover:bg-accent transition-colors z-10"
          title={theme === 'dark' ? "Alternar para modo claro" : "Alternar para modo escuro"}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-foreground" />
          ) : (
            <Moon className="w-5 h-5 text-foreground" />
          )}
        </button>

        <div className="mx-auto grid w-[350px] gap-6">
          {/* Cabeçalho */}
          <div className="grid gap-2 text-center">
            {/* Logo/Imagem para mobile */}
            <div className="lg:hidden flex justify-center mb-6">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-lg border-4 border-white/20">
                <img
                  src="/fazenda-ceac.jpg"
                  alt="CEAC Agropecuária - Trabalho no Campo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
            <p className="text-balance text-muted-foreground">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className={cn("grid gap-4", className)}>
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Mensagem de sucesso - Reset de senha */}
            {resetEmailSent && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-start space-x-2">
                <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Email enviado com sucesso!</p>
                  <p>Verifique sua caixa de entrada para redefinir sua senha.</p>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="seu@email.com"
                autoComplete="email"
                disabled={isLoading}
                required
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="ml-auto inline-block text-sm text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                  disabled={isLoading || !formData.email}
                  title={!formData.email ? "Digite seu email primeiro" : "Enviar email de recuperação"}
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Lembrar-me */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-colors"
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm font-normal cursor-pointer select-none">
                Lembrar meu email neste dispositivo
              </Label>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !isOnline}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <div>© 2025 CEAC Agropecuária e Mercantil Ltda.</div>
            <div>Todos os direitos reservados.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Login02;
