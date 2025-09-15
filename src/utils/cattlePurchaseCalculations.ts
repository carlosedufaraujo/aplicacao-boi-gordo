/**
 * Utilidades centralizadas para cálculos de compra de gado
 * Este arquivo garante consistência de cálculos em todo o sistema
 */

/**
 * Interface para dados de compra de gado
 */
export interface CattlePurchaseData {
  // Identificação
  id: string;
  lotCode: string;
  status?: string;
  
  // Quantidades
  quantity?: number;
  initialQuantity?: number;
  currentQuantity?: number;
  
  // Pesos
  purchaseWeight?: number;
  totalWeight?: number;
  currentWeight?: number;
  destinationWeight?: number;
  
  // Valores
  purchaseValue?: number;
  totalValue?: number;
  pricePerArroba?: number;
  
  // Custos adicionais
  freightCost?: number;
  commission?: number;
  otherCosts?: number;
  operationalCost?: number;
  
  // Rendimento
  carcassYield?: number;
  
  // Mortalidade
  deaths?: number;
  mortalityCount?: number;
  
  // Quebra de peso
  weightLossPercentage?: number;
  
  // Relacionamentos
  vendor?: { name: string };
  vendorName?: string;
}

/**
 * Interface para métricas calculadas
 */
export interface CattleMetrics {
  // Quantidades
  totalAnimals: number;
  currentAnimals: number;
  deadAnimals: number;
  
  // Pesos e arrobas
  totalWeight: number;
  totalCarcassWeight: number;
  totalArrobas: number;
  averageCarcassYield: number;
  
  // Valores
  purchaseValue: number;
  freightCost: number;
  commissionCost: number;
  otherCosts: number;
  totalCost: number;
  
  // Médias
  averagePricePerArroba: number;
  averagePricePerKg: number;
  
  // Taxas
  mortalityRate: number;
  weightLossPercentage: number;
}

/**
 * Converte valor para número seguro
 */
function toSafeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Calcula o peso de carcaça baseado no peso vivo e rendimento
 */
export function calculateCarcassWeight(liveWeight: number, carcassYield: number): number {
  return (liveWeight * carcassYield) / 100;
}

/**
 * Calcula arrobas baseado no peso de carcaça
 */
export function calculateArrobas(carcassWeight: number): number {
  return carcassWeight / 15;
}

/**
 * Calcula o custo total de um lote incluindo todos os custos
 */
export function calculateTotalLotCost(purchase: CattlePurchaseData): number {
  const baseCost = toSafeNumber(purchase.purchaseValue || purchase.totalValue);
  const freight = toSafeNumber(purchase.freightCost);
  const commission = toSafeNumber(purchase.commission);
  const otherCosts = toSafeNumber(purchase.otherCosts || purchase.operationalCost);
  
  return baseCost + freight + commission + otherCosts;
}

/**
 * Calcula o peso total do lote
 */
export function calculateLotWeight(purchase: CattlePurchaseData): number {
  return toSafeNumber(purchase.purchaseWeight || purchase.totalWeight);
}

/**
 * Calcula a quantidade de animais do lote
 */
export function calculateLotQuantity(purchase: CattlePurchaseData): number {
  return toSafeNumber(
    purchase.currentQuantity || 
    purchase.initialQuantity || 
    purchase.quantity
  );
}

/**
 * Calcula o rendimento de carcaça (com valor padrão)
 */
export function calculateCarcassYield(purchase: CattlePurchaseData): number {
  const defaultYield = 50; // 50% é o padrão do setor
  return toSafeNumber(purchase.carcassYield, defaultYield);
}

/**
 * Calcula as métricas de um único lote
 */
export function calculateLotMetrics(purchase: CattlePurchaseData): {
  weight: number;
  carcassWeight: number;
  arrobas: number;
  totalCost: number;
  pricePerArroba: number;
  quantity: number;
  carcassYield: number;
} {
  const weight = calculateLotWeight(purchase);
  const carcassYield = calculateCarcassYield(purchase);
  const carcassWeight = calculateCarcassWeight(weight, carcassYield);
  const arrobas = calculateArrobas(carcassWeight);
  const totalCost = calculateTotalLotCost(purchase);
  const pricePerArroba = arrobas > 0 ? totalCost / arrobas : 0;
  const quantity = calculateLotQuantity(purchase);
  
  return {
    weight,
    carcassWeight,
    arrobas,
    totalCost,
    pricePerArroba,
    quantity,
    carcassYield
  };
}

