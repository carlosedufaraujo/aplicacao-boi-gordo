// Script para criar compras de teste via API
const API_URL = 'http://localhost:3001/api';

async function createTestPurchases() {
  console.log('🌱 Criando compras de teste via API...\n');

  // Dados das compras de teste
  const purchases = [
    {
      vendorId: "cmfgqd1zg00018ay7so9zzmk2", // Use um ID real do seu banco
      payerAccountId: "cmfi9fozy0028l584u9qz12h7", // Use um ID real do seu banco
      purchaseDate: "2025-01-10",
      initialQuantity: 100,
      purchaseWeight: 45000, // 450kg médio
      carcassYield: 52,
      pricePerArroba: 320,
      location: "Fazenda São José",
      city: "Goiânia",
      state: "GO",
      paymentType: "installment",
      paymentTerms: "30/60/90",
      notes: "Lote de alta qualidade - Nelore"
    },
    {
      vendorId: "cmfgqd1zg00018ay7so9zzmk2",
      payerAccountId: "cmfi9fozy0028l584u9qz12h7",
      purchaseDate: "2025-01-05",
      initialQuantity: 80,
      purchaseWeight: 40000, // 500kg médio
      carcassYield: 55,
      pricePerArroba: 350,
      location: "Fazenda Santa Maria",
      city: "Campo Grande",
      state: "MS",
      paymentType: "cash",
      notes: "Lote premium - Angus"
    },
    {
      vendorId: "cmfgqd1zg00018ay7so9zzmk2",
      payerAccountId: "cmfi9fozy0028l584u9qz12h7",
      purchaseDate: "2024-12-20",
      initialQuantity: 120,
      purchaseWeight: 54000, // 450kg médio
      carcassYield: 50,
      pricePerArroba: 310,
      location: "Fazenda Boa Vista",
      city: "Cuiabá",
      state: "MT",
      paymentType: "installment",
      paymentTerms: "30/60",
      notes: "Lote misto - cruzamento industrial"
    }
  ];

  for (const purchase of purchases) {
    try {
      const response = await fetch(`${API_URL}/cattle-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchase)
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`✅ Compra criada: Lote ${created.lotCode}`);
        console.log(`   - ${created.initialQuantity} animais`);
        console.log(`   - Peso total: ${created.purchaseWeight}kg`);
        console.log(`   - Rendimento: ${created.carcassYield}%`);
        console.log(`   - Local: ${created.location}, ${created.city}/${created.state}\n`);
      } else {
        const error = await response.text();
        console.error(`❌ Erro ao criar compra:`, error);
      }
    } catch (error) {
      console.error(`❌ Erro de conexão:`, error);
    }
  }

  // Verificar total de compras
  try {
    const response = await fetch(`${API_URL}/cattle-purchases`);
    const data = await response.json();
    console.log(`\n📊 Total de compras no sistema: ${data.total}`);

    if (data.items && data.items.length > 0) {
      console.log('\n📋 Resumo das compras:');
      data.items.forEach((p: any) => {
        const currentQty = p.currentQuantity || (p.initialQuantity - (p.deathCount || 0));
        console.log(`   - ${p.lotCode}: ${currentQty}/${p.initialQuantity} animais (${p.status}), Rendimento: ${p.carcassYield}%`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao buscar compras:', error);
  }
}

createTestPurchases();