import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle, Calendar, DollarSign, CreditCard, FileText, Upload } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const reconciliationSchema = z.object({
  reconciliationDate: z.date({
    required_error: "Data de conciliação é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  paymentDate: z.date({
    required_error: "Data de pagamento é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  receivedAmount: z.number().min(1, 'Valor deve ser maior que 0'),
  bankAccount: z.string().min(1, 'Selecione uma conta bancária'),
  transactionId: z.string().optional(),
  observations: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Número da nota fiscal é obrigatório'),
  finalAmount: z.number().min(0, 'Valor final deve ser maior ou igual a zero'),
});

interface ReconciliationFormProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any;
}

export const ReconciliationForm: React.FC<ReconciliationFormProps> = ({
  isOpen,
  onClose,
  sale
}) => {
  const { payerAccounts } = useAppStore();
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      reconciliationDate: new Date(),
      paymentDate: new Date(),
      receivedAmount: sale.grossValue - (sale.taxes || 0) - (sale.discounts || 0),
    }
  });
  
  const watchedReceivedAmount = watch('receivedAmount');
  const expectedAmount = sale.grossValue - (sale.taxes || 0) - (sale.discounts || 0);
  const difference = watchedReceivedAmount - expectedAmount;
  
  // Handle file upload
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = (data: any) => {
    // In a real implementation, this would update the sale status to "reconciled"
    // and mark the financial account as paid
    
    // Show success notification
    alert('Pagamento conciliado com sucesso!');
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-success-500 to-success-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Conciliar Pagamento</h2>
            <p className="text-success-100 text-sm mt-1">
              Lote {sale.lotNumber} - NF {sale.invoiceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-success-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Sale Summary */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-success-600" />
              Resumo da Venda
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">{sale.invoiceNumber}</div>
                <div className="text-xs text-neutral-600">Nota Fiscal</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">{format(sale.slaughterDate, 'dd/MM/yyyy')}</div>
                <div className="text-xs text-neutral-600">Data do Abate</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-success-600">
                  R$ {sale.grossValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-neutral-600">Valor Bruto</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-lime-600">
                  R$ {expectedAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-neutral-600">Valor Líquido</div>
              </div>
            </div>
          </div>

          {/* Reconciliation Details */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Detalhes da Conciliação
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data da Conciliação *
                </label>
                <input
                  type="date"
                  {...register('reconciliationDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                />
                {errors.reconciliationDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.reconciliationDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  {...register('paymentDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                />
                {errors.paymentDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.paymentDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Valor Recebido (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('receivedAmount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                />
                {errors.receivedAmount && (
                  <p className="text-error-500 text-xs mt-1">{errors.receivedAmount.message}</p>
                )}
                
                {/* Show difference if any */}
                {Math.abs(difference) > 0.01 && (
                  <div className={`mt-2 p-2 rounded-lg text-xs ${
                    difference > 0 
                      ? 'bg-success-50 text-success-700 border border-success-200' 
                      : 'bg-error-50 text-error-700 border border-error-200'
                  }`}>
                    {difference > 0 
                      ? `Recebido R$ ${difference.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais que o esperado` 
                      : `Recebido R$ ${Math.abs(difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a menos que o esperado`}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Conta Bancária *
                </label>
                <select
                  {...register('bankAccount')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                >
                  <option value="">Selecione uma conta</option>
                  {payerAccounts.filter(acc => acc.isActive).map(account => (
                    <option key={account.id} value={account.bankAccount}>
                      {account.name} - {account.bankName} ({account.bankAccount})
                    </option>
                  ))}
                </select>
                {errors.bankAccount && (
                  <p className="text-error-500 text-xs mt-1">{errors.bankAccount.message}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                ID da Transação / Referência
              </label>
              <input
                type="text"
                {...register('transactionId')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="Ex: TED123456, PIX789012"
              />
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Comprovante de Pagamento
            </h3>
            
            <div>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleReceiptFileChange}
                  className="hidden"
                  id="receipt-file"
                />
                <label
                  htmlFor="receipt-file"
                  className="flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors flex-1 text-sm"
                >
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-neutral-700 truncate">
                    {receiptFile ? receiptFile.name : 'Selecionar comprovante'}
                  </span>
                </label>
                {receiptFile && (
                  <div className="px-2 py-1 bg-success-100 text-success-700 rounded-lg text-xs">
                    ✓ Anexado
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Anexe o comprovante de pagamento (opcional)
              </p>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Observações
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-success-500 focus:border-transparent"
              placeholder="Observações sobre a conciliação..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-gradient-to-r from-success-500 to-success-600 text-white font-medium rounded-lg hover:from-success-600 hover:to-success-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Confirmar Conciliação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
