import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { ModernConfirmDialog, useConfirmDialog, DeleteConfirmDialog } from '../ModernConfirmDialog';

describe('ModernConfirmDialog', () => {
  it('deve renderizar o dialog quando aberto', () => {
    const onConfirm = vi.fn();
    
    render(
      <ModernConfirmDialog
        open={true}
        title="Confirmar Ação"
        description="Tem certeza que deseja continuar?"
        onConfirm={onConfirm}
      />
    );
    
    expect(screen.getByText('Confirmar Ação')).toBeInTheDocument();
    expect(screen.getByText('Tem certeza que deseja continuar?')).toBeInTheDocument();
  });

  it('deve chamar onConfirm ao clicar em confirmar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    
    render(
      <ModernConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirmar"
        onConfirm={onConfirm}
      />
    );
    
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);
    
    expect(onConfirm).toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('deve chamar onCancel ao clicar em cancelar', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    
    render(
      <ModernConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirmar"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);
    
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('deve exibir ícone correto baseado na variante', () => {
    const { rerender } = render(
      <ModernConfirmDialog
        open={true}
        title="Erro"
        variant="destructive"
        onConfirm={vi.fn()}
      />
    );
    
    // Verifica se tem algum ícone de erro
    expect(screen.getByText('Erro')).toBeInTheDocument();
    
    // Testa outra variante
    rerender(
      <ModernConfirmDialog
        open={true}
        title="Sucesso"
        variant="success"
        onConfirm={vi.fn()}
      />
    );
    
    expect(screen.getByText('Sucesso')).toBeInTheDocument();
  });

  it('deve usar textos customizados para os botões', () => {
    render(
      <ModernConfirmDialog
        open={true}
        title="Confirmar"
        confirmText="Sim, deletar"
        cancelText="Não, manter"
        onConfirm={vi.fn()}
      />
    );
    
    expect(screen.getByRole('button', { name: /sim, deletar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /não, manter/i })).toBeInTheDocument();
  });

  it('deve lidar com operações assíncronas', async () => {
    const user = userEvent.setup();
    const asyncOperation = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(
      <ModernConfirmDialog
        open={true}
        title="Operação Assíncrona"
        onConfirm={asyncOperation}
        isAsync={true}
      />
    );
    
    const confirmButton = screen.getByRole('button', { name: /confirmar/i });
    await user.click(confirmButton);
    
    // Deve mostrar estado de loading
    expect(screen.getByText(/processando/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(asyncOperation).toHaveBeenCalled();
    });
  });

  it('deve renderizar com trigger personalizado', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    
    render(
      <ModernConfirmDialog
        title="Confirmar"
        onConfirm={onConfirm}
        trigger={<button>Abrir Dialog</button>}
      />
    );
    
    // Dialog não deve estar visível inicialmente
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
    
    // Clica no trigger
    const triggerButton = screen.getByText('Abrir Dialog');
    await user.click(triggerButton);
    
    // Dialog deve aparecer
    await waitFor(() => {
      expect(screen.getByText('Confirmar')).toBeInTheDocument();
    });
  });
});

describe('DeleteConfirmDialog', () => {
  it('deve renderizar dialog de exclusão com mensagem apropriada', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    
    render(
      <DeleteConfirmDialog
        itemName="Lote #123"
        onDelete={onDelete}
      />
    );
    
    // Clica no botão de excluir
    const deleteButton = screen.getByRole('button', { name: /excluir/i });
    await user.click(deleteButton);
    
    // Verifica se a mensagem contém o nome do item
    await waitFor(() => {
      expect(screen.getByText(/tem certeza que deseja excluir "lote #123"/i)).toBeInTheDocument();
    });
  });

  it('deve chamar onDelete ao confirmar exclusão', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    
    render(
      <DeleteConfirmDialog
        itemName="Item Teste"
        onDelete={onDelete}
      />
    );
    
    // Abre o dialog
    const deleteButton = screen.getByRole('button', { name: /excluir/i });
    await user.click(deleteButton);
    
    // Confirma exclusão
    await waitFor(async () => {
      const confirmButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.toLowerCase().includes('excluir') && 
        btn !== deleteButton
      );
      if (confirmButton) {
        await user.click(confirmButton);
      }
    });
    
    expect(onDelete).toHaveBeenCalled();
  });
});

describe('useConfirmDialog Hook', () => {
  it('deve retornar true quando confirmado', async () => {
    const user = userEvent.setup();
    let result: boolean | null = null;
    
    const TestComponent = () => {
      const { confirm, DialogComponent } = useConfirmDialog();
      
      const handleClick = async () => {
        result = await confirm({
          title: 'Confirmar Teste',
          description: 'Descrição do teste'
        });
      };
      
      return (
        <>
          <button onClick={handleClick}>Testar</button>
          <DialogComponent />
        </>
      );
    };
    
    render(<TestComponent />);
    
    // Clica no botão de teste
    const testButton = screen.getByText('Testar');
    await user.click(testButton);
    
    // Confirma no dialog
    await waitFor(async () => {
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);
    });
    
    await waitFor(() => {
      expect(result).toBe(true);
    });
  });

  it('deve retornar false quando cancelado', async () => {
    const user = userEvent.setup();
    let result: boolean | null = null;
    
    const TestComponent = () => {
      const { confirm, DialogComponent } = useConfirmDialog();
      
      const handleClick = async () => {
        result = await confirm({
          title: 'Confirmar Teste',
          variant: 'warning'
        });
      };
      
      return (
        <>
          <button onClick={handleClick}>Testar</button>
          <DialogComponent />
        </>
      );
    };
    
    render(<TestComponent />);
    
    // Clica no botão de teste
    const testButton = screen.getByText('Testar');
    await user.click(testButton);
    
    // Cancela no dialog
    await waitFor(async () => {
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);
    });
    
    await waitFor(() => {
      expect(result).toBe(false);
    });
  });
});
