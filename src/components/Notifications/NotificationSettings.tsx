import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, DollarSign, Package, AlertCircle, Check, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export const NotificationSettings: React.FC = () => {
  const { darkMode } = useAppStore();
  
  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'purchases',
      name: 'Compras',
      description: 'Notificações sobre novas ordens de compra e atualizações',
      icon: <Package className="w-5 h-5" />,
      email: true,
      push: true,
      inApp: true
    },
    {
      id: 'financial',
      name: 'Financeiro',
      description: 'Alertas sobre vencimentos, pagamentos e reconciliações',
      icon: <DollarSign className="w-5 h-5" />,
      email: true,
      push: false,
      inApp: true
    },
    {
      id: 'operations',
      name: 'Operações',
      description: 'Atualizações sobre movimentações, pesagens e saúde animal',
      icon: <AlertCircle className="w-5 h-5" />,
      email: false,
      push: true,
      inApp: true
    },
    {
      id: 'reports',
      name: 'Relatórios',
      description: 'Notificações sobre relatórios prontos e análises',
      icon: <MessageSquare className="w-5 h-5" />,
      email: true,
      push: false,
      inApp: false
    }
  ]);

  const [globalSettings, setGlobalSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  const handleCategoryToggle = (categoryId: string, type: 'email' | 'push' | 'inApp') => {
    setCategories(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, [type]: !cat[type] };
      }
      return cat;
    }));
  };

  const handleGlobalToggle = (type: 'email' | 'push' | 'inApp') => {
    const key = `${type}Enabled` as keyof typeof globalSettings;
    setGlobalSettings(prev => ({ ...prev, [key]: !prev[key] }));
    
    // Aplicar a mudança global a todas as categorias
    if (!globalSettings[key]) {
      setCategories(prev => prev.map(cat => ({ ...cat, [type]: true })));
    } else {
      setCategories(prev => prev.map(cat => ({ ...cat, [type]: false })));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
          Central de Notificações
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Gerencie suas preferências de notificação e configure como deseja receber atualizações do sistema.
        </p>
      </div>

      {/* Configurações Globais */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Configurações Globais
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Notificações por E-mail</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Receba atualizações importantes no seu e-mail
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGlobalToggle('email')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                globalSettings.emailEnabled ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  globalSettings.emailEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Notificações Push</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Receba notificações em tempo real no navegador
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGlobalToggle('push')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                globalSettings.pushEnabled ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  globalSettings.pushEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-white">Notificações no App</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Veja notificações dentro da aplicação
                </p>
              </div>
            </div>
            <button
              onClick={() => handleGlobalToggle('inApp')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                globalSettings.inAppEnabled ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  globalSettings.inAppEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Horário Silencioso */}
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-neutral-900 dark:text-white">Horário Silencioso</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Pausar notificações durante horários específicos
              </p>
            </div>
            <button
              onClick={() => setGlobalSettings(prev => ({ ...prev, quietHoursEnabled: !prev.quietHoursEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                globalSettings.quietHoursEnabled ? 'bg-b3x-lime-500' : 'bg-neutral-300 dark:bg-neutral-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  globalSettings.quietHoursEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {globalSettings.quietHoursEnabled && (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Início
                </label>
                <input
                  type="time"
                  value={globalSettings.quietHoursStart}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Fim
                </label>
                <input
                  type="time"
                  value={globalSettings.quietHoursEnd}
                  onChange={(e) => setGlobalSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categorias de Notificação */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-soft p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Categorias de Notificação
        </h2>
        
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <div className="flex items-start space-x-3 mb-3">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-400">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900 dark:text-white">{category.name}</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{category.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 ml-11">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category.email}
                    onChange={() => handleCategoryToggle(category.id, 'email')}
                    disabled={!globalSettings.emailEnabled}
                    className="w-4 h-4 text-b3x-lime-500 border-neutral-300 rounded focus:ring-b3x-lime-500"
                  />
                  <span className={`text-sm ${!globalSettings.emailEnabled ? 'text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    E-mail
                  </span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category.push}
                    onChange={() => handleCategoryToggle(category.id, 'push')}
                    disabled={!globalSettings.pushEnabled}
                    className="w-4 h-4 text-b3x-lime-500 border-neutral-300 rounded focus:ring-b3x-lime-500"
                  />
                  <span className={`text-sm ${!globalSettings.pushEnabled ? 'text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    Push
                  </span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={category.inApp}
                    onChange={() => handleCategoryToggle(category.id, 'inApp')}
                    disabled={!globalSettings.inAppEnabled}
                    className="w-4 h-4 text-b3x-lime-500 border-neutral-300 rounded focus:ring-b3x-lime-500"
                  />
                  <span className={`text-sm ${!globalSettings.inAppEnabled ? 'text-neutral-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                    No App
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3 mt-6">
        <button className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors">
          Cancelar
        </button>
        <button className="px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors">
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}; 
