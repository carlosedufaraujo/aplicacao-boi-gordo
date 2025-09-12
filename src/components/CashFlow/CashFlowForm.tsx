import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { validateCashFlow, hasValidationErrors, formatValidationMessage } from '@/utils/cashflow-validations';
import { useToast } from '@/components/ui/use-toast';

interface CashFlowFormProps {
  cashFlow?: any;
  categories: any[];
  accounts: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const CashFlowForm: React.FC<CashFlowFormProps> = ({
  cashFlow,
  categories,
  accounts,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<any>({});
  
  // Debug: log dos dados recebidos
  console.log('🔧 [CashFlowForm] Categories:', categories);
  console.log('🔧 [CashFlowForm] Accounts:', accounts);
  
  // Funções para formatação de moeda
  const formatCurrency = (value: string | number): string => {
    if (!value) return '';
    const numericValue = typeof value === 'string' ? parseFloat(value.toString().replace(/[^\d.-]/g, '')) : value;
    if (isNaN(numericValue)) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(numericValue);
  };

  const formatCurrencyInput = (value: string): string => {
    // Remove tudo exceto números
    const numbersOnly = value.replace(/[^\d]/g, '');
    
    if (!numbersOnly) return '';
    
    // Converte para centavos (últimos 2 dígitos são decimais)
    const numericValue = parseInt(numbersOnly) / 100;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(numericValue);
  };

  const parseCurrencyToNumber = (value: string): number => {
    if (!value) return 0;
    // Remove tudo exceto números
    const numbersOnly = value.replace(/[^\d]/g, '');
    if (!numbersOnly) return 0;
    // Converte de centavos para reais
    return parseInt(numbersOnly) / 100;
  };
  
  const [formData, setFormData] = useState({
    type: cashFlow?.type || 'EXPENSE',
    categoryId: cashFlow?.categoryId || '',
    accountId: cashFlow?.accountId || '',
    description: cashFlow?.description || '',
    amount: cashFlow?.amount || 0,
    displayAmount: cashFlow?.amount ? formatCurrency(cashFlow.amount) : '', // Valor formatado para exibição
    date: cashFlow?.date ? new Date(cashFlow.date) : new Date(),
    dueDate: cashFlow?.dueDate ? new Date(cashFlow.dueDate) : null,
    status: cashFlow?.status || 'PENDING',
    paymentMethod: cashFlow?.paymentMethod || '',
    reference: cashFlow?.reference || '',
    supplier: cashFlow?.supplier || '',
    notes: cashFlow?.notes || '',
  });

  const filteredCategories = categories?.filter(cat => cat.type === formData.type) || [];
  
  // Debug: log das categorias filtradas
  console.log('🔧 [CashFlowForm] FormData.type:', formData.type);
  console.log('🔧 [CashFlowForm] Filtered categories:', filteredCategories);

  // Função para lidar com mudança no valor
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formattedValue = formatCurrencyInput(inputValue);
    const numericValue = parseCurrencyToNumber(inputValue);
    
    setFormData({
      ...formData,
      amount: numericValue,
      displayAmount: formattedValue
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar dados antes de enviar
    const validationErrors = validateCashFlow(formData);
    
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      const message = formatValidationMessage(validationErrors);
      toast({
        title: 'Erros de validação',
        description: message,
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }
    
    // Limpar erros e preparar dados
    setErrors({});
    const dataToSubmit = {
      type: formData.type,
      categoryId: formData.categoryId,
      accountId: formData.accountId,
      description: formData.description,
      amount: formData.amount,
      date: formData.date.toISOString(),
      dueDate: formData.dueDate?.toISOString(),
      status: formData.status,
      paymentMethod: formData.paymentMethod,
      reference: formData.reference,
      supplier: formData.supplier,
      notes: formData.notes,
    };
    
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {cashFlow ? 'Editar Movimentação' : 'Nova Movimentação'}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da movimentação financeira
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value, categoryId: '' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Receita</SelectItem>
                  <SelectItem value="EXPENSE">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoryId" className={errors.categoryId ? 'text-destructive' : ''}>Categoria</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className={errors.categoryId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          {category.color && (
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: category.color }}
                            />
                          )}
                          {category.name}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma categoria disponível para {formData.type === 'INCOME' ? 'receitas' : 'despesas'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId" className={errors.accountId ? 'text-destructive' : ''}>Conta</Label>
              <Select
                value={formData.accountId}
                onValueChange={(value) => setFormData({ ...formData, accountId: value })}
              >
                <SelectTrigger className={errors.accountId ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts && accounts.length > 0 ? (
                    accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName || account.name} - {account.bankName}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhuma conta disponível
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={errors.description ? 'text-destructive' : ''}>Descrição</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={errors.description ? 'border-destructive' : ''}
              placeholder="Digite uma descrição clara"
              required
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className={errors.amount ? 'text-destructive' : ''}>Valor</Label>
              <Input
                id="amount"
                type="text"
                value={formData.displayAmount}
                onChange={handleAmountChange}
                className={errors.amount ? 'border-destructive' : ''}
                placeholder="R$ 0,00"
                required
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Modalidade de Pagamento</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    paymentMethod: value,
                    dueDate: value === 'A_VISTA' ? null : formData.dueDate
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A_VISTA">À Vista</SelectItem>
                  <SelectItem value="A_PRAZO">A Prazo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.date && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, 'dd/MM/yyyy', { locale: ptBR })
                    ) : (
                      'Selecione a data'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => setFormData({ ...formData, date: date || new Date() })}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className={errors.dueDate ? 'text-destructive' : ''}>
                Data de Vencimento
                {formData.paymentMethod === 'A_PRAZO' && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={formData.paymentMethod === 'A_VISTA'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.dueDate && 'text-muted-foreground',
                      formData.paymentMethod === 'A_VISTA' && 'opacity-50 cursor-not-allowed',
                      errors.dueDate && 'border-destructive'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(formData.dueDate, 'dd/MM/yyyy', { locale: ptBR })
                    ) : formData.paymentMethod === 'A_VISTA' ? (
                      'Não aplicável (À Vista)'
                    ) : formData.paymentMethod === 'A_PRAZO' ? (
                      'Selecione a data de vencimento'
                    ) : (
                      'Selecione modalidade primeiro'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                    locale={ptBR}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {errors.dueDate && (
                <p className="text-sm text-destructive">{errors.dueDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Fornecedor/Cliente</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Referência/Documento</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit">
              {cashFlow ? 'Salvar Alterações' : 'Criar Movimentação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CashFlowForm;