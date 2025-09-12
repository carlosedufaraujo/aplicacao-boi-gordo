const axios = require('axios');

const API_URL = 'http://localhost:3002/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZHg4b2hvMDAwMDAxa3B4MGJyZno1c2giLCJlbWFpbCI6ImFkbWluQGJvaWdvcmRvLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzM0MDQwMTM2LCJleHAiOjE3MzQxMjY1MzZ9.VJVsN7gWG_kIkA87Xpxe5AVCuoSX2MQAXRv7dvuYAL8';

async function cleanUnusedPartners() {
  try {
    console.log('Buscando parceiros sem vínculos...\n');
    
    // Buscar todos os parceiros
    const response = await axios.get(`${API_URL}/partners`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, limit: 100 }
    });
    
    const partners = response.data.data.items || [];
    console.log(`Total de parceiros encontrados: ${partners.length}`);
    
    // Buscar todas as compras para identificar parceiros usados
    const purchasesResponse = await axios.get(`${API_URL}/cattle-purchases`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, limit: 100 }
    });
    
    const purchases = purchasesResponse.data.items || [];
    const usedVendorIds = new Set(purchases.map(p => p.vendorId).filter(id => id));
    const usedBrokerIds = new Set(purchases.map(p => p.brokerId).filter(id => id));
    const usedFreightIds = new Set(purchases.map(p => p.freightCompanyId).filter(id => id));
    
    console.log(`\nParceiros com vínculos:`);
    console.log(`  - Fornecedores usados: ${usedVendorIds.size}`);
    console.log(`  - Corretores usados: ${usedBrokerIds.size}`);
    console.log(`  - Transportadoras usadas: ${usedFreightIds.size}`);
    
    // Identificar parceiros sem vínculos
    const unusedPartners = partners.filter(partner => {
      return !usedVendorIds.has(partner.id) && 
             !usedBrokerIds.has(partner.id) && 
             !usedFreightIds.has(partner.id);
    });
    
    // Agrupar parceiros sem vínculos por nome para identificar duplicados
    const unusedByName = {};
    unusedPartners.forEach(partner => {
      const name = partner.name.trim().toUpperCase();
      if (!unusedByName[name]) {
        unusedByName[name] = [];
      }
      unusedByName[name].push(partner);
    });
    
    console.log(`\n======================================`);
    console.log(`PARCEIROS SEM VÍNCULOS: ${unusedPartners.length}`);
    console.log(`======================================\n`);
    
    // Listar duplicados entre os sem vínculos
    const duplicatesToDelete = [];
    for (const [name, group] of Object.entries(unusedByName)) {
      if (group.length > 1) {
        console.log(`\nDuplicado sem vínculos: ${name}`);
        console.log(`  Total: ${group.length} registros`);
        
        // Manter o que tem mais informações
        const toKeep = group.find(p => p.cpfCnpj && p.cpfCnpj.length > 10) || group[0];
        const toDelete = group.filter(p => p.id !== toKeep.id);
        
        console.log(`  ✅ Mantendo: ID ${toKeep.id} (CPF: ${toKeep.cpfCnpj || 'N/A'})`);
        toDelete.forEach(p => {
          console.log(`  🗑️  Marcado para exclusão: ID ${p.id} (CPF: ${p.cpfCnpj || 'N/A'})`);
          duplicatesToDelete.push(p);
        });
      }
    }
    
    // Adicionar parceiros únicos sem CPF válido (possivelmente cadastros de teste)
    const testPartners = unusedPartners.filter(p => {
      const cpf = p.cpfCnpj || '';
      return cpf.startsWith('999999') || cpf.startsWith('123456') || cpf.length < 11;
    });
    
    if (testPartners.length > 0) {
      console.log(`\n🧪 Parceiros de teste identificados (CPF inválido):`);
      testPartners.forEach(p => {
        if (!duplicatesToDelete.find(d => d.id === p.id)) {
          console.log(`  - ${p.name} (CPF: ${p.cpfCnpj || 'N/A'})`);
          duplicatesToDelete.push(p);
        }
      });
    }
    
    console.log(`\n======================================`);
    console.log(`TOTAL A REMOVER: ${duplicatesToDelete.length}`);
    console.log(`======================================\n`);
    
    if (duplicatesToDelete.length === 0) {
      console.log('Nenhum parceiro para remover!');
      return;
    }
    
    // Remover parceiros
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const partner of duplicatesToDelete) {
      try {
        await axios.delete(`${API_URL}/partners/${partner.id}`, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        
        deletedCount++;
        console.log(`✅ Removido: ${partner.name} (ID: ${partner.id})`);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Erro ao remover ${partner.name}: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log(`\n======================================`);
    console.log(`RESUMO DA LIMPEZA:`);
    console.log(`  Parceiros removidos: ${deletedCount}`);
    console.log(`  Erros: ${errorCount}`);
    console.log(`  Parceiros mantidos: ${partners.length - deletedCount}`);
    console.log(`======================================\n`);
    
  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Detalhes:', error.response.data);
    }
  }
}

cleanUnusedPartners();