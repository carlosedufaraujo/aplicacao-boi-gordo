import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, FileText, Scale, Calendar, DollarSign, Percent, Upload, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const slaughterSchema = z.object({
  slaughterDate: z.date(),
  slaughterQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  slaughterWeight: z.number().min(1, 'Peso deve ser maior que 0'),
  yieldPercentage: z.number().min(40, 'Rendimento deve ser maior que 40%').max(65, 'Rendimento deve ser menor que 65%'),
  pricePerArroba: z.number().min(1, 'Preço deve ser maior que 0'),
  invoiceNumber: z.string().min(1, 'Número da NF é obrigatório'),
  invoiceValue: z.number().min(1, 'Valor da NF deve ser maior que 0'),
  taxes: z.number().min(0, 'Impostos devem ser maior ou igual a 0'),
  discounts: z.number().min(0, 'Descontos devem ser maior ou igual a 0'),
  paymentDueDate: z.date(),
  observations: z.string().optional(),
});

interface SlaughterFormProps {
  isOpen: boolean;
  onClose: () => void;
  lot: any;
}

export const SlaughterForm: React.FC<SlaughterFormProps> = ({
  isOpen,
  onClose,
  lot
}) => {
  const { partners, expenses, addFinancialAccount, addNotification, updateExpense } = useAppStore();
  const [invoiceFile, setInvoiceFile] = React.useState<File | null>(null);
  const [romaneioFile, setRomaneioFile] = React.useState<File | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(slaughterSchema),
    defaultValues: {
      slaughterDate: new Date(),
      slaughterQuantity: lot.quantity,
      slaughterWeight: lot.exitWeight,
      yieldPercentage: 54, // Default yield
      pricePerArroba: 320, // Default price
      taxes: 0,
      discounts: 0,
      paymentDueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
    }
  });
  
  const watchedSlaughterQuantity = watch('slaughterQuantity');
  const watchedSlaughterWeight = watch('slaughterWeight');
  const watchedYieldPercentage = watch('yieldPercentage');
  const watchedPricePerArroba = watch('pricePerArroba');
  const watchedTaxes = watch('taxes');
  const watchedDiscounts = watch('discounts');
  
  // Calculate average weight per animal
  const averageWeight = watchedSlaughterQuantity && watchedSlaughterWeight
    ? watchedSlaughterWeight / watchedSlaughterQuantity
    : 0;
  
  // Calculate carcass weight
  const carcassWeight = watchedSlaughterWeight && watchedYieldPercentage
    ? (watchedSlaughterWeight * watchedYieldPercentage) / 100
    : 0;
  
  // Calculate arrobas
  const arrobas = carcassWeight / 15;
  
  // Calculate gross revenue
  const grossRevenue = arrobas * watchedPricePerArroba;
  
  // Calculate net revenue
  const netRevenue = grossRevenue - watchedTaxes - watchedDiscounts;
  
  // Handle file uploads
  const handleInvoiceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  };
  
  const handleRomaneioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRomaneioFile(e.target.files[0]);
    }
  };

  const handleFormSubmit = (data: any) => {
    // 🆕 NOVO: Processar frete próprio quando abate for registrado
    const { expenses, addFinancialAccount, addNotification, updateExpense } = useAppStore();
    
    // Buscar despesas de frete próprio relacionadas a este lote
    const ownFreightExpenses = expenses.filter(expense => 
      expense.category === 'freight' && 
      expense.metadata?.isOwnFreight && 
      expense.metadata?.relatedOrderId === lot.purchaseOrderId
    );
    
    // Para cada frete próprio, criar conta a pagar
    ownFreightExpenses.forEach(freightExpense => {
      // Criar conta a pagar para o dia seguinte ao abate
      const paymentDate = new Date(data.slaughterDate);
      paymentDate.setDate(paymentDate.getDate() + 1);
      
      addFinancialAccount({
        type: 'payable',
        description: `Frete Próprio - ${lot.lotNumber} - Pagamento pós-abate`,
        amount: freightExpense.totalAmount,
        dueDate: paymentDate,
        status: 'pending',
        relatedEntityType: 'freight',
        relatedEntityId: freightExpense.id,
        paymentMethod: 'Frete Próprio'
      });
      
      // Atualizar a despesa para indicar que foi ativada
      updateExpense(freightExpense.id, {
        ...freightExpense,
        paymentStatus: 'pending',
        paymentDate: paymentDate,
        metadata: {
          ...freightExpense.metadata,
          activatedOnSlaughter: true,
          slaughterDate: data.slaughterDate
        }
      });
      
      // Criar notificação
      addNotification({
        title: 'Frete Próprio Ativado',
        message: `Frete próprio de R$ ${freightExpense.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} do lote ${lot.lotNumber} foi lançado para pagamento`,
        type: 'info',
        relatedEntityType: 'cattle_lot',
        relatedEntityId: lot.id
      });
    });
    
    // Resto da lógica existente do abate...
    console.log('Registering slaughter:', data);
    
    // Show success notification
    alert('Abate registrado com sucesso! Conta a receber criada no módulo financeiro.');
    
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Registrar Abate</h2>
            <p className="text-purple-100 text-sm mt-1">
              Lote {lot.lotNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-purple-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4">
          {/* Lot Summary */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Scale className="w-4 h-4 mr-2 text-purple-600" />
              Resumo do Embarque
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">{lot.quantity}</div>
                <div className="text-xs text-neutral-600">Animais Embarcados</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">{(lot.exitWeight / lot.quantity).toFixed(0)}</div>
                <div className="text-xs text-neutral-600">Peso Médio Saída (kg)</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-navy-900">{lot.exitWeight.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-neutral-600">Peso Total Saída (kg)</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-base font-bold text-b3x-lime-600">
                  {lot.slaughterhouse}
                </div>
                <div className="text-xs text-neutral-600">Frigorífico</div>
              </div>
            </div>
          </div>

          {/* Slaughter Details */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Detalhes do Abate
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data do Abate *
                </label>
                <input
                  type="date"
                  {...register('slaughterDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.slaughterDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.slaughterDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade Abatida *
                </label>
                <input
                  type="number"
                  {...register('slaughterQuantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.slaughterQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.slaughterQuantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso de Abate (kg) *
                </label>
                <input
                  type="number"
                  {...register('slaughterWeight', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.slaughterWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.slaughterWeight.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Rendimento de Carcaça (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('yieldPercentage', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.yieldPercentage && (
                  <p className="text-error-500 text-xs mt-1">{errors.yieldPercentage.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Preço R$/@ *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('pricePerArroba', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.pricePerArroba && (
                  <p className="text-error-500 text-xs mt-1">{errors.pricePerArroba.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  {...register('paymentDueDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.paymentDueDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.paymentDueDate.message}</p>
                )}
              </div>
            </div>
            
            {/* Weight and Yield Summary */}
            {watchedSlaughterQuantity && watchedSlaughterWeight && watchedYieldPercentage && (
              <div className="mt-4 bg-purple-50 rounded-lg p-3 border border-purple-200">
                <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                  <Scale className="w-3 h-3 mr-2 text-purple-600" />
                  Resumo do Peso e Rendimento
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      {averageWeight.toFixed(0)}
                    </div>
                    <div className="text-xs text-neutral-600">Peso Médio (kg)</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      {watchedYieldPercentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-neutral-600">Rendimento</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-purple-600">
                      {carcassWeight.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-neutral-600">Peso Carcaça (kg)</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-purple-600">
                      {arrobas.toFixed(1)}
                    </div>
                    <div className="text-xs text-neutral-600">Arrobas (@)</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Details */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Detalhes Financeiros
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Número da NF *
                </label>
                <input
                  type="text"
                  {...register('invoiceNumber')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: NF-123456"
                />
                {errors.invoiceNumber && (
                  <p className="text-error-500 text-xs mt-1">{errors.invoiceNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Valor da NF (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('invoiceValue', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {errors.invoiceValue && (
                  <p className="text-error-500 text-xs mt-1">{errors.invoiceValue.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Impostos (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('taxes', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {errors.taxes && (
                    <p className="text-error-500 text-xs mt-1">{errors.taxes.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Descontos (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('discounts', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {errors.discounts && (
                    <p className="text-error-500 text-xs mt-1">{errors.discounts.message}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Financial Summary */}
            {watchedPricePerArroba && arrobas > 0 && (
              <div className="bg-success-50 rounded-lg p-3 border border-success-200">
                <h4 className="font-medium text-b3x-navy-900 mb-2 text-sm flex items-center">
                  <DollarSign className="w-3 h-3 mr-2 text-success-600" />
                  Resumo Financeiro
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-navy-900">
                      R$ {watchedPricePerArroba.toFixed(2)}
                    </div>
                    <div className="text-xs text-neutral-600">Preço/@</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-success-600">
                      R$ {grossRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-neutral-600">Receita Bruta</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-error-600">
                      R$ {(watchedTaxes + watchedDiscounts).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-neutral-600">Deduções</div>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <div className="text-base font-bold text-b3x-lime-600">
                      R$ {netRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-neutral-600">Receita Líquida</div>
                  </div>
                </div>
                
                {/* Alert about financial integration */}
                <div className="mt-3 p-2 bg-info-50 rounded-lg border border-info-200">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-3 h-3 text-info-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-info-700">
                      Ao salvar, será criado automaticamente um lançamento no Contas a Receber com vencimento em {new Date(watch('paymentDueDate')).toLocaleDateString('pt-BR')}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Document Uploads */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Documentos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Nota Fiscal
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleInvoiceFileChange}
                    className="hidden"
                    id="invoice-file"
                  />
                  <label
                    htmlFor="invoice-file"
                    className="flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors flex-1 text-sm"
                  >
                    <Upload className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-700 truncate">
                      {invoiceFile ? invoiceFile.name : 'Selecionar NF'}
                    </span>
                  </label>
                  {invoiceFile && (
                    <div className="px-2 py-1 bg-success-100 text-success-700 rounded-lg text-xs">
                      ✓ Anexado
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Romaneio de Abate
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleRomaneioFileChange}
                    className="hidden"
                    id="romaneio-file"
                  />
                  <label
                    htmlFor="romaneio-file"
                    className="flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors flex-1 text-sm"
                  >
                    <Upload className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-700 truncate">
                      {romaneioFile ? romaneioFile.name : 'Selecionar Romaneio'}
                    </span>
                  </label>
                  {romaneioFile && (
                    <div className="px-2 py-1 bg-success-100 text-success-700 rounded-lg text-xs">
                      ✓ Anexado
                    </div>
                  )}
                </div>
              </div>
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
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Observações sobre o abate..."
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
              className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <FileText className="w-3 h-3" />
              <span>Registrar Abate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};