import React, { useState } from 'react';
import { Calendar, MapPin, User, DollarSign, ArrowRight, Truck, Upload, AlertTriangle, CreditCard, Users, Scale, ArrowLeft, Clock, TrendingDown, TrendingUp, UserCheck, Bell, Edit } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import { useAppStore } from '../../stores/useAppStore';
import { format, differenceInDays } from 'date-fns';
import { ReceptionForm } from './ReceptionForm';
import { LotAllocationForm } from '../Forms/LotAllocationForm';
import { Portal } from '../Common/Portal';
import { NotificationBadge } from '../Notifications/NotificationBadge';
import { PurchaseOrderForm } from '../Forms/PurchaseOrderForm';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
}

export const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({ order }) => {
  const { 
    partners, 
    payerAccounts, 
    cattleLots,
    notifications,
    movePurchaseOrderToNextStage, 
    movePurchaseOrderToPreviousStage,
    updatePurchaseOrder 
  } = useAppStore();
  
  const [showReceptionForm, setShowReceptionForm] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  
  const vendor = partners.find(p => p.id === order.vendorId);
  const broker = order.brokerId ? partners.find(p => p.id === order.brokerId) : null;
  
  // Encontrar o lote relacionado a esta ordem (se existir)
  const relatedLot = cattleLots.find(lot => lot.purchaseOrderId === order.id);
  
  // Contar notificações relacionadas a esta ordem
  const orderNotifications = notifications.filter(
    n => n.relatedEntityType === 'purchase_order' && n.relatedEntityId === order.id && !n.isRead
  );

  const handleMoveToNextStage = () => {
    if (order.status === 'reception' && !relatedLot) {
      // Primeira vez: registrar recepção
      setShowReceptionForm(true);
    } else if (order.status === 'reception' && relatedLot) {
      // Segunda vez: alocar em curral (MODAL OBRIGATÓRIO)
      setShowAllocationModal(true);
    } else {
      // Outras etapas: avançar normalmente
      movePurchaseOrderToNextStage(order.id);
    }
  };

  const handleMoveToPreviousStage = () => {
    movePurchaseOrderToPreviousStage(order.id);
  };

  const handlePaymentValidation = (checked: boolean) => {
    updatePurchaseOrder(order.id, { paymentValidated: checked });
  };

  const handlePayerAccountChange = (payerAccountId: string) => {
    updatePurchaseOrder(order.id, { payerAccountId });
  };

  // Calcular valor total incluindo todos os custos
  // 🆕 CORRIGIDO: Considerar R.C.% no cálculo
  const rcPercentage = order.rcPercentage || 50; // Default 50% se não informado
  const carcassWeight = order.totalWeight * (rcPercentage / 100);
  const arrobas = carcassWeight / 15;
  const animalValue = arrobas * order.pricePerArroba;
  const totalValue = animalValue + order.commission + (order.taxes || 0) + order.otherCosts;

  // Verificar se pode avançar da etapa de validação de pagamento
  const canAdvanceFromPaymentValidation = order.status === 'payment_validation' && 
    order.payerAccountId && order.paymentValidated;

  // Verificar se pode voltar etapa
  const canGoBack = ['payment_validation', 'reception', 'confined'].includes(order.status);

  // NOVA FUNCIONALIDADE: Calcular dias aguardando protocolo sanitário
  const getDaysWaitingForProtocol = () => {
    if (order.status === 'reception' && relatedLot) {
      return differenceInDays(new Date(), relatedLot.entryDate);
    }
    return 0;
  };

  // NOVA FUNCIONALIDADE: Calcular quebra de peso e diferença de animais
  const getReceptionData = () => {
    if (!relatedLot) return null;

    const weightLoss = ((order.totalWeight - relatedLot.entryWeight) / order.totalWeight) * 100;
    const animalDifference = order.quantity - relatedLot.entryQuantity;
    const averageWeightPerAnimal = relatedLot.entryWeight / relatedLot.entryQuantity;

    return {
      weightLoss,
      animalDifference,
      averageWeightPerAnimal,
      hasWeightLoss: weightLoss > 0,
      hasAnimalDifference: animalDifference !== 0
    };
  };

  const receptionData = getReceptionData();
  const daysWaiting = getDaysWaitingForProtocol();

  // Função para obter o status do negócio baseado na etapa do pipeline
  const getStatusInfo = () => {
    switch (order.status) {
      case 'order':
        return {
          label: 'Ordem Criada',
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-700'
        };
      case 'payment_validation':
        return {
          label: 'Validando Pagamento',
          bgColor: 'bg-warning-100',
          textColor: 'text-warning-700'
        };
      case 'reception':
        return {
          label: 'Em Recepção',
          bgColor: 'bg-info-100',
          textColor: 'text-info-700'
        };
      case 'confined':
        return {
          label: 'Confinado',
          bgColor: 'bg-success-100',
          textColor: 'text-success-700'
        };
      default:
        return {
          label: 'Status Desconhecido',
          bgColor: 'bg-neutral-100',
          textColor: 'text-neutral-700'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-neutral-200/50 shadow-soft hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200 p-3 sm:p-4 relative w-full">
        {/* Indicador de notificações */}
        {orderNotifications.length > 0 && (
          <div className="absolute -top-1 -right-1">
            <NotificationBadge count={orderNotifications.length} />
          </div>
        )}
        
        {/* Header - Melhor espaçamento */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center">
              <h4 className="font-semibold text-b3x-navy-900 text-sm sm:text-base truncate">{order.code}</h4>
              <button 
                onClick={() => setShowEditForm(true)}
                className="ml-2 p-1 text-b3x-lime-600 hover:text-b3x-lime-700 hover:bg-neutral-100 rounded transition-colors"
                title="Editar ordem"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center text-xs sm:text-sm text-neutral-600 mt-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{format(order.date, 'dd/MM/yyyy')}</span>
            </div>
          </div>
          <span className={`text-xs sm:text-sm font-medium ${statusInfo.textColor} ${statusInfo.bgColor} px-2 py-1 rounded-full border border-${statusInfo.bgColor.split('-')[1]}-200 flex-shrink-0 self-start`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Informações principais - Melhor organização e responsivo */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-xs sm:text-sm text-neutral-600">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span className="truncate">{order.city}, {order.state}</span>
          </div>
          
          <div className="flex items-center text-xs sm:text-sm text-neutral-600">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span className="truncate">{vendor?.name || 'Vendedor não encontrado'}</span>
          </div>

          {broker && (
            <div className="flex items-center text-xs sm:text-sm text-neutral-600">
              <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
              <div className="truncate">
                <span className="text-xs sm:text-sm text-neutral-500">Corretor:</span>
                <span className="ml-1">{broker.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dados numéricos - Grid responsivo */}
        <div className="bg-neutral-50/80 rounded-lg p-2 sm:p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-neutral-400" />
                <span className="text-neutral-600">Qtd:</span>
              </div>
              <span className="font-medium text-b3x-navy-900">{order.quantity}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-neutral-400" />
                <span className="text-neutral-600">Peso:</span>
              </div>
              <span className="font-medium text-b3x-navy-900">{order.totalWeight.toLocaleString('pt-BR')} kg</span>
            </div>
            
            <div className="flex items-center justify-between col-span-2">
              <div className="flex items-center">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-neutral-400" />
                <span className="text-neutral-600">Valor Total:</span>
              </div>
              <span className="font-medium text-b3x-navy-900">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* NOVA SEÇÃO: Informações específicas da etapa de Recepção */}
        {order.status === 'reception' && relatedLot && (
          <div className="border-t border-neutral-100 pt-3 space-y-3">
            {/* Aguardando Alocação em Curral */}
            <div className="bg-b3x-lime-50 border border-b3x-lime-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-b3x-lime-600 flex-shrink-0" />
                <span className="text-sm font-medium text-b3x-lime-800">
                  Aguardando Alocação em Curral
                </span>
              </div>
              <p className="text-xs text-b3x-lime-700">
                Animais recebidos, aguardando definição do curral
              </p>
            </div>

            {/* Informações da Recepção */}
            <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
              <h5 className="text-xs font-medium text-neutral-700 mb-2">Dados da Recepção:</h5>
              
              <div className="space-y-2 text-xs">
                {/* Quebra de Peso */}
                {receptionData?.hasWeightLoss && (
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-3 h-3 text-error-500 flex-shrink-0" />
                    <span className="text-error-600 font-medium">
                      Quebra de peso: {receptionData.weightLoss.toFixed(1)}%
                    </span>
                  </div>
                )}

                {/* Diferença de Animais */}
                {receptionData?.hasAnimalDifference && (
                  <div className="flex items-center space-x-2">
                    {receptionData.animalDifference > 0 ? (
                      <>
                        <TrendingDown className="w-3 h-3 text-error-500 flex-shrink-0" />
                        <span className="text-error-600 font-medium">
                          Diferença: -{receptionData.animalDifference} animais
                        </span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-3 h-3 text-success-500 flex-shrink-0" />
                        <span className="text-success-600 font-medium">
                          Diferença: +{Math.abs(receptionData.animalDifference)} animais
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Peso Médio por Animal */}
                <div className="flex items-center space-x-2">
                  <Scale className="w-3 h-3 text-info-500 flex-shrink-0" />
                  <span className="text-neutral-600">
                    Peso médio: <span className="font-medium text-info-600">
                      {receptionData?.averageWeightPerAnimal.toFixed(1)} kg/animal
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage-specific actions para outras etapas */}
        {order.status === 'payment_validation' && (
          <div className="border-t border-neutral-100 pt-3 space-y-3">
            {/* ALERTA se não tem conta pagadora ou pagamento não validado */}
            {(!order.payerAccountId || !order.paymentValidated) && (
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-warning-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-warning-700 min-w-0">
                  <p className="font-medium">Validação Pendente</p>
                  <p className="text-xs mt-1">
                    {!order.payerAccountId && 'Selecione a conta pagadora. '}
                    {!order.paymentValidated && 'Marque o pagamento como validado.'}
                  </p>
                </div>
              </div>
            )}

            {/* Seleção da Conta Pagadora */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-2">
                Conta Pagadora *
              </label>
              <select
                value={order.payerAccountId || ''}
                onChange={(e) => handlePayerAccountChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-b3x-lime-500"
              >
                <option value="">Selecione a conta</option>
                {payerAccounts.filter(acc => acc.isActive).map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.bankName}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox de Validação */}
            <label className="flex items-center">
              <input 
                type="checkbox" 
                checked={order.paymentValidated}
                onChange={(e) => handlePaymentValidation(e.target.checked)}
                className="rounded border-neutral-300 text-b3x-lime-600 focus:ring-b3x-lime-500"
              />
              <span className="ml-2 text-sm text-neutral-700">Pagamento Validado</span>
            </label>
            
            {/* Upload de Comprovante */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                id={`payment-proof-${order.id}`}
              />
              <label
                htmlFor={`payment-proof-${order.id}`}
                className="flex items-center space-x-2 px-3 py-2 text-xs border border-neutral-300 rounded-lg cursor-pointer hover:bg-neutral-50 transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>Anexar Comprovante</span>
              </label>
            </div>

            {/* Informações de Pagamento */}
            <div className="bg-neutral-50 rounded-lg p-3 text-xs text-neutral-600">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-3 h-3" />
                <span className="font-medium">
                  {order.paymentType === 'cash' ? 'À Vista' : 'A Prazo'}
                </span>
              </div>
              {order.paymentType === 'installment' && order.paymentDate && (
                <p>Vencimento: {format(order.paymentDate, 'dd/MM/yyyy')}</p>
              )}
            </div>
          </div>
        )}

        {order.status === 'reception' && !relatedLot && (
          <div className="border-t border-neutral-100 pt-3 space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-xs text-neutral-600">
                <span>Peso esperado:</span>
                <div className="font-medium">{order.totalWeight.toLocaleString('pt-BR')} kg</div>
              </div>
              <div className="text-xs text-neutral-600">
                <span>Quantidade:</span>
                <div className="font-medium">{order.quantity} animais</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Melhor espaçamento e responsivo */}
        <div className="flex items-center space-x-2 mt-3">
          {/* Botão Voltar Etapa */}
          {canGoBack && (
            <button
              onClick={handleMoveToPreviousStage}
              className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors flex-shrink-0"
              title="Voltar etapa"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          )}

          {/* Botão Avançar com lógica corrigida */}
          {order.status !== 'confined' && (
            <button
              onClick={handleMoveToNextStage}
              disabled={order.status === 'payment_validation' && !canAdvanceFromPaymentValidation}
              className={`flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-soft hover:shadow-soft-lg ${
                order.status === 'payment_validation' && !canAdvanceFromPaymentValidation
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 hover:from-b3x-lime-600 hover:to-b3x-lime-700'
              }`}
            >
              {order.status === 'reception' && !relatedLot ? (
                <>
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Registrar Recepção</span>
                </>
              ) : order.status === 'reception' && relatedLot ? (
                <>
                  <span>Alocar em Curral</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              ) : (
                <>
                  <span>Avançar</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Reception Form */}
      {showReceptionForm && (
        <Portal>
          <ReceptionForm
            isOpen={showReceptionForm}
            onClose={() => setShowReceptionForm(false)}
            order={order}
          />
        </Portal>
      )}

      {/* Modal de Alocação usando o novo sistema */}
      {showAllocationModal && relatedLot && (
        <Portal>
          <LotAllocationForm
            isOpen={showAllocationModal}
            onClose={() => {
              setShowAllocationModal(false);
              // Avançar para próxima etapa após fechar
              if (relatedLot) {
                movePurchaseOrderToNextStage(order.id);
              }
            }}
            loteId={relatedLot.id}
            quantidadeTotal={relatedLot.entryQuantity}
          />
        </Portal>
      )}

      {/* Edit Form */}
      {showEditForm && (
        <Portal>
          <PurchaseOrderForm
            isOpen={showEditForm}
            onClose={() => setShowEditForm(false)}
            initialData={order}
            isEditing={true}
          />
        </Portal>
      )}
    </>
  );
};