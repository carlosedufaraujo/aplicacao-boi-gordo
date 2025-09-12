const axios = require('axios');

const API_URL = 'http://localhost:3002/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZHg4b2hvMDAwMDAxa3B4MGJyZno1c2giLCJlbWFpbCI6ImFkbWluQGJvaWdvcmRvLmNvbSIsIm5hbWUiOiJBZG1pbmlzdHJhZG9yIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzM0MDQwMTM2LCJleHAiOjE3MzQxMjY1MzZ9.VJVsN7gWG_kIkA87Xpxe5AVCuoSX2MQAXRv7dvuYAL8';

async function cleanDuplicatePartners() {
  try {
    console.log('Buscando todos os parceiros...');
    
    // Buscar todos os parceiros
    const response = await axios.get(`${API_URL}/partners`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      params: { page: 1, limit: 100 }
    });
    
    const partners = response.data.data.items || [];
    console.log(`Total de parceiros encontrados: ${partners.length}`);
    
    // Agrupar por nome
    const partnersByName = {};
    partners.forEach(partner => {
      const name = partner.name.trim().toUpperCase();
      if (!partnersByName[name]) {
        partnersByName[name] = [];
      }
      partnersByName[name].push(partner);
    });
    
    // Identificar duplicados
    const duplicates = [];
    for (const [name, group] of Object.entries(partnersByName)) {
      if (group.length > 1) {
        console.log(`\nDuplicados encontrados para: ${name}`);
        console.log(`  Total: ${group.length} registros`);
        
        // Para cada grupo duplicado, manter apenas o primeiro (ou o que tem mais informações)
        // e marcar os outros para exclusão
        const toKeep = group.find(p => p.cpfCnpj && p.cpfCnpj.length > 0) || group[0];
        const toDelete = group.filter(p => p.id !== toKeep.id);
        
        console.log(`  Mantendo: ID ${toKeep.id} (CPF: ${toKeep.cpfCnpj || 'N/A'})`);
        toDelete.forEach(p => {
          console.log(`  Deletando: ID ${p.id} (CPF: ${p.cpfCnpj || 'N/A'})`);
          duplicates.push(p);
        });
      }
    }
    
    console.log(`\n======================================`);
    console.log(`Total de duplicados a remover: ${duplicates.length}`);
    console.log(`======================================\n`);
    
    if (duplicates.length === 0) {
      console.log('Nenhum duplicado encontrado!');
      return;
    }
    
    // Remover duplicados
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const partner of duplicates) {
      try {
        // Verificar se tem transações vinculadas
        const purchasesCheck = await axios.get(`${API_URL}/cattle-purchases?vendorId=${partner.id}`, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        
        const hasPurchases = purchasesCheck.data.items && purchasesCheck.data.items.length > 0;
        
        if (hasPurchases) {
          console.log(`⚠️  Mantendo ${partner.name} (ID: ${partner.id}) - tem compras vinculadas`);
          continue;
        }
        
        // Deletar parceiro sem transações
        await axios.delete(`${API_URL}/partners/${partner.id}`, {
          headers: { Authorization: `Bearer ${TOKEN}` }
        });
        
        deletedCount++;
        console.log(`✅ Deletado: ${partner.name} (ID: ${partner.id})`);
        
      } catch (error) {
        errorCount++;
        console.log(`❌ Erro ao deletar ${partner.name} (ID: ${partner.id}):`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`\n======================================`);
    console.log(`RESUMO DA LIMPEZA:`);
    console.log(`  Parceiros deletados: ${deletedCount}`);
    console.log(`  Erros: ${errorCount}`);
    console.log(`  Parceiros mantidos: ${partners.length - deletedCount}`);
    console.log(`======================================\n`);
    
  } catch (error) {
    console.error('Erro ao limpar parceiros duplicados:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

cleanDuplicatePartners();