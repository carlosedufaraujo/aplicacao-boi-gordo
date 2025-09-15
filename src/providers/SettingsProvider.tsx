import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
  // Configurações gerais
  companyName: string;
  companyDocument: string;
  companyEmail: string;
  companyPhone: string;
  
  // Configurações do sistema
  defaultCurrency: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  
  // Configurações de notificação
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  
  // Configurações de backup
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  backupRetention: number;
  
  // Configurações de segurança
  sessionTimeout: number;
  passwordExpiry: number;
  twoFactorAuth: boolean;
  
  // Configurações de interface
  sidebarCollapsed: boolean;
  darkMode: boolean;
  language: string;
  
  // Ações
  updateSettings: (settings: Partial<SettingsContextType>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => void;
}

const defaultSettings: Omit<SettingsContextType, 'updateSettings' | 'resetSettings' | 'exportSettings' | 'importSettings'> = {
  // Configurações gerais
  companyName: 'CEAC Agropecuária e Mercantil Ltda',
  companyDocument: '',
  companyEmail: '',
  companyPhone: '',
  
  // Configurações do sistema
  defaultCurrency: 'BRL',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  timezone: 'America/Sao_Paulo',
  
  // Configurações de notificação
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  
  // Configurações de backup
  autoBackup: true,
  backupFrequency: 'daily',
  backupRetention: 30,
  
  // Configurações de segurança
  sessionTimeout: 60, // minutos
  passwordExpiry: 90, // dias
  twoFactorAuth: false,
  
  // Configurações de interface
  sidebarCollapsed: false,
  darkMode: false,
  language: 'pt-BR'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Omit<SettingsContextType, 'updateSettings' | 'resetSettings' | 'exportSettings' | 'importSettings'>>(defaultSettings);

  // Carregar configurações do localStorage na inicialização
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  // Salvar configurações no localStorage sempre que mudarem
  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<SettingsContextType>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('app-settings');
  };

  const exportSettings = () => {
    return JSON.stringify(settings, null, 2);
  };

  const importSettings = (settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      setSettings(prev => ({ ...prev, ...importedSettings }));
    } catch (error) {
      console.error('Erro ao importar configurações:', error);
      throw new Error('Formato de configurações inválido');
    }
  };

  const value: SettingsContextType = {
    ...settings,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
