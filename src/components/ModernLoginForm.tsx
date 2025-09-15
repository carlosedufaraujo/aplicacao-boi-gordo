import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import { useSupabase } from '../providers/SupabaseProvider';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModernLoginFormProps {
  className?: string;
}

export function ModernLoginForm({ className }: ModernLoginFormProps) {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, loading: authLoading } = useSupabase();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

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
      await signIn(formData.email, formData.password);
      
      // Salvar/remover email conforme preferência
      if (formData.rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 via-green-50 to-amber-50">
      {/* Status de Conexão */}
      {!isOnline && (
        <div className="fixed top-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <WifiOff className="w-5 h-5" />
          <span>Sem conexão</span>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          {/* Logo/Imagem da Fazenda */}
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden border-4 border-white/20 backdrop-blur-sm">
            <img 
              src="/fazenda-ceac.jpg" 
              alt="Fazenda CEAC - Vista Aérea" 
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => {
                // Fallback caso a imagem não carregue
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling!.style.display = 'flex';
              }}
            />
            {/* Fallback content - será mostrado se a imagem não carregar */}
            <div className="w-full h-full hidden items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">CEAC</span>
            </div>
          </div>
          
          <CardTitle className="text-2xl font-bold">Bem-vindo à CEAC</CardTitle>
          <CardDescription>
            Sistema de Gestão Agropecuária - Entre com suas credenciais
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)}>
            {/* Mensagem de erro */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="grid gap-6">
              {/* Campo de Email */}
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

              {/* Campo de Senha */}
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    className="ml-auto text-sm text-primary hover:underline"
                    disabled={isLoading}
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
                  className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                  disabled={isLoading}
                />
                <Label htmlFor="rememberMe" className="text-sm font-normal">
                  Lembrar-me
                </Label>
              </div>

              {/* Botão de Login */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !isOnline}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </>
                )}
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              © 2025 CEAC Agropecuária e Mercantil Ltda. Todos os direitos reservados.
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
