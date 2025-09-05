import fetch from 'node-fetch';

async function cleanDuplicates() {
  try {
    console.log('🧹 Limpando dados duplicados...\n');
    
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
    console.log('✅ Login realizado\n');
    
    // 2. Buscar TODAS as compras
    console.log('📋 Buscando todas as compras...');
    const purchasesResponse = await fetch('http://localhost:3002/api/v1/cattle-purchases?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const purchasesData = await purchasesResponse.json();
    const allPurchases = purchasesData.items || [];
    
    console.log(`Total de compras encontradas: ${allPurchases.length}`);
    
    // 3. Identificar duplicados (manter apenas os primeiros 22)
    // Ordenar por data de criação para manter os mais antigos
    allPurchases.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Agrupar por vendedor e data para identificar duplicados reais
    const uniqueMap = new Map();
    const toDelete = [];
    
    allPurchases.forEach(purchase => {
      const key = `${purchase.vendorId}_${purchase.purchaseDate}_${purchase.purchaseWeight}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, purchase);
      } else {
        // É duplicado, marcar para exclusão
        toDelete.push(purchase);
      }
    });
    
    console.log(`\n🔍 Análise:`);
    console.log(`- Compras únicas: ${uniqueMap.size}`);
    console.log(`- Duplicados a remover: ${toDelete.length}`);
    
    // 4. Deletar duplicados
    if (toDelete.length > 0) {
      console.log('\n🗑️ Removendo duplicados...');
      let deleted = 0;
      
      for (const purchase of toDelete) {
        try {
          const deleteResponse = await fetch(`http://localhost:3002/api/v1/cattle-purchases/${purchase.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (deleteResponse.ok) {
            deleted++;
            console.log(`✅ Removido: ${purchase.lotCode} (${purchase.vendor.name})`);
          } else {
            console.log(`❌ Erro ao remover: ${purchase.lotCode}`);
          }
        } catch (error) {
          console.log(`❌ Erro ao remover ${purchase.lotCode}:`, error.message);
        }
      }
      
      console.log(`\n✅ ${deleted} duplicados removidos com sucesso!`);
    } else {
      console.log('\n✅ Nenhum duplicado encontrado!');
    }
    
    // 5. Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const finalResponse = await fetch('http://localhost:3002/api/v1/cattle-purchases?limit=100', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const finalData = await finalResponse.json();
    console.log(`Total de compras no sistema após limpeza: ${finalData.results || finalData.total}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

cleanDuplicates();