import React, { useState } from 'react';
import { X, Calendar, MapPin, User, DollarSign, Home, Truck, Users, TrendingUp, Package, Percent, TrendingDown, Printer, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CattleLot } from '../../types';
import { format } from 'date-fns';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Portal } from '../Common/Portal';
import { NonCashExpenseModal } from './NonCashExpenseModal';

interface LotDetailModalProps {
  lot: CattleLot;
  isOpen: boolean;
  onClose: () => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({ lot, isOpen, onClose }) => {
  const { 
    purchaseOrders, 
    partners, 
    loteCurralLinks,
    penStatuses,
    calculateLotCostsByCategory,
    calculateLotProfit,
    deleteCattleLot
  } = useAppStore();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNonCashExpenseModal, setShowNonCashExpenseModal] = useState(false);
  
  if (!isOpen) return null;

  const purchaseOrder = purchaseOrders.find(po => po.id === lot.purchaseOrderId);
  const vendor = purchaseOrder ? partners.find(p => p.id === purchaseOrder.vendorId) : null;
  const broker = purchaseOrder?.brokerId ? partners.find(p => p.id === purchaseOrder.brokerId) : null;
  const transportCompany = lot.transportCompany ? partners.find(p => p.isTransporter && p.name === lot.transportCompany) : null;
  
  // Obter alocações do lote usando loteCurralLinks
  const lotLinks = loteCurralLinks ? loteCurralLinks.filter(link => link.loteId === lot.id && link.status === 'active') : [];
  
  // Obter currais onde o lote está alocado
  const lotPens = lotLinks.map(link => {
    const pen = penStatuses.find(p => p.penNumber === link.curralId);
    return {
      ...link,
      penInfo: pen
    };
  });
  
  const costs = calculateLotCostsByCategory(lot.id);
  const saleSimulation = calculateLotProfit(lot.id, 320); // Preço fixo para cálculos
  
