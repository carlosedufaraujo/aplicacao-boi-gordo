// Teste da Análise de Sensibilidade - Validação dos Cálculos

console.log("=".repeat(80));
console.log("TESTE DA ANÁLISE DE SENSIBILIDADE - VALIDAÇÃO DOS CÁLCULOS");
console.log("=".repeat(80));

// Função de cálculo idêntica à do componente React
function calculateProfit(params) {
  // Arrobas na compra
  const purchaseArrobas = (params.purchaseWeight * (params.purchaseYield / 100)) / 15;
  
  // Arrobas na venda
  const saleArrobas = (params.saleWeight * (params.saleYield / 100)) / 15;
  
  // Arrobas produzidas no confinamento
  const producedArrobas = saleArrobas - purchaseArrobas;
  
  // Custos
  const purchaseCost = purchaseArrobas * params.purchasePrice;
  const productionCostTotal = producedArrobas * params.productionCost;
  const totalCost = purchaseCost + productionCostTotal;
  
  // Receita
  const revenue = saleArrobas * params.salePrice;
  
  // Resultado
  const profitPerAnimal = revenue - totalCost;
  const totalProfit = profitPerAnimal * params.animalsCount;
  const margin = totalCost > 0 ? (profitPerAnimal / totalCost) * 100 : 0;
  
  // Cálculo de dias de confinamento baseado no GMD
  const weightGain = params.saleWeight - params.purchaseWeight;
  const confinementDays = params.gmd > 0 ? Math.round(weightGain / params.gmd) : 0;
  
  return {
    profitPerAnimal,
    totalProfit,
    margin,
    revenue,
    totalCost,
    purchaseArrobas,
    saleArrobas,
    producedArrobas,
    purchaseCost,
    productionCostTotal,
    weightGain,
    gmd: params.gmd,
    confinementDays
  };
}

// CENÁRIO 1: Caso Base (valores típicos do mercado)
console.log("\n" + "=".repeat(80));
console.log("CENÁRIO 1: CASO BASE");
console.log("=".repeat(80));

const cenarioBase = {
  purchasePrice: 280,      // R$/@ na compra
  purchaseWeight: 400,     // kg
  purchaseYield: 50,       // %
  salePrice: 320,         // R$/@ na venda
  saleWeight: 550,        // kg
  saleYield: 52,          // %
  productionCost: 200,    // R$/@ produzida (CAP)
  gmd: 1.5,              // kg/dia
  animalsCount: 100      // cabeças
};

console.log("\nPARÂMETROS DE ENTRADA:");
console.log("-".repeat(40));
console.log(`Peso Compra: ${cenarioBase.purchaseWeight} kg`);
console.log(`RC Compra: ${cenarioBase.purchaseYield}%`);
console.log(`Preço Compra: R$ ${cenarioBase.purchasePrice}/@`);
console.log(`Peso Venda: ${cenarioBase.saleWeight} kg`);
console.log(`RC Venda: ${cenarioBase.saleYield}%`);
console.log(`Preço Venda: R$ ${cenarioBase.salePrice}/@`);
console.log(`CAP: R$ ${cenarioBase.productionCost}/@`);
console.log(`GMD: ${cenarioBase.gmd} kg/dia`);
console.log(`Quantidade: ${cenarioBase.animalsCount} animais`);

const resultBase = calculateProfit(cenarioBase);

console.log("\nCÁLCULOS DETALHADOS:");
console.log("-".repeat(40));
console.log(`Ganho de Peso: ${resultBase.weightGain} kg`);
console.log(`Dias de Confinamento: ${resultBase.confinementDays} dias`);
console.log(`Arrobas Compradas: ${resultBase.purchaseArrobas.toFixed(2)} @`);
console.log(`Arrobas Vendidas: ${resultBase.saleArrobas.toFixed(2)} @`);
console.log(`Arrobas Produzidas: ${resultBase.producedArrobas.toFixed(2)} @`);

