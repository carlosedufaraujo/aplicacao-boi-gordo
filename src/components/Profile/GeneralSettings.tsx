import React, { useState } from 'react';
import { Settings, Globe, Clock, DollarSign, FileText, Database, Shield, Save } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const GeneralSettings: React.FC = () => {
  const { darkMode } = useAppStore();
  
  const [settings, setSettings] = useState({
    // Configurações Regionais
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    currency: 'BRL',
    
    // Configurações de Negócio
    defaultWeightUnit: 'kg',
    defaultPriceUnit: 'arroba',
    taxRate: 24,
    defaultPaymentTerm: 30,
    
    // Configurações de Sistema
    autoBackup: true,
    backupFrequency: 'daily',
    dataRetention: 365,
    sessionTimeout: 30,
    
    // Configurações de Segurança
    twoFactorAuth: false,
    passwordExpiration: 90,
    minPasswordLength: 8,
    requireStrongPassword: true
  });

  const handleSettingChange = (setting: string, value: any) => {
    setSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handleSave = () => {
    // Salvar configurações no backend
    // Mostrar notificação de sucesso
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Configurações Gerais
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Configure as preferências gerais do sistema
        </p>
      </div>

      {/* Configurações Regionais */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-info-100 dark:bg-info-900/20 rounded-lg">
            <Globe className="w-5 h-5 text-info-600 dark:text-info-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Configurações Regionais
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Idioma
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Fuso Horário
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Cuiaba">Cuiabá (GMT-4)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Formato de Data
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="DD/MM/YYYY">DD/MM/AAAA</option>
              <option value="MM/DD/YYYY">MM/DD/AAAA</option>
              <option value="YYYY-MM-DD">AAAA-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Moeda
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="BRL">Real (R$)</option>
              <option value="USD">Dólar (US$)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurações de Negócio */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Configurações de Negócio
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Unidade de Peso Padrão
            </label>
            <select
              value={settings.defaultWeightUnit}
              onChange={(e) => handleSettingChange('defaultWeightUnit', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="kg">Quilogramas (kg)</option>
              <option value="arroba">Arrobas (@)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Unidade de Preço Padrão
            </label>
            <select
              value={settings.defaultPriceUnit}
              onChange={(e) => handleSettingChange('defaultPriceUnit', e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            >
              <option value="arroba">Por Arroba</option>
              <option value="kg">Por Quilograma</option>
              <option value="head">Por Cabeça</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Taxa de Impostos (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => handleSettingChange('taxRate', parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Prazo de Pagamento Padrão (dias)
            </label>
            <input
              type="number"
              value={settings.defaultPaymentTerm}
              onChange={(e) => handleSettingChange('defaultPaymentTerm', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Configurações de Sistema */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-success-100 dark:bg-success-900/20 rounded-lg">
            <Database className="w-5 h-5 text-success-600 dark:text-success-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Configurações de Sistema
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Backup Automático</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Realizar backup automático dos dados
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('autoBackup', !settings.autoBackup)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoBackup ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.autoBackup && (
            <div className="ml-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Frequência de Backup
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Retenção de Dados (dias)
              </label>
              <input
                type="number"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Timeout de Sessão (minutos)
              </label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Configurações de Segurança */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-error-100 dark:bg-error-900/20 rounded-lg">
            <Shield className="w-5 h-5 text-error-600 dark:text-error-400" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Configurações de Segurança
          </h2>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Autenticação de Dois Fatores</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Adicionar camada extra de segurança
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('twoFactorAuth', !settings.twoFactorAuth)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.twoFactorAuth ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Expiração de Senha (dias)
              </label>
              <input
                type="number"
                value={settings.passwordExpiration}
                onChange={(e) => handleSettingChange('passwordExpiration', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Comprimento Mínimo da Senha
              </label>
              <input
                type="number"
                value={settings.minPasswordLength}
                onChange={(e) => handleSettingChange('minPasswordLength', parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Exigir Senha Forte</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Letras maiúsculas, minúsculas, números e caracteres especiais
              </p>
            </div>
            <button
              onClick={() => handleSettingChange('requireStrongPassword', !settings.requireStrongPassword)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.requireStrongPassword ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.requireStrongPassword ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Configurações</span>
        </button>
      </div>
    </div>
  );
}; 
