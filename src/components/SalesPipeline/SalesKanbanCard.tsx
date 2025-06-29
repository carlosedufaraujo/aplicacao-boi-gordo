import React, { useState } from 'react';
import { Calendar, MapPin, User, DollarSign, ArrowRight, Truck, Scale, FileText, CheckCircle, Clock, Eye, Home, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppStore } from '../../stores/useAppStore';
import { ShipmentForm } from './ShipmentForm';
import { SlaughterForm } from './SlaughterForm';
import { ReconciliationForm } from './ReconciliationForm';
import { Portal } from '../Common/Portal';

interface SalesKanbanCardProps {
  item: any;
  stage: string;
}

export const SalesKanbanCard: React.FC<SalesKanbanCardProps> = ({ item, stage }) => {
  const { partners } = useAppStore();
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [showSlaughterForm, setShowSlaughterForm] = useState(false);
  const [showReconciliationForm, setShowReconciliationForm] = useState(false);
  
  // Get slaughterhouse name
  const getSlaughterhouseName = (id: string) => {
    const slaughterhouse = partners.find(p => p.id === id);
    return slaughterhouse?.name || 'Frigorífico não encontrado';
  };
  
  // Handle advancing to next stage
  const handleMoveToNextStage = () => {
    if (stage === 'next_slaughter') {
      setShowShipmentForm(true);
    } else if (stage === 'shipped') {
      setShowSlaughterForm(true);
    } else if (stage === 'slaughtered') {
      setShowReconciliationForm(true);
    }
  };
  
  // Handle viewing details
  const handleViewDetails = () => {
    // In a real implementation, this would open a detailed view
    console.log('View details for', item.id);
  };

  // Determine if this is a pen-based or lot-based card
  const isPenBased = item.isPen || item.penNumber;

  return (
    <>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-neutral-200/50 shadow-soft hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200 p-3 sm:p-4 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-b3x-navy-900 text-sm sm:text-base flex items-center">
              {isPenBased ? (
                <>
                  <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-info-600" />
                  Curral {item.penNumber || item.id}
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-success-600" />
                  Lote {item.lotNumber}
                </>
              )}
            </h4>
            
            {/* Stage-specific date information */}
            <div className="flex items-center text-xs sm:text-sm text-neutral-600 mt-1">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              {stage === 'next_slaughter' && (
                <span className="truncate">Escala: {format(item.scheduledDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
              {stage === 'shipped' && (
                <span className="truncate">Embarque: {format(item.shipDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
              {stage === 'slaughtered' && (
                <span className="truncate">Abate: {format(item.slaughterDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
              {stage === 'reconciled' && (
                <span className="truncate">Pagamento: {format(item.paymentDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              )}
            </div>
          </div>
          
          {/* Quantity badge */}
          <span className="text-xs sm:text-sm font-medium text-success-700 bg-gradient-to-r from-success-100 to-success-50 px-2 py-1 rounded-full border border-success-200 flex-shrink-0 self-start">
            {item.quantity} animais
          </span>
        </div>

        {/* Stage-specific content - responsivo */}
        <div className="space-y-2 mb-3">
          {/* Next Slaughter Stage */}
          {stage === 'next_slaughter' && (
            <>
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Peso est.: {(item.estimatedWeight / item.quantity).toFixed(0)} kg/animal</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Frigorífico: {item.slaughterhouse || 'A definir'}</span>
              </div>
              
              {isPenBased && item.lotsInPen && (
                <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                  <span className="truncate">Lotes: {item.lotsInPen.length} lote(s)</span>
                </div>
              )}
            </>
          )}
          
          {/* Shipped Stage */}
          {stage === 'shipped' && (
            <>
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Peso saída: {(item.exitWeight / item.quantity).toFixed(0)} kg/animal</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Transp.: {item.transportCompany}</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Destino: {item.slaughterhouse}</span>
              </div>
            </>
          )}
          
          {/* Slaughtered Stage */}
          {stage === 'slaughtered' && (
            <>
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Peso abate: {(item.slaughterWeight / item.quantity).toFixed(0)} kg/animal</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">NF: {item.invoiceNumber}</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Vencimento: {format(item.paymentDueDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </>
          )}
          
          {/* Reconciled Stage */}
          {stage === 'reconciled' && (
            <>
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <Scale className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-neutral-400 flex-shrink-0" />
                <span className="truncate">Peso abate: {(item.slaughterWeight / item.quantity).toFixed(0)} kg/animal</span>
              </div>
              
              <div className="flex items-center text-xs sm:text-sm text-neutral-600">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-success-500 flex-shrink-0" />
                <span className="truncate">Conciliado em: {format(item.reconciliationDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </>
          )}
        </div>

        {/* Financial Summary - responsivo */}
        <div className="bg-neutral-50/80 rounded-lg p-2 sm:p-3 mb-3">
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-neutral-600">Valor {stage === 'next_slaughter' || stage === 'shipped' ? 'Estimado' : 'Bruto'}:</span>
            <span className="font-medium text-b3x-navy-900">
              R$ {((stage === 'next_slaughter' || stage === 'shipped' ? item.estimatedValue : item.grossValue) || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          
          {(stage === 'slaughtered' || stage === 'reconciled') && (
            <div className="flex justify-between items-center text-xs sm:text-sm mt-1">
              <span className="text-neutral-600">Valor Líquido:</span>
              <span className={`font-medium ${item.netValue >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                R$ {(item.netValue || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons - responsivo */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleViewDetails}
            className="flex items-center justify-center space-x-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300 transition-colors flex-shrink-0"
            title="Ver detalhes"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Detalhes</span>
          </button>

          {/* Stage-specific action button */}
          {stage !== 'reconciled' && (
            <button
              onClick={handleMoveToNextStage}
              className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 py-1.5 sm:py-2 px-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 shadow-soft hover:shadow-soft-lg bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 hover:from-b3x-lime-600 hover:to-b3x-lime-700"
            >
              {stage === 'next_slaughter' && (
                <>
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Registrar Embarque</span>
                </>
              )}
              {stage === 'shipped' && (
                <>
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Registrar Abate</span>
                </>
              )}
              {stage === 'slaughtered' && (
                <>
                  <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Conciliar Pagamento</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Forms */}
      {showShipmentForm && (
        <Portal>
          <ShipmentForm
            isOpen={showShipmentForm}
            onClose={() => setShowShipmentForm(false)}
            lot={item}
          />
        </Portal>
      )}
      
      {showSlaughterForm && (
        <Portal>
          <SlaughterForm
            isOpen={showSlaughterForm}
            onClose={() => setShowSlaughterForm(false)}
            lot={item}
          />
        </Portal>
      )}
      
      {showReconciliationForm && (
        <Portal>
          <ReconciliationForm
            isOpen={showReconciliationForm}
            onClose={() => setShowReconciliationForm(false)}
            sale={item}
          />
        </Portal>
      )}
    </>
  );
};