import React, { useState } from 'react';
import { X, TrendingUp, Calendar, Printer, AlertCircle, DollarSign, ArrowRight, Clock } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { CattlePurchase } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SaleSimulationModalProps {
  lot: CattlePurchase;
  isOpen: boolean;
  onClose: () => void;
}

export const SaleSimulationModal: React.FC<SaleSimulationModalProps> = ({ lot, isOpen, onClose }) => {
  const { 
    calculateLotProfit,
    cattlePurchases,
    loteCurralLinks,
    penRegistrations,
    cattlePurchases
  } = useAppStore();
  
  // Sempre buscar o lote mais atualizado do store
  const currentLot = cattlePurchases.find(l => l.id === lot.id) || lot;
  
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
  const purchaseOrder = cattlePurchases.find(po => po.id === currentLot.purchaseId);
  const rcPercentageCompra = purchaseOrder?.rcPercentage || 50;
  
  // Inicializar RC% de venda baseado na compra
  React.useEffect(() => {
    const initialRc = rcPercentageCompra + 2;
    setRcPercentageVendaToday(initialRc);
    setRcPercentageVendaProjected(initialRc);
  }, [rcPercentageCompra]);
  
  // Obter currais atuais
  const currentPens = (loteCurralLinks || [])
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
  const currentWeightGain = currentWeight - currentLot.entryWeight;
  
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
          @media print {
            @page { 
              size: A4;
              margin: 15mm;
            }
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
            h1 { font-size: 20px; margin-bottom: 10px; color: #1a2332; }
            h2 { font-size: 16px; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; color: #1a2332; }
            h3 { font-size: 14px; margin-top: 10px; margin-bottom: 5px; color: #1a2332; }
            .header-info { font-size: 12px; color: #666; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
            .grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
            .card { 
              border: 1px solid #ddd; 
              padding: 10px; 
              border-radius: 6px; 
              page-break-inside: avoid;
              background-color: #fafafa;
            }
            .card-lime { background-color: #f7fee7; border-color: #bef264; }
            .card-info { background-color: #e0f2fe; border-color: #7dd3fc; }
            .card-neutral { background-color: #f9f9f9; border-color: #e5e7eb; }
            .card-title { font-size: 11px; color: #666; margin-bottom: 4px; font-currentWeight: normal; }
            .card-value { font-size: 16px; font-currentWeight: bold; color: #1a2332; }
            .card-subtitle { font-size: 10px; color: #888; margin-top: 2px; }
            .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
            .info-row:last-child { border-bottom: none; }
            .info-label { color: #666; }
            .info-value { font-currentWeight: 500; color: #1a2332; }
            .section { margin-bottom: 20px; page-break-inside: avoid; }
            .timeline { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin: 20px 0; 
              padding: 15px; 
              background-color: #f5f5f5; 
              border-radius: 8px;
            }
            .timeline-item { 
              text-align: center; 
              flex: 1;
              position: relative;
            }
            .timeline-item:not(:last-child)::after {
              content: '→';
              position: absolute;
              right: -20px;
              top: 50%;
              transform: translateY(-50%);
              font-size: 20px;
              color: #8bc34a;
            }
            .timeline-icon {
              width: 40px;
              height: 40px;
              margin: 0 auto 8px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            }
            .timeline-title { font-size: 12px; font-currentWeight: bold; margin-bottom: 4px; }
            .timeline-info { font-size: 11px; color: #666; }
            .success { color: #4caf50; }
            .error { color: #f44336; }
            .warning { color: #ff9800; }
            .info { color: #2196f3; }
            .recommendation {
              background-color: #e3f2fd;
              border: 2px solid #2196f3;
              padding: 15px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .recommendation.success {
              background-color: #e8f5e9;
              border-color: #4caf50;
            }
            .recommendation.warning {
              background-color: #fff3e0;
              border-color: #ff9800;
            }
            .cost-composition {
              margin-top: 10px;
            }
            .cost-bar {
              display: flex;
              align-items: center;
              margin: 8px 0;
            }
            .cost-label {
              width: 100px;
              font-size: 11px;
              color: #666;
            }
            .cost-progress {
              flex: 1;
              height: 10px;
              background: #eee;
              margin: 0 10px;
              position: relative;
              border-radius: 5px;
            }
            .cost-fill {
              height: 100%;
              border-radius: 5px;
            }
            .cost-value {
              font-size: 11px;
              font-currentWeight: bold;
              min-width: 100px;
              text-align: right;
            }
            .comparison-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .comparison-table th {
              background-color: #f5f5f5;
              padding: 8px;
              text-align: left;
              font-size: 12px;
              font-currentWeight: bold;
              border: 1px solid #ddd;
            }
            .comparison-table td {
              padding: 6px 8px;
              font-size: 11px;
              border: 1px solid #ddd;
            }
            .comparison-table .metric-name {
              font-currentWeight: 500;
              color: #666;
            }
            .comparison-table .value {
              text-align: right;
              font-currentWeight: bold;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
          }
          @media screen {
            body { margin: 20px; font-family: Arial, sans-serif; }
            .page { max-width: 800px; margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <h1>Simulação de Venda - Lote ${currentLot.lotNumber}</h1>
          <p class="header-info">
            ${currentAnimals} animais • ${daysInConfinement} dias em confinamento • 
            Entrada: ${format(new Date(currentLot.entryDate), 'dd/MM/yyyy')} • 
            ${currentPens.length > 0 ? `Currais: ${currentPens.map(p => p.curralId).join(', ')}` : ''}
          </p>
          
          <h2>Evolução do Lote</h2>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-icon" style="background-color: #e5e7eb;">📅</div>
              <div class="timeline-title">Chegada</div>
              <div class="timeline-info">
                ${format(new Date(currentLot.entryDate), 'dd/MM/yyyy')}<br>
                ${currentLot.entryQuantity} animais<br>
                ${entryAverageWeight.toFixed(1)} kg/animal
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon" style="background-color: #bef264;">⏰</div>
              <div class="timeline-title">Atual</div>
              <div class="timeline-info">
                ${daysInConfinement} dias<br>
                ${currentAverageWeight.toFixed(1)} kg/animal<br>
                <span class="success">+${(currentAverageWeight - entryAverageWeight).toFixed(1)} kg</span><br>
                GMD Real: ${(currentWeightGain / currentAnimals / daysInConfinement).toFixed(2)} kg/dia
              </div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon" style="background-color: #7dd3fc;">📈</div>
              <div class="timeline-title">Projeção</div>
              <div class="timeline-info">
                +${projectedDays} dias<br>
                ${projectedAverageWeight.toFixed(1)} kg/animal<br>
                <span class="info">+${(projectedAverageWeight - currentAverageWeight).toFixed(1)} kg</span><br>
                Total: ${daysInConfinement + projectedDays} dias
              </div>
            </div>
          </div>

          <h2>Parâmetros de Simulação</h2>
          <div class="grid grid-4">
            <div class="card card-neutral">
              <div class="card-title">Custo Diário/Animal</div>
              <div class="card-value">R$ ${dailyCost.toFixed(2)}</div>
            </div>
            <div class="card card-neutral">
              <div class="card-title">GMD Estimado</div>
              <div class="card-value">${gmdEstimated} kg/dia</div>
            </div>
            <div class="card card-neutral">
              <div class="card-title">R.C.% Compra</div>
              <div class="card-value">${rcPercentageCompra}%</div>
            </div>
            <div class="card card-neutral">
              <div class="card-title">Preço Base</div>
              <div class="card-value">R$ ${salePriceToday.toFixed(2)}/@</div>
            </div>
          </div>

          <h2>Análise Comparativa</h2>
          <table class="comparison-table">
            <thead>
              <tr>
                <th style="width: 40%;">Métrica</th>
                <th style="width: 30%; text-align: center; background-color: #f7fee7;">Se Vendido Hoje</th>
                <th style="width: 30%; text-align: center; background-color: #e0f2fe;">Projeção (+${projectedDays} dias)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="metric-name">Dias de Confinamento</td>
                <td class="value">${daysInConfinement} dias</td>
                <td class="value">${daysInConfinement + projectedDays} dias</td>
              </tr>
              <tr>
                <td class="metric-name">Peso Total</td>
                <td class="value">${currentWeight.toLocaleString('pt-BR')} kg</td>
                <td class="value">${projectedWeight.toLocaleString('pt-BR')} kg</td>
              </tr>
              <tr>
                <td class="metric-name">Arrobas (R.C. ${rcPercentageVendaToday}%/${rcPercentageVendaProjected}%)</td>
                <td class="value">${currentArrobas.toFixed(2)} @</td>
                <td class="value">${projectedArrobas.toFixed(2)} @</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td class="metric-name"><strong>CUSTOS</strong></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="metric-name">Composição de Custos</td>
                <td class="value">R$ ${currentTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="value">R$ ${projectedTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric-name">Custo Alimentação</td>
                <td class="value">R$ ${currentFeedingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="value">R$ ${projectedFeedingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric-name">Custo/@</td>
                <td class="value">R$ ${currentCostPerArrobaCalculated.toFixed(2)}</td>
                <td class="value">R$ ${projectedCostPerArrobaCalculated.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f5f5f5;">
                <td class="metric-name"><strong>RECEITA E RESULTADO</strong></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td class="metric-name">Preço de Venda</td>
                <td class="value">R$ ${salePriceToday.toFixed(2)}/@</td>
                <td class="value">R$ ${salePriceProjected.toFixed(2)}/@</td>
              </tr>
              <tr>
                <td class="metric-name">Receita Total</td>
                <td class="value">R$ ${currentRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td class="value">R$ ${projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td class="metric-name"><strong>Lucro</strong></td>
                <td class="value ${currentProfit >= 0 ? 'success' : 'error'}">
                  <strong>R$ ${currentProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
                <td class="value ${projectedProfit >= 0 ? 'success' : 'error'}">
                  <strong>R$ ${projectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </td>
              </tr>
              <tr>
                <td class="metric-name">Margem</td>
                <td class="value">${currentMargin.toFixed(1)}% (${(currentMargin / daysInConfinement * 30).toFixed(1)}% a.m.)</td>
                <td class="value">${projectedMargin.toFixed(1)}% (${(projectedMargin / (daysInConfinement + projectedDays) * 30).toFixed(1)}% a.m.)</td>
              </tr>
              <tr>
                <td class="metric-name">Lucro/Animal</td>
                <td class="value">R$ ${(currentProfit / currentAnimals).toFixed(2)}</td>
                <td class="value">R$ ${(projectedProfit / currentAnimals).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <h2>Composição de Custos Detalhada</h2>
          <div class="cost-composition">
            <div class="cost-bar">
              <span class="cost-label">Aquisição</span>
              <div class="cost-progress">
                <div class="cost-fill" style="width: ${currentTotalCost > 0 ? (saleSimulation.costBreakdown.acquisition / currentTotalCost) * 100 : 0}%; background: #8BC34A;"></div>
              </div>
              <span class="cost-value">R$ ${saleSimulation.costBreakdown.acquisition.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${currentTotalCost > 0 ? ((saleSimulation.costBreakdown.acquisition / currentTotalCost) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div class="cost-bar">
              <span class="cost-label">Alimentação</span>
              <div class="cost-progress">
                <div class="cost-fill" style="width: ${currentTotalCost > 0 ? (saleSimulation.costBreakdown.feed / currentTotalCost) * 100 : 0}%; background: #4CAF50;"></div>
              </div>
              <span class="cost-value">R$ ${saleSimulation.costBreakdown.feed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${currentTotalCost > 0 ? ((saleSimulation.costBreakdown.feed / currentTotalCost) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div class="cost-bar">
              <span class="cost-label">Sanidade</span>
              <div class="cost-progress">
                <div class="cost-fill" style="width: ${currentTotalCost > 0 ? (saleSimulation.costBreakdown.health / currentTotalCost) * 100 : 0}%; background: #2196F3;"></div>
              </div>
              <span class="cost-value">R$ ${saleSimulation.costBreakdown.health.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${currentTotalCost > 0 ? ((saleSimulation.costBreakdown.health / currentTotalCost) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div class="cost-bar">
              <span class="cost-label">Frete</span>
              <div class="cost-progress">
                <div class="cost-fill" style="width: ${currentTotalCost > 0 ? (saleSimulation.costBreakdown.freight / currentTotalCost) * 100 : 0}%; background: #FF9800;"></div>
              </div>
              <span class="cost-value">R$ ${saleSimulation.costBreakdown.freight.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${currentTotalCost > 0 ? ((saleSimulation.costBreakdown.freight / currentTotalCost) * 100).toFixed(0) : 0}%)</span>
            </div>
            <div class="cost-bar">
              <span class="cost-label">Outros</span>
              <div class="cost-progress">
                <div class="cost-fill" style="width: ${currentTotalCost > 0 ? (saleSimulation.costBreakdown.other / currentTotalCost) * 100 : 0}%; background: #9E9E9E;"></div>
              </div>
              <span class="cost-value">R$ ${saleSimulation.costBreakdown.other.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${currentTotalCost > 0 ? ((saleSimulation.costBreakdown.other / currentTotalCost) * 100).toFixed(0) : 0}%)</span>
            </div>
          </div>

          <div class="recommendation ${projectedDays === 0 ? '' : projectedProfit - currentProfit > 0 ? 'success' : 'warning'}">
            <h3 style="margin-top: 0;">Recomendação</h3>
            ${projectedDays === 0 ? `
              <p style="margin: 10px 0;"><strong>Análise para venda imediata</strong></p>
              <div class="grid">
                <div>
                  <div class="info-row">
                    <span class="info-label">Lucro estimado:</span>
                    <span class="info-value ${currentProfit >= 0 ? 'success' : 'error'}">R$ ${currentProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Margem de lucro:</span>
                    <span class="info-value">${currentMargin.toFixed(1)}%</span>
                  </div>
                </div>
                <div>
                  <div class="info-row">
                    <span class="info-label">Lucro por animal:</span>
                    <span class="info-value">R$ ${(currentProfit / currentAnimals).toFixed(2)}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Custo/@ atual:</span>
                    <span class="info-value">R$ ${currentCostPerArrobaCalculated.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ` : `
              <p style="margin: 10px 0;">
                <strong>
                  ${projectedProfit - currentProfit > 0 
                    ? `✓ Recomenda-se aguardar ${projectedDays} dias para maximizar o lucro`
                    : `⚠ Recomenda-se a venda imediata`
                  }
                </strong>
              </p>
              <div class="grid">
                <div>
                  <h4 style="font-size: 12px; margin-bottom: 8px;">Análise do período adicional:</h4>
                  <div class="info-row">
                    <span class="info-label">Custo adicional:</span>
                    <span class="info-value error">R$ ${projectedAdditionalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Receita adicional:</span>
                    <span class="info-value success">R$ ${(projectedRevenue - currentRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="info-row" style="border-top: 1px solid #ddd; padding-top: 8px; margin-top: 8px;">
                    <span class="info-label"><strong>Diferença Total:</strong></span>
                    <span class="info-value ${projectedProfit - currentProfit >= 0 ? 'success' : 'error'}">
                      <strong>${projectedProfit - currentProfit >= 0 ? '+' : ''}R$ ${(projectedProfit - currentProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>
                </div>
                <div>
                  <h4 style="font-size: 12px; margin-bottom: 8px;">Impacto por animal:</h4>
                  <div class="info-row">
                    <span class="info-label">Lucro adicional/animal:</span>
                    <span class="info-value ${projectedProfit - currentProfit >= 0 ? 'success' : 'error'}">
                      ${projectedProfit - currentProfit >= 0 ? '+' : ''}R$ ${((projectedProfit - currentProfit) / currentAnimals).toFixed(2)}
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Peso adicional/animal:</span>
                    <span class="info-value">+${(projectedAverageWeight - currentAverageWeight).toFixed(1)} kg</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Arrobas adicionais:</span>
                    <span class="info-value">+${(projectedArrobas - currentArrobas).toFixed(2)} @</span>
                  </div>
                </div>
              </div>
              ${projectedProfit - currentProfit < 0 ? `
                <p style="margin-top: 10px; font-size: 11px; color: #ff9800; font-style: italic;">
                  * O custo adicional de ${projectedDays} dias supera o ganho de peso esperado
                </p>
              ` : ''}
            `}
          </div>

          <div class="footer">
            <p>Relatório gerado em ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })} - Sistema de Gestão CEAC Agropecuária</p>
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
                    <span className="font-medium">GMD Real:</span> {(currentWeightGain / currentAnimals / daysInConfinement).toFixed(2)} kg/dia
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