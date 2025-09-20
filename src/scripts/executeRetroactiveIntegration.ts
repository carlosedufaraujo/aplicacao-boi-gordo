import { RetroactiveIntegrationService } from '../services/retroactiveIntegrationService';

/**
 * Script para executar integração retroativa das ordens existentes
 */
async function executeRetroactiveIntegration() {
  
  try {
    // 1. Gerar relatório inicial
    const initialReport = await RetroactiveIntegrationService.generateIntegrationReport();
    if (initialReport.nonIntegratedOrders === 0) {
      return;
    }
    
    // 2. Executar integração retroativa
    await RetroactiveIntegrationService.integrateExistingOrders();
    
    // 3. Gerar relatório final
    const finalReport = await RetroactiveIntegrationService.generateIntegrationReport();
    // 4. Mostrar diferenças
    const ordersIntegrated = finalReport.integratedOrders - initialReport.integratedOrders;
    
  } catch (_error) {
    console.error('❌ Erro durante a execução:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  executeRetroactiveIntegration();
}

export { executeRetroactiveIntegration };