console.log("\nCUSTOS:");
console.log("-".repeat(40));
console.log(`Custo de Compra: R$ ${resultBase.purchaseCost.toFixed(2)}`);
console.log(`  (${resultBase.purchaseArrobas.toFixed(2)} @ × R$ ${cenarioBase.purchasePrice})`);
console.log(`Custo de Produção: R$ ${resultBase.productionCostTotal.toFixed(2)}`);
console.log(`  (${resultBase.producedArrobas.toFixed(2)} @ × R$ ${cenarioBase.productionCost})`);
console.log(`CUSTO TOTAL: R$ ${resultBase.totalCost.toFixed(2)}`);

console.log("\nRECEITA:");
console.log("-".repeat(40));
console.log(`Receita Total: R$ ${resultBase.revenue.toFixed(2)}`);
console.log(`  (${resultBase.saleArrobas.toFixed(2)} @ × R$ ${cenarioBase.salePrice})`);

console.log("\nRESULTADO:");
console.log("-".repeat(40));
console.log(`Lucro por Animal: R$ ${resultBase.profitPerAnimal.toFixed(2)}`);
console.log(`Lucro Total (${cenarioBase.animalsCount} animais): R$ ${resultBase.totalProfit.toFixed(2)}`);
console.log(`Margem: ${resultBase.margin.toFixed(2)}%`);

// CENÁRIO 2: Mercado Desfavorável
console.log("\n" + "=".repeat(80));
console.log("CENÁRIO 2: MERCADO DESFAVORÁVEL");
console.log("=".repeat(80));

const cenarioRuim = {
  ...cenarioBase,
  purchasePrice: 310,     // Compra mais cara
  salePrice: 300,        // Venda mais barata
  productionCost: 250,   // CAP mais alto
  gmd: 1.2              // GMD menor
};

const resultRuim = calculateProfit(cenarioRuim);

console.log("\nALTERAÇÕES:");
console.log(`Preço Compra: R$ ${cenarioBase.purchasePrice} → R$ ${cenarioRuim.purchasePrice}`);
console.log(`Preço Venda: R$ ${cenarioBase.salePrice} → R$ ${cenarioRuim.salePrice}`);
console.log(`CAP: R$ ${cenarioBase.productionCost} → R$ ${cenarioRuim.productionCost}`);
console.log(`GMD: ${cenarioBase.gmd} → ${cenarioRuim.gmd} kg/dia`);

console.log("\nRESULTADO:");
console.log(`Dias de Confinamento: ${resultRuim.confinementDays} dias (era ${resultBase.confinementDays})`);
console.log(`Lucro por Animal: R$ ${resultRuim.profitPerAnimal.toFixed(2)} (era R$ ${resultBase.profitPerAnimal.toFixed(2)})`);
console.log(`Margem: ${resultRuim.margin.toFixed(2)}% (era ${resultBase.margin.toFixed(2)}%)`);

// CENÁRIO 3: Mercado Favorável
console.log("\n" + "=".repeat(80));
console.log("CENÁRIO 3: MERCADO FAVORÁVEL");
console.log("=".repeat(80));

const cenarioBom = {
  ...cenarioBase,
  purchasePrice: 260,     // Compra mais barata
  salePrice: 350,        // Venda mais cara
  productionCost: 180,   // CAP menor
  gmd: 1.8              // GMD maior
};

const resultBom = calculateProfit(cenarioBom);

console.log("\nALTERAÇÕES:");
console.log(`Preço Compra: R$ ${cenarioBase.purchasePrice} → R$ ${cenarioBom.purchasePrice}`);
console.log(`Preço Venda: R$ ${cenarioBase.salePrice} → R$ ${cenarioBom.salePrice}`);
console.log(`CAP: R$ ${cenarioBase.productionCost} → R$ ${cenarioBom.productionCost}`);
console.log(`GMD: ${cenarioBase.gmd} → ${cenarioBom.gmd} kg/dia`);

console.log("\nRESULTADO:");
console.log(`Dias de Confinamento: ${resultBom.confinementDays} dias (era ${resultBase.confinementDays})`);
console.log(`Lucro por Animal: R$ ${resultBom.profitPerAnimal.toFixed(2)} (era R$ ${resultBase.profitPerAnimal.toFixed(2)})`);
console.log(`Margem: ${resultBom.margin.toFixed(2)}% (era ${resultBase.margin.toFixed(2)}%)`);

