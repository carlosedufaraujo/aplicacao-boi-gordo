// Script para testar a consistência dos cálculos unificados
import axios from 'axios';
import { calculateAggregateMetrics } from './src/utils/cattlePurchaseCalculations.js';

async function testUnifiedCalculations() {
  try {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZHg4b2hvMDAwMDAxa3B4MGJyZno1c2giLCJlbWFpbCI6ImFkbWluQGJvaWdvcmRvLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzM0MDQwMTM2LCJleHAiOjE3MzQxMjY1MzZ9.VJVsN7gWG_kIkA87Xpxe5AVCuoSX2MQAXRv7dvuYAL8';
    
    // Buscar todas as compras
    const response = await axios.get('http://localhost:3002/api/v1/cattle-purchases', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        limit: 100
      }
    });

    const purchases = response.data.items || [];
    
    console.log('\n===========================================');
    console.log('TESTE DE CONSISTÊNCIA DOS CÁLCULOS');
    console.log('===========================================\n');
    
    // Calcular usando a função centralizada
    const metrics = calculateAggregateMetrics(purchases);
    
    console.log('RESULTADOS DA FUNÇÃO CENTRALIZADA:');
    console.log('=====================================');
    console.log(`Total de Animais: ${metrics.totalAnimals}`);
    console.log(`Animais Atuais: ${metrics.currentAnimals}`);
    console.log(`Animais Mortos: ${metrics.deadAnimals}`);
    console.log(`Taxa de Mortalidade: ${metrics.mortalityRate.toFixed(2)}%`);
    console.log('-------------------------------------');
    console.log(`Peso Total: ${metrics.totalWeight.toLocaleString('pt-BR')} kg`);
    console.log(`Peso de Carcaça Total: ${metrics.totalCarcassWeight.toLocaleString('pt-BR')} kg`);
    console.log(`Total de Arrobas: ${metrics.totalArrobas.toFixed(2)} @`);
    console.log(`Rendimento Médio: ${metrics.averageCarcassYield.toFixed(2)}%`);
    console.log('-------------------------------------');
    console.log(`Valor de Compra: R$ ${metrics.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Custo de Frete: R$ ${metrics.freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Comissões: R$ ${metrics.commissionCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`Outros Custos: R$ ${metrics.otherCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`CUSTO TOTAL: R$ ${metrics.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log('-------------------------------------');
    console.log(`Preço Médio por Arroba: R$ ${metrics.averagePricePerArroba.toFixed(2)}/@`);
    console.log(`Preço Médio por Kg: R$ ${metrics.averagePricePerKg.toFixed(2)}/kg`);
    console.log(`Quebra de Peso Média: ${metrics.weightLossPercentage.toFixed(2)}%`);
    
    console.log('\n===========================================');
    console.log('VALORES QUE DEVEM APARECER NO SISTEMA:');
    console.log('===========================================');
    console.log(`\nDASHBOARD - VISÃO GERAL:`);
    console.log(`  • Animais Ativos: ${metrics.currentAnimals}`);
    console.log(`  • Mortalidade: ${metrics.mortalityRate.toFixed(1)}%`);
    console.log(`  • Quebra de Peso: ${metrics.weightLossPercentage.toFixed(1)}%`);
    console.log(`  • Custo Total: R$ ${metrics.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    console.log(`  • Média R$/@: R$ ${metrics.averagePricePerArroba.toFixed(2)}`);
    
    console.log(`\nVALOR DO REBANHO:`);
    console.log(`  • Total Arrobas: ${metrics.totalArrobas.toFixed(2)} @`);
    console.log(`  • Rendimento Médio: ${metrics.averageCarcassYield.toFixed(1)}%`);
    
    console.log('\n===========================================');
    console.log('Todos esses valores devem ser consistentes');
    console.log('em todas as páginas do sistema!');
    console.log('===========================================\n');
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error.message);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
    }
  }
}

testUnifiedCalculations();