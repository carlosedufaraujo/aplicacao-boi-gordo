import React, { useState } from 'react';
import { X, TrendingUp, Calendar, Printer, AlertCircle, DollarSign, ArrowRight, Clock } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CattleLot } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleSimulationModalProps {
  lot: CattleLot;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleSimulationModal: React.FC<SaleSimulationModalProps> = ({ lot, isOpen, onClose }) => {
  const { 
    calculateLotProfit,
    purchaseOrders,
    loteCurralLinks,
    penRegistrations,
    cattleLots
  } = useAppStore();
  
  // Sempre buscar o lote mais atualizado do store
  const currentLot = cattleLots.find(l => l.id === lot.id) || lot;
  
  // Estado para controlar se os parâmetros estão sincronizados
  const [syncParams, setSyncParams] = useState(true);
  
  // Parâmetros para "Se Vendido Hoje"
  const [salePriceToday, setSalePriceToday] = useState(320);
  const [rcPercentageVendaToday, setRcPercentageVendaToday] = useState(52);
  
  // Parâmetros para "Projeção"
  const [salePriceProjected, setSalePriceProjected] = useState(320);
  const [rcPercentageVendaProjected, setRcPercentageVendaProjected] = useState(52);
  const [projectedDays, setProjectedDays] = useState(30);
  const [gmdEstimated, setGmdEstimated] = useState(1.2);
  const [dailyCost, setDailyCost] = useState(8.5);

  if (!isOpen) return null;

  // Sincronizar parâmetros quando ativado
  React.useEffect(() => {
    if (syncParams) {
      setSalePriceProjected(salePriceToday);
      setRcPercentageVendaProjected(rcPercentageVendaToday);
    }
  }, [syncParams, salePriceToday, rcPercentageVendaToday]);

  // Obter ordem de compra
  const purchaseOrder = purchaseOrders.find(po => po.id === currentLot.purchaseOrderId);
  const rcPercentageCompra = purchaseOrder?.rcPercentage || 50;
  
  // Inicializar RC% de venda baseado na compra
  React.useEffect(() => {
    const initialRc = rcPercentageCompra + 2;
    setRcPercentageVendaToday(initialRc);
    setRcPercentageVendaProjected(initialRc);
  }, [rcPercentageCompra]);
  
  // Obter currais atuais
  const currentPens = loteCurralLinks
    .filter(link => link.loteId === currentLot.id && link.status === 'active')
    .map(link => {
      const pen = penRegistrations.find(p => p.penNumber === link.curralId);
      return {
        ...link,
        penInfo: pen
      };
    });

  const saleSimulation = calculateLotProfit(currentLot.id, salePriceToday);
  
  // Cálculos base - CORRIGIDO: usar a data de entrada do lote
  const daysInConfinement = Math.floor((new Date().getTime() - new Date(currentLot.entryDate).getTime()) / (1000 * 60 * 60 * 24));
  const currentAnimals = currentLot.entryQuantity - currentLot.deaths;
  
  // Dados de chegada (recepção)
  const entryAverageWeight = currentLot.entryWeight / currentLot.entryQuantity;
  
  // Peso atual estimado - CORRIGIDO: considerar GMD e dias em confinamento
  const totalWeightGain = gmdEstimated * currentAnimals * daysInConfinement;
  const currentWeight = currentLot.entryWeight + totalWeightGain;
  const currentAverageWeight = currentWeight / currentAnimals;
  const currentCarcassWeight = currentWeight * (rcPercentageVendaToday / 100);
  const currentArrobas = currentCarcassWeight / 15;
  const weightGain = currentWeight - currentLot.entryWeight;
  
  // Peso projetado
  const projectedWeight = currentWeight + (gmdEstimated * currentAnimals * projectedDays);
  const projectedAverageWeight = projectedWeight / currentAnimals;
  const projectedCarcassWeight = projectedWeight * (rcPercentageVendaProjected / 100);
  const projectedArrobas = projectedCarcassWeight / 15;
  
  // Custos detalhados
  const currentTotalCost = saleSimulation.totalCosts;
  const projectedAdditionalCost = dailyCost * currentAnimals * projectedDays;
  const projectedTotalCost = currentTotalCost + projectedAdditionalCost;
  
  // Cálculos específicos de custos
  const currentFeedingCost = dailyCost * currentAnimals * daysInConfinement;
  const projectedFeedingCost = currentFeedingCost + projectedAdditionalCost;
  const acquisitionCost = saleSimulation.costBreakdown.acquisition;
  const currentCostPerArrobaCalculated = (acquisitionCost + currentFeedingCost) / currentArrobas;
  const projectedCostPerArrobaCalculated = (acquisitionCost + projectedFeedingCost) / projectedArrobas;
  
  // Receitas
  const currentRevenue = currentArrobas * salePriceToday;
  const projectedRevenue = projectedArrobas * salePriceProjected;
  
  // Lucros
  const currentProfit = currentRevenue - currentTotalCost;
  const projectedProfit = projectedRevenue - projectedTotalCost;
  
  // Margens
  const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
  const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;

  const handleExportPrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Simulação de Venda - Lote ${currentLot.lotNumber}</title>
        <style>
          @page {
            size: A4;
            margin: 10mm;
          }
          @media print {
            body { 
              margin: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .container { max-width: 100%; }
          .header {
            background-color: #1a2332;
            color: white;
            padding: 8px;
            margin-bottom: 8px;
            border-radius: 4px;
          }
          .header h1 {
            margin: 0 0 3px 0;
            font-size: 14px;
          }
          .header p {
            margin: 0;
            font-size: 9px;
          }
          h2 {
            font-size: 11px;
            margin: 0 0 6px 0;
            color: #1a2332;
            border-bottom: 1px solid #8bc34a;
            padding-bottom: 2px;
          }
          h3 {
            font-size: 10px;
            margin: 0 0 4px 0;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 8px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .box {
            border: 1px solid #e0e0e0;
            padding: 6px;
            border-radius: 4px;
            background-color: #fafafa;
          }
          .box-lime { background-color: #f7fee7; border-color: #bef264; }
          .box-info { background-color: #e0f2fe; border-color: #7dd3fc; }
          .timeline {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 8px;
            background-color: #f5f5f5;
            border-radius: 4px;
          }
          .timeline-item {
            text-align: center;
            flex: 1;
            font-size: 8px;
          }
          .timeline-item strong { font-size: 9px; }
          .metric {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            font-size: 8px;
          }
          .metric-label { color: #666; }
          .metric-value { font-weight: 500; }
          .success { color: #4caf50; }
          .error { color: #f44336; }
          .warning { color: #ff9800; }
          .params {
            background-color: #f9f9f9;
            padding: 6px;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          .params-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            font-size: 8px;
          }
          .costs-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            font-size: 8px;
          }
          .recommendation {
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            padding: 6px;
            border-radius: 4px;
            font-size: 9px;
          }
          .recommendation.success {
            background-color: #e8f5e9;
            border-color: #4caf50;
          }
          .recommendation.warning {
            background-color: #fff3e0;
            border-color: #ff9800;
          }
          hr {
            margin: 4px 0;
            border: none;
            border-top: 1px solid #ddd;
          }
          .footer {
            margin-top: 8px;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Simulação de Venda - Lote ${currentLot.lotNumber}</h1>
            <p>${currentAnimals} animais • ${daysInConfinement} dias em confinamento • Entrada: ${format(new Date(currentLot.entryDate), 'dd/MM/yyyy')}</p>
          </div>

          <!-- Evolução do Lote -->
          <h2>Evolução do Lote</h2>
          <div class="timeline">
            <div class="timeline-item">
              <strong>Chegada</strong><br>
              ${format(new Date(currentLot.entryDate), 'dd/MM')}<br>
              ${currentLot.entryQuantity} animais<br>
              ${entryAverageWeight.toFixed(1)} kg/animal
            </div>
            <div class="timeline-item">
              <strong>Atual</strong><br>
              ${daysInConfinement} dias<br>
              ${currentAverageWeight.toFixed(1)} kg<br>
              <span class="success">+${(currentAverageWeight - entryAverageWeight).toFixed(1)} kg</span>
            </div>
            <div class="timeline-item">
              <strong>Projeção</strong><br>
              +${projectedDays} dias<br>
              ${projectedAverageWeight.toFixed(1)} kg<br>
              <span style="color: #0ea5e9;">+${(projectedAverageWeight - currentAverageWeight).toFixed(1)} kg</span>
            </div>
          </div>

          <!-- Parâmetros -->
          <div class="params">
            <strong>Parâmetros de Simulação</strong>
            <div class="params-grid">
              <div><span class="metric-label">Custo Diário:</span> R$ ${dailyCost.toFixed(2)}/animal</div>
              <div><span class="metric-label">GMD:</span> ${gmdEstimated} kg/dia</div>
              <div><span class="metric-label">Preço Hoje:</span> R$ ${salePriceToday.toFixed(2)}/@</div>
              <div><span class="metric-label">Preço Projeção:</span> R$ ${salePriceProjected.toFixed(2)}/@</div>
            </div>
          </div>

          <!-- Análise Comparativa -->
          <h2>Análise Comparativa</h2>
          <div class="grid">
            <div class="box box-lime">
              <h3>Se Vendido Hoje</h3>
              <div class="metric"><span>Dias Confinamento:</span><span>${daysInConfinement} dias</span></div>
              <div class="metric"><span>Composição de Custos:</span><span>R$ ${currentTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div class="metric"><span>Custo Alimentação:</span><span>R$ ${currentFeedingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div class="metric"><span>Custo/@:</span><span>R$ ${currentCostPerArrobaCalculated.toFixed(2)}</span></div>
              <hr>
              <div class="metric"><span><strong>Receita:</strong></span><span><strong>R$ ${currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span></div>
              <div class="metric"><span><strong>Lucro:</strong></span><span class="${currentProfit >= 0 ? 'success' : 'error'}"><strong>R$ ${currentProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span></div>
              <div class="metric"><span>Margem:</span><span>${currentMargin.toFixed(1)}% (${(currentMargin / daysInConfinement * 30).toFixed(1)}% a.m.)</span></div>
              <div class="metric"><span>Lucro/Animal:</span><span>R$ ${(currentProfit / currentAnimals).toFixed(2)}</span></div>
            </div>
            
            <div class="box box-info">
              <h3>Projeção (+${projectedDays} dias)</h3>
              <div class="metric"><span>Dias Confinamento:</span><span>${daysInConfinement + projectedDays} dias</span></div>
              <div class="metric"><span>Composição de Custos:</span><span>R$ ${projectedTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div class="metric"><span>Custo Alimentação:</span><span>R$ ${projectedFeedingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
              <div class="metric"><span>Custo/@:</span><span>R$ ${projectedCostPerArrobaCalculated.toFixed(2)}</span></div>
              <hr>
              <div class="metric"><span><strong>Receita:</strong></span><span><strong>R$ ${projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span></div>
              <div class="metric"><span><strong>Lucro:</strong></span><span class="${projectedProfit >= 0 ? 'success' : 'error'}"><strong>R$ ${projectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span></div>
              <div class="metric"><span>Margem:</span><span>${projectedMargin.toFixed(1)}% (${(projectedMargin / (daysInConfinement + projectedDays) * 30).toFixed(1)}% a.m.)</span></div>
              <div class="metric"><span>Lucro/Animal:</span><span>R$ ${(projectedProfit / currentAnimals).toFixed(2)}</span></div>
            </div>
          </div>

          <!-- Composição de Custos e Recomendação -->
          <div class="grid">
            <div class="box">
              <h3>Composição de Custos Detalhada</h3>
              <div class="costs-grid">
                <div class="metric"><span>Aquisição:</span><span>R$ ${saleSimulation.costBreakdown.acquisition.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div class="metric"><span>Alimentação:</span><span>R$ ${saleSimulation.costBreakdown.feed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div class="metric"><span>Sanidade:</span><span>R$ ${saleSimulation.costBreakdown.health.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div class="metric"><span>Frete:</span><span>R$ ${saleSimulation.costBreakdown.freight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div class="metric"><span>Outros:</span><span>R$ ${saleSimulation.costBreakdown.other.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div class="metric"><span><strong>Total:</strong></span><span><strong>R$ ${currentTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span></div>
              </div>
            </div>
            
            <div class="recommendation ${projectedDays === 0 ? '' : projectedProfit - currentProfit > 0 ? 'success' : 'warning'}">
              <h3>Recomendação</h3>
              ${projectedDays === 0 ? `
                <p><strong>Venda imediata</strong></p>
                <p>Lucro: <span class="${currentProfit >= 0 ? 'success' : 'error'}">R$ ${currentProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span> • Margem: ${currentMargin.toFixed(1)}%</p>
              ` : `
                <p class="${projectedProfit - currentProfit > 0 ? 'success' : 'warning'}">
                  <strong>${projectedProfit - currentProfit > 0 ? '✓ Aguardar ' + projectedDays + ' dias' : '⚠ Vender imediatamente'}</strong>
                </p>
                <div style="display: flex; gap: 15px; margin-top: 4px;">
                  <span>Total: <strong class="${projectedProfit - currentProfit >= 0 ? 'success' : 'error'}">${projectedProfit - currentProfit >= 0 ? '+' : ''}R$ ${(projectedProfit - currentProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                  <span>Por Animal: <strong class="${projectedProfit - currentProfit >= 0 ? 'success' : 'error'}">${projectedProfit - currentProfit >= 0 ? '+' : ''}R$ ${((projectedProfit - currentProfit) / currentAnimals).toFixed(2)}</strong></span>
                </div>
              `}
            </div>
          </div>

          <div class="footer">
            Relatório gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })} • CEAC Agropecuária
          </div>
        </div>
      </body>
      </html>
    `;

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
            <h2 className="text-lg font-semibold">Simulação de Venda - Lote {currentLot.lotNumber}</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              {currentAnimals} animais • {daysInConfinement} dias em confinamento • Entrada: {format(new Date(currentLot.entryDate), 'dd/MM/yyyy')}
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
          {/* Seção 1: Evolução do Lote */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
            <h3 className="text-base font-semibold text-b3x-navy-900 mb-4">Evolução do Lote</h3>
            
            {/* Timeline Visual */}
            <div className="flex items-center justify-between mb-6 px-4">
              {/* Data de Chegada */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-2">
                  <Calendar className="w-6 h-6 text-neutral-600" />
                </div>
                <p className="text-xs font-medium text-b3x-navy-900 mb-1">Chegada</p>
                <p className="text-xs text-neutral-600 mb-2">{format(new Date(currentLot.entryDate), 'dd/MM/yyyy')}</p>
                <div className="text-left space-y-1">
                  <p className="text-xs text-neutral-700">
                    <span className="font-medium">Quantidade:</span> {currentLot.entryQuantity} animais
                  </p>
                  <p className="text-xs text-neutral-700">
                    <span className="font-medium">Peso p/ Animal:</span> {entryAverageWeight.toFixed(1)} kg
                  </p>
                </div>
              </div>
              
              {/* Seta de Progresso */}
              <div className="flex-1 mx-4 relative">
                <div className="h-0.5 bg-gradient-to-r from-neutral-200 to-b3x-lime-500"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-b3x-lime-500" />
                </div>
              </div>
              
              {/* Atual */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-b3x-lime-100 rounded-full flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 text-b3x-lime-600" />
                </div>
                <p className="text-xs font-medium text-b3x-navy-900 mb-1">Atual</p>
                <p className="text-xs text-neutral-600 mb-2">{daysInConfinement} dias</p>
                <div className="text-left space-y-1">
                  <p className="text-xs text-neutral-700">
                    <span className="font-medium">Peso Atual:</span> {currentAverageWeight.toFixed(1)} kg
                    <span className="text-success-600 ml-1">(+{(currentAverageWeight - entryAverageWeight).toFixed(1)} kg)</span>
                  </p>
                  <p className="text-xs text-neutral-700">
                    <span className="font-medium">GMD Real:</span> {(weightGain / currentAnimals / daysInConfinement).toFixed(2)} kg/dia
                  </p>
                </div>
              </div>
              
              {/* Seta de Progresso */}
              <div className="flex-1 mx-4 relative">
                <div className="h-0.5 bg-gradient-to-r from-b3x-lime-200 to-info-500"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <TrendingUp className="w-6 h-6 text-info-500" />
                </div>
              </div>
              
              {/* Projeção */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-info-100 rounded-full flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 text-info-600" />
                </div>
                <p className="text-xs font-medium text-b3x-navy-900 mb-1">Projeção</p>
                <p className="text-xs text-neutral-600 mb-2">+{projectedDays} dias</p>
                <div className="text-left space-y-1">
                  {projectedDays > 0 ? (
                    <>
                      <p className="text-xs text-neutral-700">
                        <span className="font-medium">Peso Projeção:</span> {projectedAverageWeight.toFixed(1)} kg
                        <span className="text-info-600 ml-1">(+{(projectedAverageWeight - currentAverageWeight).toFixed(1)} kg)</span>
                      </p>
                      <p className="text-xs text-neutral-700">
                        <span className="font-medium">Total:</span> {(daysInConfinement + projectedDays)} dias
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-neutral-500 italic">Configure dias adicionais</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Parâmetros de Simulação */}
            <div className="mt-4 pt-4 border-t border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-semibold text-b3x-navy-900">Parâmetros de Simulação</h4>
                  {currentPens.length > 0 && (
                    <span className="text-xs text-neutral-500">
                      • Currais: {currentPens.map(p => `${p.curralId} (${p.quantidade} animais)`).join(', ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-1.5 rounded-lg">
                  <svg className="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className={`text-xs font-medium transition-colors ${
                    syncParams ? 'text-b3x-lime-600' : 'text-neutral-600'
                  }`}>Sincronizar</span>
                  <button
                    onClick={() => setSyncParams(!syncParams)}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-b3x-lime-500 focus:ring-offset-2"
                    style={{ backgroundColor: syncParams ? '#8BC34A' : '#E0E0E0' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        syncParams ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            
              {/* Grid de Parâmetros com Layout Vertical */}
              <div className="relative">
                {/* Parâmetros Gerais - Topo */}
                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm mb-6">
                  <div className="bg-neutral-50 px-4 py-2 rounded-t-xl">
                    <p className="text-xs font-semibold text-neutral-700 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Parâmetros Gerais
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          Custo Diário/Animal (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={dailyCost}
                          onChange={(e) => setDailyCost(Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">
                          GMD Estimado (kg/dia)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={gmdEstimated}
                          onChange={(e) => setGmdEstimated(Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid com Se Vendido Hoje e Projeção */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 relative">
                  {/* Parâmetros Se Vendido Hoje */}
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
                    <div className="bg-b3x-lime-50 px-4 py-2 rounded-t-xl">
                      <p className="text-xs font-semibold text-b3x-lime-800 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Se Vendido Hoje (Atual)
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-b3x-lime-800 mb-1">
                            Preço de Venda (R$/@)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={salePriceToday}
                            onChange={(e) => {
                              setSalePriceToday(Number(e.target.value));
                              if (syncParams) setSalePriceProjected(Number(e.target.value));
                            }}
                            className="w-full px-2 py-1.5 text-xs border border-b3x-lime-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-b3x-lime-800 mb-1">
                            R.C.% (Venda)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={rcPercentageVendaToday}
                            onChange={(e) => {
                              setRcPercentageVendaToday(Number(e.target.value));
                              if (syncParams) setRcPercentageVendaProjected(Number(e.target.value));
                            }}
                            className="w-full px-2 py-1.5 text-xs border border-b3x-lime-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white"
                          />
                          <p className="text-[10px] text-b3x-lime-800 mt-0.5 italic">Compra: {rcPercentageCompra}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Seta entre os grids */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center z-10">
                    <div className="bg-gradient-to-r from-b3x-lime-100 to-info-100 rounded-full p-2 shadow-lg">
                      <ArrowRight className="w-5 h-5 text-info-600" />
                    </div>
                  </div>

                  {/* Parâmetros Projeção */}
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm">
                    <div className="bg-info-50 px-4 py-2 rounded-t-xl">
                      <p className="text-xs font-semibold text-info-700 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Projeção
                      </p>
                    </div>
                    
                    <div className="p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-info-600 mb-1">
                            Preço de Venda (R$/@)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={salePriceProjected}
                            onChange={(e) => setSalePriceProjected(Number(e.target.value))}
                            disabled={syncParams}
                            className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent ${
                              syncParams ? 'bg-neutral-100 border-neutral-200' : 'border-info-300 bg-white'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-info-600 mb-1">
                            R.C.% (Venda)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={rcPercentageVendaProjected}
                            onChange={(e) => setRcPercentageVendaProjected(Number(e.target.value))}
                            disabled={syncParams}
                            className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent ${
                              syncParams ? 'bg-neutral-100 border-neutral-200' : 'border-info-300 bg-white'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-info-600 mb-1">
                            Dias Adicionais
                          </label>
                          <input
                            type="number"
                            value={projectedDays}
                            onChange={(e) => setProjectedDays(Number(e.target.value))}
                            className="w-full px-2 py-1.5 text-xs border border-info-300 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Seção 3: Análise Comparativa */}
          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Se Vendido Hoje */}
              <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
                <div className="bg-b3x-lime-50 -m-4 mb-3 px-4 py-2 rounded-t-xl">
                  <h3 className="text-sm font-semibold text-b3x-lime-700 flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Se Vendido Hoje (Atual)
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {/* Custos */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Custos</p>
                    <div className="space-y-1 pl-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Dias de Confinamento:</span>
                        <span className="text-xs font-medium">{daysInConfinement} dias</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Composição de Custos:</span>
                        <span className="text-xs font-medium">R$ {currentTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Custo Total Alimentação:</span>
                        <span className="text-xs font-medium">R$ {currentFeedingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Custo/@ Valor Presente:</span>
                        <span className="text-xs font-medium">R$ {currentCostPerArrobaCalculated.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Receita e Resultado */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold">Receita:</span>
                      <span className="text-xs font-bold text-b3x-navy-900">R$ {currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold">Lucro:</span>
                      <span className={`text-xs font-bold ${currentProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        R$ {currentProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Margem:</span>
                      <span className={`text-xs font-medium ${currentMargin >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {currentMargin.toFixed(1)}% ({(currentMargin / daysInConfinement * 30).toFixed(1)}% a.m.)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Lucro/Animal:</span>
                      <span className={`text-xs font-medium ${currentProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        R$ {(currentProfit / currentAnimals).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seta entre os quadros */}
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center z-10">
                <div className="bg-gradient-to-r from-b3x-navy-100 to-b3x-lime-100 rounded-full p-3 shadow-lg">
                  <ArrowRight className="w-6 h-6 text-b3x-lime-600" />
                </div>
              </div>

              {/* Projeção */}
              <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm">
                <div className="bg-info-50 -m-4 mb-3 px-4 py-2 rounded-t-xl">
                  <h3 className="text-sm font-semibold text-info-700 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                    Projeção (+{projectedDays} dias)
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {/* Custos */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">Custos</p>
                    <div className="space-y-1 pl-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Dias de Confinamento:</span>
                        <span className="text-xs font-medium">{daysInConfinement + projectedDays} dias</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Composição de Custos:</span>
                        <span className="text-xs font-medium">R$ {projectedTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Custo Total Alimentação:</span>
                        <span className="text-xs font-medium">R$ {projectedFeedingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-600">Custo/@ Valor Presente:</span>
                        <span className="text-xs font-medium">R$ {projectedCostPerArrobaCalculated.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Receita e Resultado */}
                  <div className="pt-2 border-t space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold">Receita:</span>
                      <span className="text-xs font-bold text-b3x-navy-900">R$ {projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold">Lucro:</span>
                      <span className={`text-xs font-bold ${projectedProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        R$ {projectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Margem:</span>
                      <span className={`text-xs font-medium ${projectedMargin >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        {projectedMargin.toFixed(1)}% ({(projectedMargin / (daysInConfinement + projectedDays) * 30).toFixed(1)}% a.m.)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Lucro/Animal:</span>
                      <span className={`text-xs font-medium ${projectedProfit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                        R$ {(projectedProfit / currentAnimals).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Composição de Custos e Recomendação */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm relative">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Composição de Custos */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold text-b3x-navy-900 mb-3 flex items-center">
                  <DollarSign className="w-3.5 h-3.5 mr-1.5 text-b3x-navy-600" />
                  Composição de Custos Detalhada
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-600">Aquisição:</span>
                    <span className="text-xs font-medium">R$ {saleSimulation.costBreakdown.acquisition.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-600">Alimentação:</span>
                    <span className="text-xs font-medium">R$ {saleSimulation.costBreakdown.feed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-600">Sanidade:</span>
                    <span className="text-xs font-medium">R$ {saleSimulation.costBreakdown.health.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-600">Frete:</span>
                    <span className="text-xs font-medium">R$ {saleSimulation.costBreakdown.freight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-neutral-600">Outros:</span>
                    <span className="text-xs font-medium">R$ {saleSimulation.costBreakdown.other.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center col-span-2 md:col-span-1 pt-2 mt-2 border-t border-neutral-200">
                    <span className="text-xs font-semibold">Total:</span>
                    <span className="text-xs font-bold text-b3x-navy-900">R$ {currentTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Separador Vertical */}
              <div className="hidden lg:block absolute left-[66.666%] top-4 bottom-4 w-px bg-neutral-200"></div>

              {/* Recomendação */}
              <div className="lg:pl-4 lg:border-l-0 border-t lg:border-t-0 border-neutral-200 pt-4 lg:pt-0">
                <h3 className="text-sm font-semibold text-b3x-navy-900 mb-2 flex items-center">
                  <AlertCircle className={`w-3.5 h-3.5 mr-1.5 ${projectedDays === 0 ? 'text-neutral-600' : projectedProfit - currentProfit > 0 ? 'text-success-600' : 'text-warning-600'}`} />
                  Recomendação
                </h3>
                
                <div className={`p-3 rounded-lg ${projectedDays === 0 ? 'bg-neutral-50' : projectedProfit - currentProfit > 0 ? 'bg-success-50' : 'bg-warning-50'}`}>
                  {projectedDays === 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-neutral-700">
                        Venda imediata • Lucro: <span className={`font-bold ${currentProfit >= 0 ? 'text-success-700' : 'text-error-700'}`}>
                          R$ {currentProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </p>
                      <p className="text-xs text-neutral-600">
                        Margem: {currentMargin.toFixed(1)}%
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium mb-2">
                        {projectedProfit - currentProfit > 0 ? (
                          <span className="text-success-700">
                            ✓ Aguardar {projectedDays} dias
                          </span>
                        ) : (
                          <span className="text-warning-700">
                            ⚠ Vender imediatamente
                          </span>
                        )}
                      </p>
                      
                      {/* Diferenças compactas */}
                      <div className="bg-white/50 p-2 rounded border border-neutral-100">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-neutral-600">Total:</span>
                            <span className={`ml-1 font-bold ${projectedProfit - currentProfit >= 0 ? 'text-success-700' : 'text-error-700'}`}>
                              {projectedProfit - currentProfit >= 0 ? '+' : ''}R$ {(projectedProfit - currentProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-600">Por Animal:</span>
                            <span className={`ml-1 font-bold ${projectedProfit - currentProfit >= 0 ? 'text-success-700' : 'text-error-700'}`}>
                              {projectedProfit - currentProfit >= 0 ? '+' : ''}R$ {((projectedProfit - currentProfit) / currentAnimals).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Fechar
              </button>
              
              <button 
                onClick={handleExportPrint}
                className="px-4 py-1.5 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
              >
                <Printer className="w-3 h-3" />
                <span>Exportar Relatório</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 