  const entryDate = lot.entryDate instanceof Date ? lot.entryDate : new Date(lot.entryDate);
  const daysInConfinement = Math.floor((new Date().getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeight = lot.entryWeight + (lot.estimatedGmd * lot.entryQuantity * daysInConfinement);

  // Calcular quebra de peso e diferença de animais
  const calculateWeightLoss = () => {
    if (!purchaseOrder) return { kg: 0, percentage: 0 };
    const lossKg = purchaseOrder.totalWeight - lot.entryWeight;
    const lossPercentage = purchaseOrder.totalWeight > 0 ? (lossKg / purchaseOrder.totalWeight) * 100 : 0;
    return { kg: lossKg, percentage: lossPercentage };
  };

  const weightLoss = calculateWeightLoss();
  const quantityDifference = purchaseOrder ? purchaseOrder.quantity - lot.entryQuantity : 0;
  const hasMortalityInTransport = lot.quantityDifferenceReason === 'Morte Transporte';

  // Calcular arrobas com R.C.%
  const rcPercentage = purchaseOrder?.rcPercentage || 50;
  const estimatedCarcassWeight = purchaseOrder ? purchaseOrder.totalWeight * (rcPercentage / 100) : 0;
  const estimatedArrobas = estimatedCarcassWeight / 15;
  const actualCarcassWeight = currentWeight * (rcPercentage / 100);
  const actualArrobas = actualCarcassWeight / 15;

  const handleDeleteLot = () => {
    deleteCattleLot(lot.id);
    onClose();
  };

  const handleExportPrint = () => {
    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ficha do Lote ${lot.lotNumber}</title>
        <style>
          @media print {
            @page { margin: 15mm; }
            body { 
              margin: 0; 
              font-family: Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .page { 
              padding: 0;
              page-break-after: avoid;
            }
            h1 { font-size: 20px; margin-bottom: 10px; }
            h2 { font-size: 16px; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            h3 { font-size: 14px; margin-top: 10px; margin-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
            .card { border: 1px solid #ddd; padding: 8px; border-radius: 4px; page-break-inside: avoid; }
            .card-title { font-size: 11px; color: #666; margin-bottom: 2px; }
            .card-value { font-size: 14px; font-weight: bold; }
            .card-subtitle { font-size: 10px; color: #888; }
            .info-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
            .info-label { color: #666; }
            .info-value { font-weight: 500; }
            .section { margin-bottom: 20px; page-break-inside: avoid; }
            .cost-bar { display: flex; align-items: center; margin: 5px 0; }
            .cost-label { width: 80px; font-size: 11px; }
            .cost-progress { flex: 1; height: 8px; background: #eee; margin: 0 10px; position: relative; }
            .cost-fill { height: 100%; background: #4CAF50; }
            .cost-percent { font-size: 11px; font-weight: bold; }
          }
          @media screen {
            body { margin: 20px; font-family: Arial, sans-serif; }
            .page { max-width: 800px; margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>Ficha do Lote ${lot.lotNumber}</h1>
          <p style="font-size: 12px; color: #666;">${lot.entryQuantity} animais • ${format(lot.entryDate, 'dd/MM/yyyy')}</p>
          
          <h2>Resumo do Lote</h2>
          <div class="grid grid-3">
            <div class="card">
              <div class="card-title">Dias em Confinamento</div>
              <div class="card-value">${daysInConfinement}</div>
            </div>
            <div class="card">
              <div class="card-title">Quantidade Recepção</div>
              <div class="card-value">${lot.entryQuantity} animais</div>
              <div class="card-subtitle">Mortalidade: ${lot.deaths || 0}</div>
            </div>
            <div class="card">
              <div class="card-title">Peso Recepção</div>
              <div class="card-value">${(lot.entryWeight / lot.entryQuantity).toFixed(1)} kg/animal</div>
              <div class="card-subtitle">Quebra: ${weightLoss.percentage.toFixed(1)}%</div>
            </div>
            <div class="card">
              <div class="card-title">Currais</div>
              <div class="card-value">${lotPens.length > 0 ? lotPens.map(p => p.curralId).join(', ') : 'N/A'}</div>
            </div>
            <div class="card">
              <div class="card-title">Custo/@</div>
              <div class="card-value">R$ ${(costs.total / actualArrobas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="card">
              <div class="card-title">Quebra de Peso (Compra)</div>
              <div class="card-value">${weightLoss.percentage.toFixed(1)}%</div>
              <div class="card-subtitle">${Math.abs(weightLoss.kg / lot.entryQuantity).toFixed(1)} kg/animal</div>
            </div>
          </div>
          
          <div class="grid">
            <div class="section">
              <h2>Dados da Compra</h2>
              <div class="info-row">
                <span class="info-label">Ordem:</span>
                <span class="info-value">${purchaseOrder?.code || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Data:</span>
                <span class="info-value">${purchaseOrder ? format(purchaseOrder.date, 'dd/MM/yyyy') : '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Local:</span>
                <span class="info-value">${purchaseOrder?.city}, ${purchaseOrder?.state}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Vendedor:</span>
                <span class="info-value">${vendor?.name || '-'}</span>
              </div>
              ${broker ? `
              <div class="info-row">
                <span class="info-label">Corretor:</span>
                <span class="info-value">${broker.name}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Quantidade:</span>
                <span class="info-value">${purchaseOrder?.quantity || '-'} animais</span>
              </div>
              <div class="info-row">
                <span class="info-label">Peso Total:</span>
                <span class="info-value">${purchaseOrder?.totalWeight.toLocaleString('pt-BR') || '-'} kg</span>
              </div>
              <div class="info-row">
                <span class="info-label">R.C. %:</span>
                <span class="info-value">${rcPercentage}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Arrobas:</span>
                <span class="info-value">${estimatedArrobas.toFixed(2)} @</span>
              </div>
              <div class="info-row" style="font-weight: bold; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;">
                <span class="info-label">Total:</span>
                <span class="info-value">R$ ${purchaseOrder ? 
                  (estimatedArrobas * purchaseOrder.pricePerArroba + 
                   purchaseOrder.commission + 
                   (purchaseOrder.taxes || 0) + 
                   purchaseOrder.otherCosts
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
                  : '-'}</span>
              </div>
            </div>
            
            <div class="section">
              <h2>Dados da Recepção</h2>
              <div class="info-row">
                <span class="info-label">Data:</span>
                <span class="info-value">${format(lot.entryDate, 'dd/MM/yyyy')}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Qtd Recebida:</span>
                <span class="info-value">${lot.entryQuantity} animais</span>
              </div>
              <div class="info-row">
                <span class="info-label">Peso Total:</span>
                <span class="info-value">${lot.entryWeight.toLocaleString('pt-BR')} kg</span>
              </div>
              <div class="info-row">
                <span class="info-label">Peso Médio:</span>
                <span class="info-value">${(lot.entryWeight / lot.entryQuantity).toFixed(1)} kg/animal</span>
              </div>
              <div class="info-row">
                <span class="info-label">GMD (Estimado):</span>
                <span class="info-value">${lot.estimatedGmd} kg/dia</span>
              </div>
              ${(lot.freightKm > 0 || transportCompany) ? `
              <h3 style="margin-top: 15px;">Informações de Frete</h3>
              ${costs.frete > 0 ? `
              <div class="info-row">
                <span class="info-label">Tipo:</span>
                <span class="info-value">${transportCompany ? 'Frete Terceiro' : 'Frete Próprio'}</span>
              </div>` : ''}
              <div class="info-row">
                <span class="info-label">Transportadora:</span>
                <span class="info-value">${transportCompany?.name || 'Não informada'}</span>
              </div>
              ${lot.freightKm > 0 ? `
              <div class="info-row">
                <span class="info-label">Distância:</span>
                <span class="info-value">${lot.freightKm.toLocaleString('pt-BR')} km</span>
              </div>
              <div class="info-row">
                <span class="info-label">Valor/km:</span>
                <span class="info-value">R$ ${lot.freightCostPerKm.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Frete:</span>
                <span class="info-value">R$ ${(lot.freightKm * lot.freightCostPerKm).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>` : ''}
              ` : ''}
            </div>
          </div>
          
          <h2>Resumo Financeiro</h2>
          <div class="grid">
            <div>
              <h3>Valores</h3>
              <div class="info-row">
                <span class="info-label">Custo Total:</span>
                <span class="info-value">R$ ${costs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Por Animal:</span>
                <span class="info-value">R$ ${(costs.total / lot.entryQuantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Arrobas (R.C. ${rcPercentage}%):</span>
                <span class="info-value">${actualArrobas.toFixed(2)} @</span>
              </div>
              <div class="info-row">
                <span class="info-label">Custo/@:</span>
                <span class="info-value">R$ ${(costs.total / actualArrobas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div>
              <h3>Composição de Custos</h3>
              <div class="cost-bar">
                <span class="cost-label">Aquisição</span>
                <div class="cost-progress">
                  <div class="cost-fill" style="width: ${costs.total > 0 ? (costs.aquisicao / costs.total) * 100 : 0}%; background: #8BC34A;"></div>
                </div>
                <span class="cost-percent">${costs.total > 0 ? ((costs.aquisicao / costs.total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div class="cost-bar">
                <span class="cost-label">Alimentação</span>
                <div class="cost-progress">
                  <div class="cost-fill" style="width: ${costs.total > 0 ? (costs.alimentacao / costs.total) * 100 : 0}%; background: #4CAF50;"></div>
                </div>
                <span class="cost-percent">${costs.total > 0 ? ((costs.alimentacao / costs.total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div class="cost-bar">
                <span class="cost-label">Sanidade</span>
                <div class="cost-progress">
                  <div class="cost-fill" style="width: ${costs.total > 0 ? (costs.sanidade / costs.total) * 100 : 0}%; background: #2196F3;"></div>
                </div>
                <span class="cost-percent">${costs.total > 0 ? ((costs.sanidade / costs.total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div class="cost-bar">
                <span class="cost-label">Frete</span>
                <div class="cost-progress">
                  <div class="cost-fill" style="width: ${costs.total > 0 ? (costs.frete / costs.total) * 100 : 0}%; background: #FF9800;"></div>
                </div>
                <span class="cost-percent">${costs.total > 0 ? ((costs.frete / costs.total) * 100).toFixed(0) : 0}%</span>
              </div>
              <div class="cost-bar">
                <span class="cost-label">Outros</span>
                <div class="cost-progress">
                  <div class="cost-fill" style="width: ${costs.total > 0 ? ((costs.operacional + costs.outros) / costs.total) * 100 : 0}%; background: #9E9E9E;"></div>
                </div>
                <span class="cost-percent">${costs.total > 0 ? (((costs.operacional + costs.outros) / costs.total) * 100).toFixed(0) : 0}%</span>
              </div>
            </div>
          </div>
          
          ${lotPens.length > 0 ? `
          <h2>Alocações em Currais</h2>
          <div class="grid grid-3">
            ${lotPens.map((link) => `
            <div class="card">
              <div class="card-title">Curral ${link.curralId}</div>
              <div class="card-value">${link.quantidade} animais</div>
              <div class="card-subtitle">% do Lote: ${link.percentualDoLote.toFixed(1)}%</div>
              <div class="card-subtitle">Ocupação: ${link.penInfo ? `${link.penInfo.currentAnimals}/${link.penInfo.capacity}` : 'N/A'}</div>
              <div class="card-subtitle">Data: ${format(link.dataAlocacao, 'dd/MM/yyyy')}</div>
            </div>
            `).join('')}
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-soft-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-b3x-navy-900 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Ficha do Lote {lot.lotNumber}</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              {lot.entryQuantity} animais • {format(lot.entryDate, 'dd/MM/yyyy')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Seção 1: Resumo do Lote */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3">Resumo do Lote</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Calendar className="w-3 h-3 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">Dias em Confinamento</span>
                </div>
                <div className="text-lg font-bold text-b3x-navy-900">{daysInConfinement}</div>
              </div>
              
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Users className="w-3 h-3 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">Quantidade Recepção</span>
                </div>
                <div className="text-lg font-bold text-b3x-navy-900">{lot.entryQuantity} animais</div>
                <div className="text-xs text-neutral-500">
                  Mortalidade: {lot.deaths || 0}
                </div>
              </div>
              
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Package className="w-3 h-3 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">Peso Recepção</span>
                </div>
                <div className="text-lg font-bold text-b3x-navy-900">
                  {(lot.entryWeight / lot.entryQuantity).toFixed(1)} kg/animal
                </div>
                <div className="text-xs text-neutral-500">
                  Quebra: {weightLoss.percentage.toFixed(1)}%
                </div>
              </div>
              
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <Home className="w-3 h-3 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">Currais</span>
                </div>
                <div className="text-lg font-bold text-b3x-navy-900">
                  {lotPens.length > 0 ? lotPens.map(p => p.curralId).join(', ') : 'N/A'}
                </div>
              </div>
              
              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <DollarSign className="w-3 h-3 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">Custo/@</span>
                </div>
                <div className="text-lg font-bold text-b3x-navy-900">
                  R$ {(costs.total / actualArrobas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="bg-neutral-50 p-3 rounded-lg">
                <div className="flex items-center mb-1">
                  <TrendingDown className="w-3 h-3 text-neutral-500 mr-1" />
                  <span className="text-xs text-neutral-600">Quebra de Peso (Compra)</span>
                </div>
                <div className="text-lg font-bold text-b3x-navy-900">
                  {weightLoss.percentage.toFixed(1)}%
                </div>
                <div className="text-xs text-neutral-500">
                  {Math.abs(weightLoss.kg / lot.entryQuantity).toFixed(1)} kg/animal
                </div>
              </div>
            </div>
          </div>

          {/* Seção 2: Dados da Compra e Recepção */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Dados da Compra */}
            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-b3x-navy-600" />
                Dados da Compra
              </h3>
              
              <div className="space-y-3">
                {/* Informações Gerais em grid compacto */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Ordem:</span>
                    <span className="text-sm font-medium">{purchaseOrder?.code || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Data:</span>
                    <span className="text-sm font-medium">{purchaseOrder ? format(purchaseOrder.date, 'dd/MM/yyyy') : '-'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Local:</span>
                    <span className="text-sm font-medium">{purchaseOrder?.city}, {purchaseOrder?.state}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Vendedor:</span>
                    <span className="text-sm font-medium truncate ml-2" title={vendor?.name || '-'}>
                      {vendor?.name || '-'}
                    </span>
                  </div>
                  {broker && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Corretor:</span>
                      <span className="text-sm font-medium truncate ml-2" title={broker.name}>
                        {broker.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Dados dos Animais */}
                <div className="border-t border-neutral-100 pt-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Quantidade:</span>
                      <span className="text-sm font-medium">{purchaseOrder?.quantity || '-'} animais</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Peso Total:</span>
                      <span className="text-sm font-medium">{purchaseOrder?.totalWeight.toLocaleString('pt-BR') || '-'} kg</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">R.C. %:</span>
                      <span className="text-sm font-medium">{rcPercentage}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Arrobas:</span>
                      <span className="text-sm font-medium">{estimatedArrobas.toFixed(2)} @</span>
                    </div>
                  </div>
                </div>

                {/* Valores e Custos */}
                <div className="border-t border-neutral-100 pt-2">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Preço/@:</span>
                      <span className="text-sm font-medium">R$ {purchaseOrder?.pricePerArroba.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Comissão:</span>
                      <span className="text-sm font-medium">R$ {purchaseOrder?.commission.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {purchaseOrder && purchaseOrder.taxes && purchaseOrder.taxes > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Impostos:</span>
                        <span className="text-sm font-medium">R$ {purchaseOrder.taxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    {purchaseOrder && purchaseOrder.otherCosts > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">Outros:</span>
                        <span className="text-sm font-medium">R$ {purchaseOrder.otherCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Total */}
                <div className="border-t border-neutral-100 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-neutral-600">Total:</span>
                    <span className="text-sm font-bold text-b3x-navy-900">
                      R$ {purchaseOrder ? 
                        (estimatedArrobas * purchaseOrder.pricePerArroba + 
                         purchaseOrder.commission + 
                         (purchaseOrder.taxes || 0) + 
                         purchaseOrder.otherCosts
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) 
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dados da Recepção */}
            <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
              <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-b3x-navy-600" />
                Dados da Recepção
              </h3>
              
              <div className="space-y-3">
                {/* Informações principais em grid compacto */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Data:</span>
                    <span className="text-sm font-medium">{format(lot.entryDate, 'dd/MM/yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Qtd Recebida:</span>
                    <span className="text-sm font-medium">{lot.entryQuantity} animais</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Peso Total:</span>
                    <span className="text-sm font-medium">{lot.entryWeight.toLocaleString('pt-BR')} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Peso Médio:</span>
                    <span className="text-sm font-medium">{(lot.entryWeight / lot.entryQuantity).toFixed(1)} kg/animal</span>
                  </div>
                  <div className="flex justify-between items-center col-span-2">
                    <span className="text-sm text-neutral-600">GMD (Estimado):</span>
                    <span className="text-sm font-medium">{lot.estimatedGmd} kg/dia</span>
                  </div>
                </div>
                
                {/* 🆕 NOVO: Informações de Frete */}
                {(lot.freightKm > 0 || lot.freightCostPerKm > 0 || transportCompany) && (
                  <>
                    <div className="border-t border-neutral-100 pt-2">
                      <h4 className="text-sm font-medium text-b3x-navy-900 mb-2 flex items-center">
                        <Truck className="w-3 h-3 mr-1 text-b3x-navy-600" />
                        Informações de Frete
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {/* Verificar se é frete próprio através dos custos ou de algum indicador */}
                        {costs.frete > 0 && (
                          <div className="flex justify-between items-center col-span-2">
                            <span className="text-sm text-neutral-600">Tipo:</span>
                            <span className="text-sm font-medium">
                              {transportCompany ? 'Frete Terceiro' : 'Frete Próprio'}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center col-span-2">
                          <span className="text-sm text-neutral-600">Transportadora:</span>
                          <span className="text-sm font-medium truncate ml-2" title={transportCompany?.name || 'Não informada'}>
                            {transportCompany?.name || 'Não informada'}
                          </span>
                        </div>
                        {lot.freightKm > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-neutral-600">Distância:</span>
                              <span className="text-sm font-medium">{lot.freightKm.toLocaleString('pt-BR')} km</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-neutral-600">Valor/km:</span>
                              <span className="text-sm font-medium">R$ {lot.freightCostPerKm.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center col-span-2">
                              <span className="text-sm text-neutral-600">Total Frete:</span>
                              <span className="text-sm font-medium">R$ {(lot.freightKm * lot.freightCostPerKm).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Se for frete próprio, mostrar aviso sobre pagamento no abate */}
                      {!transportCompany && costs.frete > 0 && (
                        <div className="mt-2 p-2 bg-info-50 border border-info-200 rounded-lg">
                          <p className="text-xs text-info-700 flex items-start">
                            <Truck className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span>
                              <strong>Frete Próprio:</strong> O pagamento será realizado no dia seguinte ao abate dos animais.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Diferença de Quantidade */}
                {quantityDifference !== 0 && (
                  <div className="border-t border-neutral-100 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Diferença de Animais:</span>
                      <span className="text-sm font-medium text-error-600">
                        {quantityDifference} animais
                        {hasMortalityInTransport && " (Morte no Transporte)"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção 3: Resumo Financeiro */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Resumo Financeiro
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Valores principais */}
              <div>
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-2">Valores</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Custo Total:</span>
                    <span className="text-sm font-medium">R$ {costs.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Por Animal:</span>
                    <span className="text-sm font-medium">R$ {(costs.total / lot.entryQuantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Arrobas (R.C. {rcPercentage}%):</span>
                    <span className="text-sm font-medium">{actualArrobas.toFixed(2)} @</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Custo/@:</span>
                    <span className="text-sm font-medium">R$ {(costs.total / actualArrobas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              
              {/* Composição de Custos */}
              <div>
                <h4 className="text-sm font-medium text-b3x-navy-900 mb-2">Composição de Custos</h4>
                <div className="space-y-2">
                  {/* Aquisição */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-xs text-neutral-600 w-20">Aquisição</span>
                      <div className="flex-1 mx-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-b3x-lime-500" style={{ width: `${costs.total > 0 ? (costs.aquisicao / costs.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{costs.total > 0 ? ((costs.aquisicao / costs.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                  
                  {/* Alimentação */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-xs text-neutral-600 w-20">Alimentação</span>
                      <div className="flex-1 mx-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-success-500" style={{ width: `${costs.total > 0 ? (costs.alimentacao / costs.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{costs.total > 0 ? ((costs.alimentacao / costs.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                  
                  {/* Sanidade */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-xs text-neutral-600 w-20">Sanidade</span>
                      <div className="flex-1 mx-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-info-500" style={{ width: `${costs.total > 0 ? (costs.sanidade / costs.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{costs.total > 0 ? ((costs.sanidade / costs.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                  
                  {/* Frete */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-xs text-neutral-600 w-20">Frete</span>
                      <div className="flex-1 mx-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-warning-500" style={{ width: `${costs.total > 0 ? (costs.frete / costs.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{costs.total > 0 ? ((costs.frete / costs.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                  
                  {/* Outros */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <span className="text-xs text-neutral-600 w-20">Outros</span>
                      <div className="flex-1 mx-2 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div className="h-full bg-neutral-500" style={{ width: `${costs.total > 0 ? ((costs.operacional + costs.outros) / costs.total) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{costs.total > 0 ? (((costs.operacional + costs.outros) / costs.total) * 100).toFixed(0) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Alocações em Currais */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-3 flex items-center">
              <Home className="w-4 h-4 mr-2 text-b3x-navy-600" />
              Alocações em Currais
            </h3>
            
            {lotPens.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {lotPens.map((link) => (
                  <div key={link.id} className="bg-neutral-50 rounded-lg p-2 border border-neutral-200">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-b3x-navy-900 text-sm">Curral {link.curralId}</h4>
                      <span className="text-xs font-medium text-neutral-700">{link.quantidade} animais</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-600">% do Lote:</span>
                        <span className="font-medium">{link.percentualDoLote.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-600">Ocupação:</span>
                        <span className="font-medium">
                          {link.penInfo ? `${link.penInfo.currentAnimals}/${link.penInfo.capacity}` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-neutral-600">Data Alocação:</span>
                        <span className="font-medium">{format(link.dataAlocacao, 'dd/MM/yyyy')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-neutral-50 rounded-lg p-3 text-center">
                <p className="text-sm text-neutral-600">Este lote ainda não foi alocado em nenhum curral.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-neutral-200">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors text-sm"
            >
              Excluir Lote
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setShowNonCashExpenseModal(true)}
                className="px-3 py-1.5 text-sm text-warning-600 border border-warning-300 rounded-lg hover:bg-warning-50 transition-colors flex items-center"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                Lançamento Não-Caixa
              </button>
              <button
                onClick={handleExportPrint}
                className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors flex items-center"
              >
                <Printer className="w-4 h-4 mr-1" />
                Exportar/Imprimir
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <Portal>
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={handleDeleteLot}
            title="Excluir Lote"
            message={`Tem certeza que deseja excluir o lote ${lot.lotNumber}? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            type="danger"
          />
        </Portal>
      )}
      
      {/* Modal de Lançamentos Não-Caixa */}
      {showNonCashExpenseModal && (
        <NonCashExpenseModal
          isOpen={showNonCashExpenseModal}
          onClose={() => setShowNonCashExpenseModal(false)}
          lot={lot}
        />
      )}
    </div>
  );
};