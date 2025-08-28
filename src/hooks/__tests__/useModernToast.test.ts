import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useModernToast } from '../useModernToast';
import * as sonner from 'sonner';

// Mock da biblioteca sonner
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(() => 'toast-id'), {
    success: vi.fn(() => 'success-id'),
    error: vi.fn(() => 'error-id'),
    warning: vi.fn(() => 'warning-id'),
    info: vi.fn(() => 'info-id'),
    loading: vi.fn(() => 'loading-id'),
    promise: vi.fn(),
    dismiss: vi.fn()
  })
}));

describe('useModernToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve chamar toast básico com as opções corretas', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.toast({
      title: 'Teste',
      description: 'Descrição teste',
      duration: 5000
    });
    
    expect(sonner.toast).toHaveBeenCalledWith('Teste', {
      description: 'Descrição teste',
      duration: 5000,
      action: undefined
    });
  });

  it('deve chamar toast.success com título e descrição', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.success('Sucesso!', 'Operação realizada com sucesso');
    
    expect(sonner.toast.success).toHaveBeenCalledWith('Sucesso!', {
      description: 'Operação realizada com sucesso',
      icon: expect.any(Object)
    });
  });

  it('deve chamar toast.error', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.error('Erro!', 'Algo deu errado');
    
    expect(sonner.toast.error).toHaveBeenCalledWith('Erro!', {
      description: 'Algo deu errado',
      icon: expect.any(Object)
    });
  });

  it('deve chamar toast.warning', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.warning('Atenção!', 'Cuidado com esta ação');
    
    expect(sonner.toast.warning).toHaveBeenCalledWith('Atenção!', {
      description: 'Cuidado com esta ação',
      icon: expect.any(Object)
    });
  });

  it('deve chamar toast.info', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.info('Informação', 'Dados atualizados');
    
    expect(sonner.toast.info).toHaveBeenCalledWith('Informação', {
      description: 'Dados atualizados',
      icon: expect.any(Object)
    });
  });

  it('deve chamar toast.loading e retornar id', () => {
    const { result } = renderHook(() => useModernToast());
    
    const id = result.current.loading('Carregando...', 'Por favor aguarde');
    
    expect(sonner.toast.loading).toHaveBeenCalledWith('Carregando...', {
      description: 'Por favor aguarde'
    });
    expect(id).toBe('loading-id');
  });

  it('deve chamar toast.promise com mensagens corretas', async () => {
    const { result } = renderHook(() => useModernToast());
    
    const promise = Promise.resolve('resultado');
    const messages = {
      loading: 'Processando...',
      success: 'Concluído!',
      error: 'Falhou!'
    };
    
    result.current.promise(promise, messages);
    
    expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
  });

  it('deve chamar toast.dismiss sem id', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.dismiss();
    
    expect(sonner.toast.dismiss).toHaveBeenCalledWith(undefined);
  });

  it('deve chamar toast.dismiss com id específico', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.dismiss('toast-123');
    
    expect(sonner.toast.dismiss).toHaveBeenCalledWith('toast-123');
  });

  it('deve incluir action quando fornecido', () => {
    const { result } = renderHook(() => useModernToast());
    const action = {
      label: 'Desfazer',
      onClick: vi.fn()
    };
    
    result.current.toast({
      title: 'Item deletado',
      action
    });
    
    expect(sonner.toast).toHaveBeenCalledWith('Item deletado', {
      description: undefined,
      duration: 4000,
      action
    });
  });

  it('deve usar duração padrão quando não especificada', () => {
    const { result } = renderHook(() => useModernToast());
    
    result.current.toast({
      title: 'Notificação'
    });
    
    expect(sonner.toast).toHaveBeenCalledWith('Notificação', {
      description: undefined,
      duration: 4000,
      action: undefined
    });
  });

  it('deve permitir promise com função para mensagem de sucesso', () => {
    const { result } = renderHook(() => useModernToast());
    
    const promise = Promise.resolve({ data: 'teste' });
    const messages = {
      loading: 'Carregando...',
      success: (data: any) => `Sucesso: ${data.data}`,
      error: 'Erro'
    };
    
    result.current.promise(promise, messages);
    
    expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
  });

  it('deve permitir promise com função para mensagem de erro', () => {
    const { result } = renderHook(() => useModernToast());
    
    const promise = Promise.reject(new Error('Falha'));
    const messages = {
      loading: 'Carregando...',
      success: 'Sucesso',
      error: (error: Error) => `Erro: ${error.message}`
    };
    
    result.current.promise(promise, messages);
    
    expect(sonner.toast.promise).toHaveBeenCalledWith(promise, messages);
  });
});