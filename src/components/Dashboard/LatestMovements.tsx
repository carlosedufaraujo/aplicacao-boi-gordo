import React from 'react';
import { ShoppingCart, DollarSign, Calendar, MapPin, User, TrendingUp, ArrowRight, Eye } from 'lucide-react';

import { useCattlePurchasesApi } from '../../hooks/api/useCattlePurchasesApi';
import { useCattlePurchasesApi } from '../../hooks/api/useCattlePurchasesApi';
import { usePartnersApi } from '../../hooks/api/usePartnersApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const LatestMovements: React.FC = () => {
  // Hooks da Nova Arquitetura API
  const { cattlePurchases } = useCattlePurchasesApi();
  const { cattlePurchases } = useCattlePurchasesApi();
  const { partners } = usePartnersApi();

  // Combinar ordens de compra em uma lista de movimentações
  const movements = cattlePurchases
    .slice(-10)
    .map(order => {
      const vendor = partners.find(p => p.id === order.vendorId);
      const broker = order.brokerId ? partners.find(p => p.id === order.brokerId) : null;
      const totalValue = (order.totalWeight / 15) * order.pricePerArroba + order.commission + order.otherCosts;
      
      return {
        id: order.id,
        type: 'purchase' as const,
        date: new Date(order.purchaseDate),
        title: `Ordem de Compra ${order.lotCode}`,
        description: `${order.animalCount} animais • ${order.location}`,
        vendor: vendor?.name || 'Vendedor não encontrado',
        broker: broker?.name,
        value: totalValue,
        status: order.status,
        details: {
          currentQuantity: order.animalCount,
          currentWeight: order.totalWeight,
          pricePerArroba: order.pricePerArroba,
          city: order.location,
          state: order.location
        }
      };
    })
    // Ordenar por data (mais recentes primeiro)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    // Pegar apenas os 8 mais recentes
    .slice(0, 8);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-neutral-100 text-neutral-700';
      case 'PAYMENT_VALIDATING':
        return 'bg-warning-100 text-warning-700';
      case 'RECEPTION':
        return 'bg-info-100 text-info-700';
      case 'CONFINED':
        return 'bg-success-100 text-success-700';
      case 'CANCELLED':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'PAYMENT_VALIDATING':
        return 'Validando Pagamento';
      case 'RECEPTION':
        return 'Em Recepção';
      case 'CONFINED':
        return 'Confinado';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const navigateToDetails = (movement: any) => {
    if (movement.type === 'purchase') {
      setCurrentPage('pipeline');
    } else {
      setCurrentPage('lots');
    }
  };

  if (movements.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-medium text-b3x-navy-900 mb-2">Nenhuma movimentação registrada</h3>
        <p className="text-neutral-600 text-sm mb-4">
          Quando você criar ordens de compra ou registrar vendas, elas aparecerão aqui.
        </p>
        <button
          onClick={() => setCurrentPage('pipeline')}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-b3x-lime-500 text-b3x-navy-900 font-medium rounded-lg hover:bg-b3x-lime-600 transition-colors text-sm"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Criar Primeira Ordem</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => (
        <div
          key={`${movement.type}-${movement.id}`}
          className="bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200/50 p-4 hover:shadow-md hover:border-b3x-lime-200/50 transition-all duration-200 cursor-pointer"
          onClick={() => navigateToDetails(movement)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {/* Ícone do tipo de movimentação */}
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                movement.type === 'purchase' 
                  ? 'bg-b3x-lime-100 text-b3x-lime-600' 
                  : 'bg-success-100 text-success-600'
              }`}>
                {movement.type === 'purchase' ? (
                  <ShoppingCart className="w-4 h-4" />
                ) : (
                  <DollarSign className="w-4 h-4" />
                )}
              </div>

              {/* Informações principais */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-b3x-navy-900 text-sm truncate">
                    {movement.title}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movement.status)}`}>
                    {getStatusLabel(movement.status)}
                  </span>
                </div>

                <p className="text-sm text-neutral-600 mb-2 truncate">
                  {movement.description}
                </p>

                {/* Detalhes em grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <span className="text-neutral-600 truncate">
                      {format(movement.date, 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                    <span className="text-neutral-600 truncate">
                      {movement.vendor}
                    </span>
                  </div>

                  {movement.type === 'purchase' && movement.details.city && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      <span className="text-neutral-600 truncate">
                        {movement.details.city}/{movement.details.state}
                      </span>
                    </div>
                  )}

                  {movement.type === 'sale' && movement.details.profit !== undefined && (
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      <span className={`truncate font-medium ${
                        movement.details.profit >= 0 ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {movement.details.margin?.toFixed(1)}% margem
                      </span>
                    </div>
                  )}
                </div>

                {/* Broker se existir */}
                {movement.broker && (
                  <div className="mt-2 text-xs text-neutral-500">
                    Corretor: {movement.broker}
                  </div>
                )}
              </div>
            </div>

            {/* Valor e ação */}
            <div className="text-right flex-shrink-0 ml-3">
              <div className={`text-lg font-bold mb-1 ${
                movement.type === 'purchase' ? 'text-b3x-lime-600' : 'text-success-600'
              }`}>
                R$ {movement.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              
              <div className="flex items-center text-xs text-neutral-500">
                <span className="mr-1">Ver detalhes</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Botão para ver todas as movimentações */}
      <div className="text-center pt-3 border-t border-neutral-200/50">
        <button
          onClick={() => setCurrentPage('pipeline')}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-b3x-lime-600 hover:text-b3x-lime-700 hover:bg-b3x-lime-50 rounded-lg transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Ver todas as movimentações</span>
        </button>
      </div>
    </div>
  );
};