// ANÁLISE DE SENSIBILIDADE - Variando Preço de Compra
console.log("\n" + "=".repeat(80));
console.log("ANÁLISE DE SENSIBILIDADE - VARIAÇÃO DO PREÇO DE COMPRA");
console.log("=".repeat(80));

console.log("\nMantendo tudo constante, variando apenas o preço de compra:");
console.log("-".repeat(60));
console.log("Preço Compra | Custo Total | Receita | Lucro/Animal | Margem");
console.log("-".repeat(60));

for (let preco = 240; preco <= 320; preco += 20) {
  const cenario = { ...cenarioBase, purchasePrice: preco };
  const result = calculateProfit(cenario);
  console.log(
    `R$ ${preco.toString().padEnd(10)} | ` +
    `R$ ${result.totalCost.toFixed(2).padEnd(9)} | ` +
    `R$ ${result.revenue.toFixed(2).padEnd(9)} | ` +
    `R$ ${result.profitPerAnimal.toFixed(2).padEnd(10)} | ` +
    `${result.margin.toFixed(1)}%`
  );
}

// ANÁLISE DE SENSIBILIDADE - Variando CAP
console.log("\n" + "=".repeat(80));
console.log("ANÁLISE DE SENSIBILIDADE - VARIAÇÃO DO CAP");
console.log("=".repeat(80));

console.log("\nMantendo tudo constante, variando apenas o CAP:");
console.log("-".repeat(60));
console.log("CAP        | Custo Prod. | Custo Total | Lucro/Animal | Margem");
console.log("-".repeat(60));

for (let cap = 150; cap <= 250; cap += 25) {
  const cenario = { ...cenarioBase, productionCost: cap };
  const result = calculateProfit(cenario);
  console.log(
    `R$ ${cap.toString().padEnd(7)} | ` +
    `R$ ${result.productionCostTotal.toFixed(2).padEnd(9)} | ` +
    `R$ ${result.totalCost.toFixed(2).padEnd(9)} | ` +
    `R$ ${result.profitPerAnimal.toFixed(2).padEnd(10)} | ` +
    `${result.margin.toFixed(1)}%`
  );
}

// VALIDAÇÃO: Caso Extremo
console.log("\n" + "=".repeat(80));
console.log("VALIDAÇÃO: CASO EXTREMO (PREJUÍZO)");
console.log("=".repeat(80));

const cenarioPreju = {
  ...cenarioBase,
  purchasePrice: 350,     // Compra muito cara
  salePrice: 280,        // Venda abaixo do custo
  productionCost: 300    // CAP alto
};

const resultPreju = calculateProfit(cenarioPreju);

console.log("\nPARÂMETROS EXTREMOS:");
console.log(`Preço Compra: R$ ${cenarioPreju.purchasePrice}/@`);
console.log(`Preço Venda: R$ ${cenarioPreju.salePrice}/@`);
console.log(`CAP: R$ ${cenarioPreju.productionCost}/@`);

console.log("\nRESULTADO:");
console.log(`Custo Total: R$ ${resultPreju.totalCost.toFixed(2)}`);
console.log(`Receita: R$ ${resultPreju.revenue.toFixed(2)}`);
console.log(`PREJUÍZO por Animal: R$ ${resultPreju.profitPerAnimal.toFixed(2)}`);
console.log(`Margem: ${resultPreju.margin.toFixed(2)}%`);

// RESUMO FINAL
console.log("\n" + "=".repeat(80));
console.log("RESUMO DA ANÁLISE");
console.log("=".repeat(80));

console.log("\nPONTOS-CHAVE:");
console.log("1. O lucro é MUITO sensível ao preço de compra e venda");
console.log("2. CAP tem impacto direto proporcional às arrobas produzidas");
console.log("3. GMD afeta dias de confinamento mas não o custo por arroba");
console.log("4. Margem típica esperada: 15-30% em condições normais");
console.log("5. Break-even geralmente ocorre com diferença de ~R$ 40/@ entre compra e venda");

console.log("\n" + "=".repeat(80));