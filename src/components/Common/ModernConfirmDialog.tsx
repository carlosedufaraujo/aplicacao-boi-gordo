import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, AlertTriangle, XCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernConfirmDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'destructive' | 'warning' | 'info' | 'success';
  trigger?: React.ReactNode;
  confirmButtonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  showIcon?: boolean;
  isAsync?: boolean;
  loading?: boolean;
}

export const ModernConfirmDialog: React.FC<ModernConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  variant = 'default',
  trigger,
  confirmButtonVariant,
  showIcon = true,
  isAsync = false,
  loading = false
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleConfirm = async () => {
    if (isAsync) {
      setIsLoading(true);
      try {
        await onConfirm();
      } finally {
        setIsLoading(false);
        onOpenChange?.(false);
      }
    } else {
      onConfirm();
      onOpenChange?.(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange?.(false);
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getButtonVariant = () => {
    if (confirmButtonVariant) return confirmButtonVariant;
    return variant === 'destructive' ? 'destructive' : 'default';
  };

  const dialogContent = (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle className="flex items-center gap-2">
          {showIcon && getIcon()}
          {title}
        </AlertDialogTitle>
        {description && (
          <AlertDialogDescription>{description}</AlertDialogDescription>
        )}
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={handleCancel} disabled={isLoading || loading}>
          {cancelText}
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={handleConfirm}
          disabled={isLoading || loading}
          className={cn(
            getButtonVariant() === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
          )}
        >
          {isLoading || loading ? 'Processando...' : confirmText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );

  if (trigger) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
        <AlertDialogContent>{dialogContent}</AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>{dialogContent}</AlertDialogContent>
    </AlertDialog>
  );
};

// Hook para usar o dialog imperatively
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = React.useState<{
    open: boolean;
    title: string;
    description?: string;
    variant?: ModernConfirmDialogProps['variant'];
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    open: false,
    title: '',
  });

  const confirm = (options: {
    title: string;
    description?: string;
    variant?: ModernConfirmDialogProps['variant'];
    confirmText?: string;
    cancelText?: string;
  }): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title,
        description: options.description,
        variant: options.variant,
        onConfirm: () => {
          resolve(true);
          setDialogState(prev => ({ ...prev, open: false }));
        },
        onCancel: () => {
          resolve(false);
          setDialogState(prev => ({ ...prev, open: false }));
        },
      });
    });
  };

  const DialogComponent = () => (
    <ModernConfirmDialog
      open={dialogState.open}
      onOpenChange={(open) => {
        if (!open && dialogState.onCancel) {
          dialogState.onCancel();
        }
        setDialogState(prev => ({ ...prev, open }));
      }}
      title={dialogState.title}
      description={dialogState.description}
      variant={dialogState.variant}
      onConfirm={dialogState.onConfirm || (() => {})}
      onCancel={dialogState.onCancel}
    />
  );

  return { confirm, DialogComponent };
};

// Componente de exemplo de uso
export const DeleteConfirmDialog: React.FC<{
  itemName: string;
  onDelete: () => void;
  trigger?: React.ReactNode;
}> = ({ itemName, onDelete, trigger }) => {
  return (
    <ModernConfirmDialog
      title="Confirmar Exclusão"
      description={`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`}
      confirmText="Excluir"
      variant="destructive"
      onConfirm={onDelete}
      trigger={
        trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-1" />
            Excluir
          </Button>
        )
      }
    />
  );
};
