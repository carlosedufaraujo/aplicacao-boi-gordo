import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SystemSettings {
  // Configurações de Perfil
  profile: {
    name: string;
    email: string;
    phone: string;
    role: string;
    department: string;
    avatar: string | null;
  };
  
  // Configurações da Organização
  organization: {
    name: string;
    cnpj: string;
    email: string;
    phone: string;
    logo: string | null;
  };
  
  // Configurações de Notificações
  notifications: {
    emailEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    categories: {
      [key: string]: {
        email: boolean;
        push: boolean;
        inApp: boolean;
      };
    };
  };
  
  // Configurações Gerais
  general: {
    language: string;
    timezone: string;
    dateFormat: string;
    currency: string;
    defaultWeightUnit: string;
    defaultPriceUnit: string;
    taxRate: number;
    autoBackup: boolean;
    twoFactorAuth: boolean;
  };
  
  // Ações
  updateProfile: (profile: Partial<SystemSettings['profile']>) => void;
  updateOrganization: (organization: Partial<SystemSettings['organization']>) => void;
  updateNotifications: (notifications: Partial<SystemSettings['notifications']>) => void;
  updateGeneral: (general: Partial<SystemSettings['general']>) => void;
  updateNotificationCategory: (category: string, settings: { email?: boolean; push?: boolean; inApp?: boolean }) => void;
}

export const useSystemSettings = create<SystemSettings>()(
  persist(
    (set) => ({
      profile: {
        name: 'João Silva',
        email: 'joao.silva@ceac.com.br',
        phone: '(11) 98765-4321',
        role: 'Administrador',
        department: 'Gestão',
        avatar: null,
      },
      
      organization: {
        name: 'CEAC Agropecuária e Mercantil Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'contato@ceac.com.br',
        phone: '(65) 3544-1000',
        logo: null,
      },
      
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        categories: {
          purchases: { email: true, push: true, inApp: true },
          financial: { email: true, push: false, inApp: true },
          operations: { email: false, push: true, inApp: true },
          reports: { email: true, push: false, inApp: false },
        },
      },
      
      general: {
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        dateFormat: 'DD/MM/YYYY',
        currency: 'BRL',
        defaultWeightUnit: 'kg',
        defaultPriceUnit: 'arroba',
        taxRate: 24,
        autoBackup: true,
        twoFactorAuth: false,
      },
      
      updateProfile: (profile) =>
        set((state) => ({
          profile: { ...state.profile, ...profile },
        })),
        
      updateOrganization: (organization) =>
        set((state) => ({
          organization: { ...state.organization, ...organization },
        })),
        
      updateNotifications: (notifications) =>
        set((state) => ({
          notifications: { ...state.notifications, ...notifications },
        })),
        
      updateGeneral: (general) =>
        set((state) => ({
          general: { ...state.general, ...general },
        })),
        
      updateNotificationCategory: (category, settings) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            categories: {
              ...state.notifications.categories,
              [category]: {
                ...state.notifications.categories[category],
                ...settings,
              },
            },
          },
        })),
    }),
    {
      name: 'system-settings',
    }
  )
); 
