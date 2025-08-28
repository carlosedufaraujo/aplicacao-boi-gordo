import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';

// Componentes shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export const ChangePassword: React.FC = () => {
  const { user } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Função para avaliar força da senha
  const evaluatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];

    if (password.length < 8) {
      feedback.push('Deve ter pelo menos 8 caracteres');
    } else {
      score += 20;
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Deve conter pelo menos uma letra minúscula');
    } else {
      score += 20;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Deve conter pelo menos uma letra maiúscula');
    } else {
      score += 20;
    }

    if (!/\d/.test(password)) {
      feedback.push('Deve conter pelo menos um número');
    } else {
      score += 20;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      feedback.push('Deve conter pelo menos um caractere especial');
    } else {
      score += 20;
    }

    let color = 'red';
    if (score >= 80) color = 'green';
    else if (score >= 60) color = 'yellow';
    else if (score >= 40) color = 'orange';

    return { score, feedback, color };
  };

  const passwordStrength = evaluatePasswordStrength(passwords.new);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!passwords.current) {
      setMessage({ type: 'error', text: 'Digite sua senha atual' });
      return;
    }

    if (passwords.new.length < 8) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres' });
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (passwordStrength.score < 60) {
      setMessage({ type: 'error', text: 'A senha não atende aos critérios mínimos de segurança' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Aqui você implementaria a lógica real de mudança de senha
      // Por enquanto, simula o processo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao alterar senha' });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Alterar Senha</h1>
        <p className="page-subtitle">
          Mantenha sua conta segura alterando sua senha regularmente
        </p>
      </div>

      {/* Mensagens */}
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Informações de Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dicas de Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Use uma combinação de letras maiúsculas e minúsculas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Inclua números e caracteres especiais</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Evite informações pessoais óbvias</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Use pelo menos 8 caracteres</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Alteração */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>
            Digite sua senha atual e escolha uma nova senha segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Senha Atual */}
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha Atual</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  placeholder="Digite sua senha atual"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="Digite a nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Indicador de Força da Senha */}
              {passwords.new && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Força da senha:</span>
                    <Progress 
                      value={passwordStrength.score} 
                      className="flex-1 h-2"
                    />
                    <span className={`text-sm font-medium ${
                      passwordStrength.color === 'green' ? 'text-green-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                      passwordStrength.color === 'orange' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {passwordStrength.score >= 80 ? 'Forte' :
                       passwordStrength.score >= 60 ? 'Boa' :
                       passwordStrength.score >= 40 ? 'Fraca' : 'Muito Fraca'}
                    </span>
                  </div>
                  
                  {passwordStrength.feedback.length > 0 && (
                    <div className="space-y-1">
                      {passwordStrength.feedback.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Confirmar Nova Senha */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="Confirme a nova senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Validação de Confirmação */}
              {passwords.confirm && passwords.new !== passwords.confirm && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>As senhas não coincidem</span>
                </div>
              )}
              
              {passwords.confirm && passwords.new === passwords.confirm && passwords.new && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>As senhas coincidem</span>
                </div>
              )}
            </div>

            {/* Botão de Submissão */}
            <Button 
              type="submit" 
              disabled={isLoading || passwordStrength.score < 60 || passwords.new !== passwords.confirm}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Alterando Senha...' : 'Alterar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última alteração:</span>
              <span className="font-medium">Nunca</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Próxima expiração:</span>
              <span className="font-medium">90 dias</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};