/**
 * Calcula métricas agregadas de múltiplos lotes
 */
export function calculateAggregateMetrics(purchases: CattlePurchaseData[]): CattleMetrics {
  // Filtrar apenas compras confirmadas
  const confirmedPurchases = purchases.filter(p => p.status !== 'PENDING');
  
  // Inicializar acumuladores
  let totalAnimals = 0;
  let currentAnimals = 0;
  let deadAnimals = 0;
  let totalWeight = 0;
  let totalCarcassWeightSum = 0;
  let totalArrobas = 0;
  let purchaseValue = 0;
  let freightCost = 0;
  let commissionCost = 0;
  let otherCosts = 0;
  let totalWeightedYield = 0;
  let totalWeightForYield = 0;
  let totalWeightLoss = 0;
  let lotsWithWeightLoss = 0;
  
  // Processar cada compra
  confirmedPurchases.forEach(purchase => {
    const metrics = calculateLotMetrics(purchase);
    
    // Quantidades
    const initialQty = toSafeNumber(purchase.initialQuantity || purchase.quantity);
    // Usar currentQuantity se existir, senão usar initialQuantity menos mortes
    const deaths = toSafeNumber(purchase.deaths || purchase.mortalityCount, 0);
    const currentQty = purchase.currentQuantity !== undefined
      ? toSafeNumber(purchase.currentQuantity)
      : initialQty - deaths;

    totalAnimals += initialQty;
    currentAnimals += currentQty;
    
    // Mortalidade
    if (initialQty > currentQty) {
      deadAnimals += (initialQty - currentQty);
    } else if (purchase.deaths) {
      deadAnimals += toSafeNumber(purchase.deaths);
    } else if (purchase.mortalityCount) {
      deadAnimals += toSafeNumber(purchase.mortalityCount);
    }
    
    // Pesos e arrobas
    totalWeight += metrics.weight;
    totalCarcassWeightSum += metrics.carcassWeight;
    totalArrobas += metrics.arrobas;
    
    // Média ponderada de rendimento
    if (metrics.weight > 0) {
      totalWeightForYield += metrics.weight;
      totalWeightedYield += metrics.carcassYield * metrics.weight;
    }
    
    // Valores
    purchaseValue += toSafeNumber(purchase.purchaseValue || purchase.totalValue);
    freightCost += toSafeNumber(purchase.freightCost);
    commissionCost += toSafeNumber(purchase.commission);
    otherCosts += toSafeNumber(purchase.otherCosts || purchase.operationalCost);
    
    // Quebra de peso
    const entryWeight = metrics.weight;
    const currentWeight = toSafeNumber(purchase.currentWeight || purchase.destinationWeight);
    
    if (entryWeight > 0 && currentWeight > 0 && currentWeight < entryWeight) {
      const weightLoss = ((entryWeight - currentWeight) / entryWeight) * 100;
      totalWeightLoss += weightLoss;
      lotsWithWeightLoss++;
    } else if (purchase.weightLossPercentage) {
      totalWeightLoss += toSafeNumber(purchase.weightLossPercentage);
      lotsWithWeightLoss++;
    }
  });
  
  // Calcular valores totais e médias
  const totalCost = purchaseValue + freightCost + commissionCost + otherCosts;
  const averagePricePerArroba = totalArrobas > 0 ? totalCost / totalArrobas : 0;
  const averagePricePerKg = totalWeight > 0 ? totalCost / totalWeight : 0;
  const averageCarcassYield = totalWeightForYield > 0 ? totalWeightedYield / totalWeightForYield : 50;
  const mortalityRate = totalAnimals > 0 ? (deadAnimals / totalAnimals) * 100 : 0;
  const weightLossPercentage = lotsWithWeightLoss > 0 ? totalWeightLoss / lotsWithWeightLoss : 0;
  
  return {
    // Quantidades
    totalAnimals,
    currentAnimals,
    deadAnimals,
    
    // Pesos e arrobas
    totalWeight,
    totalCarcassWeight: totalCarcassWeightSum,
    totalArrobas,
    averageCarcassYield,
    
    // Valores
    purchaseValue,
    freightCost,
    commissionCost,
    otherCosts,
    totalCost,
    
    // Médias
    averagePricePerArroba,
    averagePricePerKg,
    
    // Taxas
    mortalityRate,
    weightLossPercentage
  };
}

/**
 * Formata valor em moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata número com separadores de milhares
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
