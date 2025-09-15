import React from 'react';
import { toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useModernToast = () => {
  return {
    toast: (options: ToastOptions) => {
      sonnerToast(options.title || '', {
        description: options.description,
        duration: options.duration || 4000,
        action: options.action
      });
    },
    
    success: (title: string, description?: string) => {
      sonnerToast.success(title, {
        description,
        icon: <CheckCircle className="h-5 w-5" />
      });
    },
    
    error: (title: string, description?: string) => {
      sonnerToast.error(title, {
        description,
        icon: <XCircle className="h-5 w-5" />
      });
    },
    
    warning: (title: string, description?: string) => {
      sonnerToast.warning(title, {
        description,
        icon: <AlertCircle className="h-5 w-5" />
      });
    },
    
    info: (title: string, description?: string) => {
      sonnerToast.info(title, {
        description,
        icon: <Info className="h-5 w-5" />
      });
    },
    
    loading: (title: string, description?: string) => {
      return sonnerToast.loading(title, {
        description
      });
    },
    
    promise: <T,>(
      promise: Promise<T>,
      messages: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ) => {
      return sonnerToast.promise(promise, messages);
    },
    
    dismiss: (toastId?: string | number) => {
      sonnerToast.dismiss(toastId);
    }
  };
};
