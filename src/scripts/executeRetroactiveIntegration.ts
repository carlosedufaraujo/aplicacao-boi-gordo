import { RetroactiveIntegrationService } from '../services/retroactiveIntegrationService';

/**
 * Script para executar integração retroativa das ordens existentes
 */
async function executeRetroactiveIntegration() {
  console.log('🚀 Iniciando script de integração retroativa...');
  
  try {
    // 1. Gerar relatório inicial
    console.log('\n📊 Gerando relatório inicial...');
    const initialReport = await RetroactiveIntegrationService.generateIntegrationReport();
    
    console.log('📋 Relatório Inicial:');
    console.log(`   Total de ordens: ${initialReport.totalOrders}`);
    console.log(`   Ordens integradas: ${initialReport.integratedOrders}`);
    console.log(`   Ordens parcialmente integradas: ${initialReport.partiallyIntegratedOrders}`);
    console.log(`   Ordens não integradas: ${initialReport.nonIntegratedOrders}`);
    
    if (initialReport.nonIntegratedOrders === 0) {
      console.log('✅ Todas as ordens já estão integradas!');
      return;
    }
    
    // 2. Executar integração retroativa
    console.log('\n🔄 Executando integração retroativa...');
    await RetroactiveIntegrationService.integrateExistingOrders();
    
    // 3. Gerar relatório final
    console.log('\n📊 Gerando relatório final...');
    const finalReport = await RetroactiveIntegrationService.generateIntegrationReport();
    
    console.log('\n📋 Relatório Final:');
    console.log(`   Total de ordens: ${finalReport.totalOrders}`);
    console.log(`   Ordens integradas: ${finalReport.integratedOrders}`);
    console.log(`   Ordens parcialmente integradas: ${finalReport.partiallyIntegratedOrders}`);
    console.log(`   Ordens não integradas: ${finalReport.nonIntegratedOrders}`);
    
    // 4. Mostrar diferenças
    const ordersIntegrated = finalReport.integratedOrders - initialReport.integratedOrders;
    console.log(`\n✅ Resultado: ${ordersIntegrated} ordens foram integradas com sucesso!`);
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeRetroactiveIntegration();
}

export { executeRetroactiveIntegration };
