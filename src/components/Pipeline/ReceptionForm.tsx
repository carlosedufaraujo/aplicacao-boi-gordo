import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Truck, Upload, AlertTriangle, Plus, DollarSign, Calendar, FileText, Users, Scale, CreditCard } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { PurchaseOrder, Expense } from '../../types';
import { PartnerForm } from '../Forms/PartnerForm';
import { Portal } from '../Common/Portal';

const cattleLotSchema = z.object({
  purchaseOrderId: z.string().min(1, 'Selecione uma ordem de compra'),
  entryWeight: z.number().min(1, 'Peso de entrada deve ser maior que 0'),
  entryQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  quantityDifferenceReason: z.string().optional(),
  freightKm: z.number().min(0, 'Distância não pode ser negativa'),
  freightCostPerKm: z.number().min(0, 'Custo por km não pode ser negativo'),
  freightType: z.enum(['own', 'third']),
  freightPaymentType: z.enum(['cash', 'installment']).optional(),
  freightPaymentDate: z.date().optional(),
  transportCompanyId: z.string().optional(),
  transportCompany: z.string().optional(),
  entryDate: z.date({
    required_error: "Data de entrada é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  cocoEntryDate: z.date({
    required_error: "Data de entrada no curral é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  estimatedGmd: z.number().min(0, 'GMD não pode ser negativo'),
  observations: z.string().optional()
});

interface ReceptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder;
}

export const ReceptionForm: React.FC<ReceptionFormProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { 
    addCattleLot, 
    partners, 
    generateLotNumber, 
    addFinancialAccount, 
    addNotification, 
    updateCattleLot, 
    cattleLots,
    addExpense,
    movePurchaseOrderToNextStage
  } = useAppStore();
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [showTransportCompanyForm, setShowTransportCompanyForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError,
    clearErrors
  } = useForm<z.infer<typeof cattleLotSchema>>({
    resolver: zodResolver(cattleLotSchema),
    defaultValues: {
      purchaseOrderId: order.id,
      entryQuantity: order.quantity,
      entryWeight: order.totalWeight,
      freightType: 'third',
      freightKm: order.freightKm || 0,
      freightCostPerKm: order.freightCostPerKm || 0,
      transportCompanyId: order.transportCompanyId || '',
      freightPaymentType: 'cash',
      cocoEntryDate: new Date(),
      estimatedGmd: 1.5
    }
  });

  const watchedValues = watch();
  
  // Debug: monitorar erros
  useEffect(() => {
    console.log('Form errors:', errors);
  }, [errors]);
  
  // CORREÇÃO: Cálculo da quebra de peso (agora mostra valor negativo quando o peso de entrada é menor)
  const weightDifference = watchedValues.entryWeight - order.totalWeight;
  const weightLossPercentage = order.totalWeight > 0 ? (weightDifference / order.totalWeight) * 100 : 0;

  // Verificar diferença na quantidade
  const quantityDifference = watchedValues.entryQuantity !== order.quantity;
  const quantityLoss = order.quantity - (watchedValues.entryQuantity || 0);

  // Filtrar transportadoras (parceiros do tipo 'vendor' que são transportadoras)
  const transportCompanies = partners.filter(p => p.type === 'vendor' && p.isActive && p.isTransporter);

  const handleFormSubmit = (data: any) => {
    console.log('Form submitted with data:', data);
    
    // VALIDAÇÃO: Se quantidade diferente, motivo é obrigatório
    if (quantityDifference && !data.quantityDifferenceReason?.trim()) {
      setError('quantityDifferenceReason', {
        type: 'manual',
        message: 'Motivo é obrigatório quando a quantidade for diferente da comprada'
      });
      return;
    }

    // VALIDAÇÃO: Se frete terceiro a prazo, data é obrigatória
    if (data.freightType === 'third' && data.freightPaymentType === 'installment' && !data.freightPaymentDate) {
      setError('freightPaymentDate', {
        type: 'manual',
        message: 'Data de pagamento é obrigatória para frete a prazo'
      });
      return;
    }

    // Gerar número de lote baseado no código da ordem
    // Usar o mesmo código da ordem de compra para o lote
    const lotNumber = order.code;
    
    const freightCost = data.freightKm * data.freightCostPerKm;
    
    // Preparar observações com nota sobre frete próprio se aplicável
    let finalObservations = data.observations || '';
    if (data.freightType === 'own' && freightCost > 0) {
      const freteProprioNote = `FRETE PRÓPRIO: R$ ${freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Será lançado para pagamento quando os animais forem abatidos.`;
      finalObservations = finalObservations ? `${finalObservations}\n\n${freteProprioNote}` : freteProprioNote;
    }

    // CORREÇÃO: Buscar e atualizar o lote existente ao invés de criar um novo
    const existingLot = cattleLots.find(lot => lot.purchaseOrderId === order.id);
    
    if (existingLot) {
      // Atualizar o lote existente com os dados da recepção
      updateCattleLot(existingLot.id, {
        entryWeight: data.entryWeight,
        entryQuantity: data.entryQuantity,
        quantityDifference: quantityDifference ? quantityLoss : undefined,
        quantityDifferenceReason: data.quantityDifferenceReason,
        freightKm: data.freightKm,
        freightCostPerKm: data.freightCostPerKm,
        transportCompany: data.transportCompanyId ? 
          partners.find(p => p.id === data.transportCompanyId)?.name : undefined,
        entryDate: data.cocoEntryDate || new Date(),
        cocoEntryDate: data.cocoEntryDate,
        observations: finalObservations,
        custoAcumulado: {
          ...existingLot.custoAcumulado,
          frete: data.freightType === 'own' ? freightCost : 0,
          total: existingLot.custoAcumulado.aquisicao + 
                 existingLot.custoAcumulado.sanidade +
                 existingLot.custoAcumulado.alimentacao +
                 existingLot.custoAcumulado.operacional +
                 (data.freightType === 'own' ? freightCost : 0) +
                 existingLot.custoAcumulado.outros
        }
      });
    } else {
      // Se por algum motivo o lote não existe, criar um novo (fallback)
      addCattleLot({
        lotNumber: lotNumber,
        purchaseOrderId: order.id,
        entryWeight: data.entryWeight,
        entryQuantity: data.entryQuantity,
        quantityDifference: quantityDifference ? quantityLoss : undefined,
        quantityDifferenceReason: data.quantityDifferenceReason,
        freightKm: data.freightKm,
        freightCostPerKm: data.freightCostPerKm,
        transportCompany: data.transportCompanyId ? 
          partners.find(p => p.id === data.transportCompanyId)?.name : undefined,
        entryDate: data.cocoEntryDate || new Date(),
        cocoEntryDate: data.cocoEntryDate,
        estimatedGmd: 1.5,
        deaths: 0,
        observations: finalObservations,
        status: 'active',
        custoAcumulado: {
          aquisicao: 0,
          sanidade: 0,
          alimentacao: 0,
          operacional: 0,
          frete: data.freightType === 'own' ? freightCost : 0,
          outros: 0,
          total: data.freightType === 'own' ? freightCost : 0
        }
      });
    }
    
    // Se frete terceiro, criar conta a pagar
    if (data.freightType === 'third' && freightCost > 0) {
      // Criar despesa de frete
      const freightExpense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        date: new Date(),
        description: `Frete Terceiro - ${order.code} - ${data.transportCompanyId ? partners.find(p => p.id === data.transportCompanyId)?.name : 'Transportadora'}`,
        category: 'freight',
        totalAmount: freightCost,
        supplierId: data.transportCompanyId || undefined,
        invoiceNumber: `FT-${order.code}`,
        paymentStatus: 'pending',
        paymentDate: data.freightPaymentType === 'installment' ? data.freightPaymentDate : new Date(),
        allocations: [], // Será preenchido após criar a despesa
        attachments: [],
        impactsCashFlow: true
      };
      
      addExpense(freightExpense);
      
      addFinancialAccount({
        type: 'payable',
        description: `Frete - ${order.code} - ${data.transportCompanyId ? partners.find(p => p.id === data.transportCompanyId)?.name : 'Transportadora'}`,
        amount: freightCost,
        dueDate: data.freightPaymentType === 'installment' ? data.freightPaymentDate : new Date(),
        status: 'pending',
        relatedEntityType: 'freight',
        relatedEntityId: order.id,
        paymentMethod: data.freightPaymentType === 'cash' ? 'À Vista' : 'A Prazo'
      });
      
      // Criar notificação
      addNotification({
        title: 'Conta de Frete Criada',
        message: `Frete de R$ ${freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para a ordem ${order.code}`,
        type: 'info',
        relatedEntityType: 'purchase_order',
        relatedEntityId: order.id
      });
    } else if (data.freightType === 'own' && freightCost > 0) {
      // 🆕 NOVO: Para frete próprio, criar despesa pendente
      const ownFreightExpense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
        date: new Date(),
        description: `Frete Próprio - ${order.code} - Pagamento após abate`,
        category: 'freight',
        totalAmount: freightCost,
        supplierId: undefined,
        invoiceNumber: `FP-${order.code}`,
        paymentStatus: 'pending',
        paymentDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Data futura
        allocations: [],
        attachments: [],
        impactsCashFlow: true
      };
      
      addExpense(ownFreightExpense);
      
      // 🆕 NOVO: Criar conta a pagar futura (com status especial)
      addFinancialAccount({
        type: 'payable',
        description: `Frete Próprio (Futuro) - ${order.code} - Aguardando abate`,
        amount: freightCost,
        dueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Data futura provisória
        status: 'pending',
        relatedEntityType: 'freight',
        relatedEntityId: order.id,
        paymentMethod: 'Frete Próprio',
        observations: 'ATENÇÃO: Este frete será ativado automaticamente quando os animais forem abatidos'
      });
      
      // Criar notificação
      addNotification({
        title: 'Frete Próprio Registrado',
        message: `Frete próprio de R$ ${freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} será lançado quando os animais forem abatidos`,
        type: 'info',
        relatedEntityType: 'purchase_order',
        relatedEntityId: order.id
      });
    }

    // ALTERAÇÃO: NÃO mover para próxima etapa automaticamente
    // Manter na etapa 'reception' para aguardar protocolo sanitário
    
    // Mover para a próxima etapa (confined)
    movePurchaseOrderToNextStage(order.id);
    
    // Criar notificação de sucesso
    addNotification({
      title: 'Recepção Confirmada',
      message: `Ordem ${order.code} recebida com sucesso. ${data.entryQuantity} animais confinados.`,
      type: 'success',
      relatedEntityType: 'purchase_order',
      relatedEntityId: order.id
    });
    
    reset();
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  // NOVO: Limpar erro quando motivo for preenchido
  const handleQuantityReasonChange = (value: string) => {
    setValue('quantityDifferenceReason', value);
    if (value.trim()) {
      clearErrors('quantityDifferenceReason');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[10000] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-900 to-b3x-navy-800 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold">Recepção no Confinamento</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">Ordem: {order.code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit, (errors) => {
          console.log('Validation errors:', errors);
        })} className="p-4 space-y-4">
          {/* Order Summary */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-b3x-lime-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Resumo da Ordem de Compra</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-b3x-navy-900">{order.quantity}</div>
                <div className="text-xs text-neutral-600">Quantidade Comprada</div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-b3x-navy-900">{order.totalWeight.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-neutral-600">Peso Comprado (kg)</div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-b3x-lime-600">R$ {order.pricePerArroba.toFixed(2)}</div>
                <div className="text-xs text-neutral-600">Preço R$/@</div>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg text-center">
                <div className="text-lg font-bold text-success-600">
                  {(() => {
                    // 🆕 CORRIGIDO: Considerar R.C.% no cálculo
                    const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
                    const carcassWeight = order.totalWeight * (rcPercentage / 100);
                    const arrobas = carcassWeight / 15;
                    const animalValue = arrobas * order.pricePerArroba;
                    return `R$ ${animalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                  })()}
                </div>
                <div className="text-xs text-neutral-600">Valor Total</div>
              </div>
            </div>
          </div>

          {/* Reception Data */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-soft">
            <div className="flex items-center space-x-2 mb-3">
              <Truck className="w-4 h-4 text-b3x-lime-600" />
              <h3 className="text-base font-semibold text-b3x-navy-900">Dados da Recepção</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Peso de Entrada (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('entryWeight', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent transition-all duration-200"
                  placeholder={`Peso comprado: ${order.totalWeight} kg`}
                />
                {errors.entryWeight && (
                  <p className="text-error-500 text-xs mt-1">{errors.entryWeight.message}</p>
                )}
                {weightDifference !== 0 && (
                  <div className={`mt-2 p-2 rounded-lg ${
                    weightDifference < 0 && Math.abs(weightLossPercentage) > 5 
                      ? 'bg-error-50 border border-error-200' 
                      : 'bg-warning-50 border border-warning-200'
                  }`}>
                    <p className={`text-xs font-medium ${
                      weightDifference < 0 && Math.abs(weightLossPercentage) > 5 
                        ? 'text-error-700' 
                        : 'text-warning-700'
                    }`}>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {weightDifference < 0 
                        ? `Quebra de peso: ${Math.abs(weightLossPercentage).toFixed(1)}%` 
                        : `Ganho de peso: ${weightLossPercentage.toFixed(1)}%`}
                      {weightDifference < 0 && Math.abs(weightLossPercentage) > 5 && ' (Acima do esperado)'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Quantidade de Entrada *
                </label>
                <input
                  type="number"
                  {...register('entryQuantity', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent transition-all duration-200"
                  placeholder={`Quantidade comprada: ${order.quantity}`}
                />
                {errors.entryQuantity && (
                  <p className="text-error-500 text-xs mt-1">{errors.entryQuantity.message}</p>
                )}
                
                {/* Alerta de diferença na quantidade */}
                {quantityDifference && (
                  <div className={`mt-2 p-2 rounded-lg ${quantityLoss > 0 ? 'bg-error-50 border border-error-200' : 'bg-info-50 border border-info-200'}`}>
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className={`w-3 h-3 ${quantityLoss > 0 ? 'text-error-600' : 'text-info-600'}`} />
                      <p className={`text-xs font-medium ${quantityLoss > 0 ? 'text-error-700' : 'text-info-700'}`}>
                        {quantityLoss > 0 
                          ? `Quantidade a menos: ${quantityLoss} animais`
                          : `Quantidade a mais: ${Math.abs(quantityLoss)} animais`
                        }
                      </p>
                    </div>
                    
                    {/* Campo de seleção ao invés de texto livre */}
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Motivo da Diferença *
                      </label>
                      <select
                        value={watchedValues.quantityDifferenceReason || ''}
                        onChange={(e) => handleQuantityReasonChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:ring-1 focus:ring-b3x-lime-500 focus:border-b3x-lime-500"
                      >
                        <option value="">Selecione o motivo</option>
                        <option value="Morte Transporte">Morte Transporte</option>
                        <option value="Embarcou Quantidade Errada">Embarcou Quantidade Errada</option>
                      </select>
                      {errors.quantityDifferenceReason && (
                        <p className="text-error-500 text-xs mt-1">{errors.quantityDifferenceReason.message}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Data de Entrada no Cocho *
                </label>
                <input
                  type="date"
                  {...register('cocoEntryDate', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent transition-all duration-200"
                />
                {errors.cocoEntryDate && (
                  <p className="text-error-500 text-xs mt-1">{errors.cocoEntryDate.message}</p>
                )}
                <p className="text-xs text-neutral-500 mt-1">Data em que os animais entraram no confinamento</p>
              </div>
            </div>

            {/* Informações de Transporte */}
            <div className="bg-white rounded-lg p-3 mb-4 border border-neutral-200">
              <h4 className="font-medium text-b3x-navy-900 mb-3 text-sm flex items-center">
                <Truck className="w-3 h-3 mr-2 text-b3x-lime-600" />
                Informações de Transporte
              </h4>
              
              {/* Tipo de Frete */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tipo de Frete *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="own"
                      {...register('freightType')}
                      className="rounded-full border-neutral-300 text-b3x-lime-600 focus:ring-b3x-lime-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Frete Próprio</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="third"
                      {...register('freightType')}
                      className="rounded-full border-neutral-300 text-b3x-lime-600 focus:ring-b3x-lime-500"
                    />
                    <span className="ml-2 text-sm text-neutral-700">Frete Terceiro</span>
                  </label>
                </div>
              </div>

              {/* Aviso para Frete Próprio */}
              {watchedValues.freightType === 'own' && (
                <div className="mb-3 p-2 bg-info-50 border border-info-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-info-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-info-700">
                      <p className="font-medium">Frete Próprio</p>
                      <p className="mt-1">
                        O custo do frete será incluído no custo do lote. Quando os animais forem abatidos, 
                        será gerado um lançamento para pagamento no dia seguinte.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Transportadora
                  </label>
                  <div className="flex space-x-2">
                    <select
                      {...register('transportCompanyId')}
                      className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    >
                      <option value="">Selecione a transportadora</option>
                      {transportCompanies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowTransportCompanyForm(true)}
                      className="px-2 py-2 bg-b3x-lime-500 text-b3x-navy-900 rounded-lg hover:bg-b3x-lime-600 transition-colors"
                      title="Adicionar nova transportadora"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    KM Total do Frete
                  </label>
                  <input
                    type="number"
                    {...register('freightKm', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    placeholder="Ex: 150"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    R$/KM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('freightCostPerKm', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                    placeholder="Ex: 2.50"
                  />
                </div>
              </div>
              
              {/* Cálculo do custo total do frete */}
              {watchedValues.freightKm > 0 && watchedValues.freightCostPerKm > 0 && (
                <div className="mt-3 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-700">Custo Total do Frete:</span>
                    <span className="font-bold text-neutral-700">
                      R$ {(watchedValues.freightKm * watchedValues.freightCostPerKm).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Condições de Pagamento para Frete Terceiro */}
              {watchedValues.freightType === 'third' && watchedValues.freightKm > 0 && watchedValues.freightCostPerKm > 0 && (
                <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded-lg">
                  <h5 className="text-xs font-medium text-neutral-700 mb-2 flex items-center">
                    <CreditCard className="w-3 h-3 mr-1 text-warning-600" />
                    Condições de Pagamento do Frete
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">
                        Tipo de Pagamento
                      </label>
                      <select
                        {...register('freightPaymentType')}
                        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                      >
                        <option value="cash">À Vista</option>
                        <option value="installment">A Prazo</option>
                      </select>
                    </div>
                    
                    {watchedValues.freightPaymentType === 'installment' && (
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Data de Pagamento *
                        </label>
                        <input
                          type="date"
                          {...register('freightPaymentDate', { valueAsDate: true })}
                          className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent"
                        />
                        {errors.freightPaymentDate && (
                          <p className="text-error-500 text-xs mt-1">{errors.freightPaymentDate.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Comprovante de Entrega */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Comprovante de Entrega
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="payment-proof"
                />
                <label
                  htmlFor="payment-proof"
                  className="flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors flex-1 text-sm"
                >
                  <Upload className="w-4 h-4 text-b3x-lime-600" />
                  <span className="text-neutral-700 truncate">
                    {paymentProof ? paymentProof.name : 'Selecionar arquivo'}
                  </span>
                </label>
                {paymentProof && (
                  <div className="px-2 py-1 bg-success-100 text-success-700 rounded-lg text-xs">
                    ✓ Anexado
                  </div>
                )}
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
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent transition-all duration-200"
              placeholder="Observações sobre a recepção dos animais..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => {
                console.log('Test button clicked!');
                console.log('Form values:', watch());
                console.log('Form errors:', errors);
              }}
              className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
            >
              Debug Form
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={() => console.log('Button clicked!')}
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
            >
              <Truck className="w-3 h-3" />
              <span>Confirmar Recepção</span>
            </button>
          </div>
        </form>
      </div>

      {/* Formulário de Cadastro de Transportadora */}
      {showTransportCompanyForm && (
        <Portal>
          <PartnerForm
            isOpen={showTransportCompanyForm}
            onClose={() => setShowTransportCompanyForm(false)}
            type="vendor"
            isTransporter={true}
          />
        </Portal>
      )}
    </div>
  );
};