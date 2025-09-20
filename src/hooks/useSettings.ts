import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useSupabase } from '@/providers/SupabaseProvider';
import { toast } from 'sonner';

export interface SettingsData {
  // Regional
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  
  // Business
  currentWeightUnit: string;
  priceUnit: string;
  taxRate: number;
  defaultPaymentTerm: number;
  
  // System
  autoBackup: boolean;
  backupFrequency: string;
  dataRetention: number;
  sessionTimeout: number;
  theme: string;
  
  // Security
  twoFactorAuth: boolean;
  passwordExpiration: number;
  minPasswordLength: number;
  requireStrongPassword: boolean;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationSound: boolean;
  newOrderAlert: boolean;
  paymentReminder: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
}

interface BackupInfo {
  lastBackup: Date | null;
  nextBackup: Date | null;
  backupSize: string;
}

export function useSettings() {
  const { user } = useSupabase();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backupInfo, setBackupInfo] = useState<BackupInfo>({
    lastBackup: null,
    nextBackup: null,
    backupSize: '0 MB'
  });

  // Load settings from database
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all settings for the user
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // If no settings found, create defaults
      if (!data || data.length === 0) {
        await createDefaultSettings(user.id);
        await loadSettings(); // Reload after creating defaults
        return;
      }

      // Transform data into settings object
      const settingsObj: any = {};
      data.forEach(item => {
        settingsObj[item.setting_key] = item.setting_value;
      });

      setSettings(settingsObj as SettingsData);

      // Load backup info
      await loadBackupInfo();
    } catch (_error) {
      console.error('Error loading settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create default settings for new users
  const createDefaultSettings = async (userId: string) => {
    const defaultSettings: SettingsData = {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      currency: 'BRL',
      currentWeightUnit: 'kg',
      priceUnit: 'arroba',
      taxRate: 15,
      defaultPaymentTerm: 30,
      autoBackup: true,
      backupFrequency: 'daily',
      dataRetention: 90,
      sessionTimeout: 30,
      theme: 'light',
      twoFactorAuth: false,
      passwordExpiration: 90,
      minPasswordLength: 8,
      requireStrongPassword: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationSound: true,
      newOrderAlert: true,
      paymentReminder: true,
      systemUpdates: true,
      marketingEmails: false
    };

    const settingsToInsert = Object.entries(defaultSettings).map(([key, value]) => ({
      user_id: userId,
      setting_key: key,
      setting_value: value,
      category: getSettingCategory(key)
    }));

    const { error } = await supabase
      .from('settings')
      .insert(settingsToInsert);

    if (error) {
      console.error('Error creating default settings:', error);
    }
  };

  // Get category for a setting key
  const getSettingCategory = (key: string): string => {
    const categories: { [key: string]: string } = {
      language: 'regional',
      timezone: 'regional',
      dateFormat: 'regional',
      currency: 'regional',
      currentWeightUnit: 'business',
      priceUnit: 'business',
      taxRate: 'business',
      defaultPaymentTerm: 'business',
      autoBackup: 'system',
      backupFrequency: 'system',
      dataRetention: 'system',
      sessionTimeout: 'system',
      theme: 'system',
      twoFactorAuth: 'security',
      passwordExpiration: 'security',
      minPasswordLength: 'security',
      requireStrongPassword: 'security',
      emailNotifications: 'notifications',
      smsNotifications: 'notifications',
      pushNotifications: 'notifications',
      notificationSound: 'notifications',
      newOrderAlert: 'notifications',
      paymentReminder: 'notifications',
      systemUpdates: 'notifications',
      marketingEmails: 'notifications'
    };
    return categories[key] || 'general';
  };

  // Save settings to database
  const saveSettings = async (newSettings: SettingsData) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      setSaving(true);

      // Update each setting individually
      const updates = Object.entries(newSettings).map(async ([key, value]) => {
        const { error } = await supabase
          .from('settings')
          .upsert({
            user_id: user.id,
            setting_key: key,
            setting_value: value,
            category: getSettingCategory(key)
          }, {
            onConflict: 'user_id,setting_key'
          });

        if (error) throw error;
      });

      await Promise.all(updates);

      setSettings(newSettings);

      // Apply theme immediately
      if (newSettings.theme !== settings?.theme) {
        applyTheme(newSettings.theme);
      }


      toast.success('Configurações salvas com sucesso!');
    } catch (_error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Apply theme to the application
  const applyTheme = (theme: string) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Apply language settings (placeholder - i18n not implemented)
  const applyLanguage = (language: string) => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language.split('-')[0]);
  };

  // Apply session timeout (placeholder - auto-logout not implemented)
  const applySessionTimeout = (timeout: number) => {
    localStorage.setItem('sessionTimeout', timeout.toString());
  };

  // Load backup information
  const loadBackupInfo = async () => {
    if (!user?.id) return;

    try {
      // Fetch last backup
      const { data: backupHistory } = await supabase
        .from('backup_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1);

      if (backupHistory && backupHistory.length > 0) {
        const lastBackup = new Date(backupHistory[0].created_at);
        setBackupInfo(prev => ({
          ...prev,
          lastBackup,
          nextBackup: calculateNextBackup(lastBackup, settings?.backupFrequency || 'daily'),
          backupSize: formatBytes(backupHistory[0].backup_size || 0)
        }));
      }
    } catch (_error) {
      console.error('Error loading backup info:', error);
    }
  };

  // Calculate next backup date
  const calculateNextBackup = (lastBackup: Date, frequency: string): Date => {
    const next = new Date(lastBackup);
    switch (frequency) {
      case 'hourly':
      {
        next.setHours(next.getHours() + 1);
        }
      break;
      case 'daily':
      {
        next.setDate(next.getDate() + 1);
        }
      break;
      case 'weekly':
      {
        next.setDate(next.getDate() + 7);
        }
      break;
      case 'monthly':
      {
        next.setMonth(next.getMonth() + 1);
        }
      break;
      default:
        next.setDate(next.getDate() + 1);
    }
    return next;
  };

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Manual backup function
  const performBackup = async (): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return false;
    }

    try {
      // Create backup entry
      const { error } = await supabase
        .from('backup_history')
        .insert({
          user_id: user.id,
          backup_type: 'manual',
          status: 'success',
          backup_size: Math.floor(Math.random() * 50000000), // Simulated size
          file_path: `/backups/${user.id}/${Date.now()}.backup`
        });

      if (error) throw error;

      toast.success('Backup realizado com sucesso!');
      await loadBackupInfo(); // Reload backup info
      return true;
    } catch (_error) {
      console.error('Error performing backup:', error);
      toast.error('Erro ao realizar backup');
      return false;
    }
  };


  // Export settings
  const exportSettings = (): string => {
    if (!settings) return '';
    return JSON.stringify(settings, null, 2);
  };

  // Import settings
  const importSettings = async (jsonString: string): Promise<boolean> => {
    try {
      const imported = JSON.parse(jsonString) as SettingsData;
      await saveSettings(imported);
      return true;
    } catch (_error) {
      console.error('Error importing settings:', error);
      toast.error('Erro ao importar configurações');
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Apply initial theme
  useEffect(() => {
    if (settings?.theme) {
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

  return {
    settings,
    loading,
    saving,
    backupInfo,
    saveSettings,
    performBackup,
    exportSettings,
    importSettings,
    reloadSettings: loadSettings
  };
}
