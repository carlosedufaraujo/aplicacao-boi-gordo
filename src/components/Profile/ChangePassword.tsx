import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ChangePassword: React.FC = () => {
  const { darkMode } = useAppStore();
  
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

  const [errors, setErrors] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const passwordRequirements = [
    { id: 'length', label: 'Mínimo 8 caracteres', regex: /.{8,}/ },
    { id: 'uppercase', label: 'Uma letra maiúscula', regex: /[A-Z]/ },
    { id: 'lowercase', label: 'Uma letra minúscula', regex: /[a-z]/ },
    { id: 'number', label: 'Um número', regex: /[0-9]/ },
    { id: 'special', label: 'Um caractere especial', regex: /[!@#$%^&*]/ }
  ];

  const checkPasswordStrength = (password: string) => {
    return passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }));
  };

  const handlePasswordChange = (field: keyof typeof passwords, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    
    // Limpar erros ao digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = { current: '', new: '', confirm: '' };
    
    if (!passwords.current) {
      newErrors.current = 'Senha atual é obrigatória';
    }
    
    if (!passwords.new) {
      newErrors.new = 'Nova senha é obrigatória';
    } else {
      const requirements = checkPasswordStrength(passwords.new);
      const unmetRequirements = requirements.filter(req => !req.met);
      if (unmetRequirements.length > 0) {
        newErrors.new = 'A senha não atende aos requisitos de segurança';
      }
    }
    
    if (!passwords.confirm) {
      newErrors.confirm = 'Confirmação de senha é obrigatória';
    } else if (passwords.new !== passwords.confirm) {
      newErrors.confirm = 'As senhas não coincidem';
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Aqui você enviaria a requisição para alterar a senha
      console.log('Alterando senha...');
      // Limpar formulário após sucesso
      setPasswords({ current: '', new: '', confirm: '' });
    }
  };

  const requirements = checkPasswordStrength(passwords.new);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Alterar Senha
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Mantenha sua conta segura atualizando sua senha regularmente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Senha Atual */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
            Verificação de Segurança
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current}
                onChange={(e) => handlePasswordChange('current', e.target.value)}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white ${
                  errors.current ? 'border-error-500' : 'border-neutral-300 dark:border-neutral-600'
                }`}
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.current && (
              <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.current}</p>
            )}
          </div>
        </div>

        {/* Nova Senha */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-6">
            Nova Senha
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => handlePasswordChange('new', e.target.value)}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white ${
                    errors.new ? 'border-error-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="Digite sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.new && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.new}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white ${
                    errors.confirm ? 'border-error-500' : 'border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="Confirme sua nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirm && (
                <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.confirm}</p>
              )}
            </div>

            {/* Requisitos de Senha */}
            {passwords.new && (
              <div className="mt-4 p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Requisitos de Senha:
                </p>
                <div className="space-y-2">
                  {requirements.map((req) => (
                    <div key={req.id} className="flex items-center space-x-2">
                      {req.met ? (
                        <Check className="w-4 h-4 text-success-500" />
                      ) : (
                        <X className="w-4 h-4 text-neutral-400" />
                      )}
                      <span className={`text-sm ${
                        req.met 
                          ? 'text-success-600 dark:text-success-400' 
                          : 'text-neutral-600 dark:text-neutral-400'
                      }`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informações de Segurança */}
        <div className="bg-info-50 dark:bg-info-900/20 border border-info-200 dark:border-info-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-info-600 dark:text-info-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-info-900 dark:text-info-100">Dicas de Segurança</h3>
              <ul className="mt-2 text-sm text-info-700 dark:text-info-300 space-y-1">
                <li>• Não use informações pessoais em sua senha</li>
                <li>• Evite usar a mesma senha em outros sites</li>
                <li>• Altere sua senha regularmente</li>
                <li>• Não compartilhe sua senha com ninguém</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors flex items-center space-x-2"
          >
            <Lock className="w-4 h-4" />
            <span>Alterar Senha</span>
          </button>
        </div>
      </form>
    </div>
  );
}; 