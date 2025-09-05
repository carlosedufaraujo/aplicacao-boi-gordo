import fetch from 'node-fetch';

async function deleteHalf() {
  try {
    console.log('🧹 Deletando metade das compras (mantendo apenas 22)...\n');
    
    // 1. Login
    const loginResponse = await fetch('http://localhost:3002/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@boigordo.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    // 2. Buscar TODAS as compras
    const purchasesResponse = await fetch('http://localhost:3002/api/v1/cattle-purchases?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const purchasesData = await purchasesResponse.json();
    const allPurchases = purchasesData.items || [];
    
    console.log(`Total de compras encontradas: ${allPurchases.length}`);
    
    // Ordenar por data de criação (manter as mais antigas)
    allPurchases.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Manter apenas as primeiras 22
    const toKeep = allPurchases.slice(0, 22);
    const toDelete = allPurchases.slice(22);
    
    console.log(`Mantendo: ${toKeep.length} compras`);
    console.log(`Deletando: ${toDelete.length} compras\n`);
    
    // Deletar o excesso
    for (const purchase of toDelete) {
      try {
        const deleteResponse = await fetch(`http://localhost:3002/api/v1/cattle-purchases/${purchase.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deletado: ${purchase.lotCode}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao deletar ${purchase.lotCode}`);
      }
    }
    
    console.log('\n✅ Limpeza concluída! Agora há apenas 22 compras no sistema.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

deleteHalf();