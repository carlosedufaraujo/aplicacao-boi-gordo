// Script para verificar o cálculo do KPI Média R$/@
import axios from 'axios';

async function verifyKPICalculation() {
  try {
    // Buscar token do localStorage (você precisa estar logado)
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
    console.log('VERIFICAÇÃO DO CÁLCULO KPI - MÉDIA R$/@');
    console.log('===========================================\n');
    
    let totalCost = 0;
    let totalArrobas = 0;
    let purchaseCount = 0;
    
    console.log('DETALHAMENTO POR LOTE:');
    console.log('-'.repeat(100));
    
    purchases.forEach((purchase, index) => {
      // Pular compras pendentes
      if (purchase.status === 'PENDING') {
        console.log(`\nLote ${index + 1}: ${purchase.lotCode} - PENDENTE (não incluído no cálculo)`);
        return;
      }
      
      purchaseCount++;
      
      // Calcular custos totais do lote
      const purchaseValue = purchase.purchaseValue || purchase.totalValue || 0;
      const freightCost = purchase.freightCost || 0;
      const commission = purchase.commission || 0;
      const otherCosts = purchase.otherCosts || purchase.operationalCost || 0;
      
      const lotTotalCost = purchaseValue + freightCost + commission + otherCosts;
      
      // Calcular arrobas
      const weight = purchase.purchaseWeight || purchase.totalWeight || 0;
      const carcassYield = purchase.carcassYield || 50;
      const carcassWeight = (weight * carcassYield) / 100;
      const arrobas = carcassWeight / 15;
      
      // Calcular preço por arroba do lote
      const pricePerArroba = arrobas > 0 ? lotTotalCost / arrobas : 0;
      
      totalCost += lotTotalCost;
      totalArrobas += arrobas;
      
      console.log(`\nLote ${purchaseCount}: ${purchase.lotCode}`);
      console.log(`  Fornecedor: ${purchase.vendor?.name || purchase.vendorName || 'Direto'}`);
      console.log(`  Status: ${purchase.status}`);
      console.log(`  ---`);
      console.log(`  Peso Total: ${weight.toLocaleString('pt-BR')} kg`);
      console.log(`  Rendimento Carcaça: ${carcassYield}%`);
      console.log(`  Peso Carcaça: ${carcassWeight.toLocaleString('pt-BR')} kg`);
      console.log(`  Total Arrobas: ${arrobas.toFixed(2)} @`);
      console.log(`  ---`);
      console.log(`  Valor Compra: R$ ${purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  Frete: R$ ${freightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  Comissão: R$ ${commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  Outros Custos: R$ ${otherCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  CUSTO TOTAL LOTE: R$ ${lotTotalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  ---`);
      console.log(`  Preço por Arroba do Lote: R$ ${pricePerArroba.toFixed(2)}/@`);
    });
    
    const averagePricePerArroba = totalArrobas > 0 ? totalCost / totalArrobas : 0;
    
    console.log('\n' + '='.repeat(100));
    console.log('RESUMO FINAL:');
    console.log('='.repeat(100));
    console.log(`\nTotal de Lotes Confirmados: ${purchaseCount}`);
    console.log(`Total de Lotes Pendentes: ${purchases.filter(p => p.status === 'PENDING').length}`);
    console.log('\nTOTAIS GERAIS:');
    console.log(`  Custo Total (todos os custos inclusos): R$ ${totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`  Total de Arrobas: ${totalArrobas.toFixed(2)} @`);
    console.log('\nCÁLCULO FINAL:');
    console.log(`  Média R$/@ = Custo Total ÷ Total Arrobas`);
    console.log(`  Média R$/@ = R$ ${totalCost.toFixed(2)} ÷ ${totalArrobas.toFixed(2)} @`);
    console.log(`  MÉDIA R$/@: R$ ${averagePricePerArroba.toFixed(2)}`);
    console.log('\n' + '='.repeat(100));
    console.log('Este valor deve aparecer no card KPI "Média R$/@" do dashboard');
    console.log('='.repeat(100) + '\n');
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error.message);
    if (error.response) {
      console.error('Resposta do servidor:', error.response.data);
    }
  }
}

verifyKPICalculation();