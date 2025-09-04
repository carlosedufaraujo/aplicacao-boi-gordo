/**
 * Este arquivo agora importa e re-exporta as funções do dateConfig
 * para manter compatibilidade com código existente
 */

import {
  formatBrazilianCurrency,
  formatBrazilianNumber,
  formatWeight as formatWeightBR,
  formatPercentage as formatPercentageBR
} from '@/config/dateConfig';

/**
 * Formata um valor numérico para o padrão de moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @returns String formatada em R$ com separadores corretos
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return formatBrazilianCurrency(value);
};

/**
 * Formata um valor numérico grande de forma compacta (ex: 1.5M, 250K)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada de forma compacta
 */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  if (value >= 1000000) {
    return `R$ ${formatBrazilianNumber(value / 1000000, 1)}M`;
  } else if (value >= 1000) {
    return `R$ ${formatBrazilianNumber(value / 1000, 1)}K`;
  }
  
  return formatCurrency(value);
};

/**
 * Formata número com separadores de milhares
 * @param value - Valor numérico a ser formatado
 * @returns String formatada com separadores de milhares
 */
export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  return formatBrazilianNumber(value);
};

/**
 * Formata peso em kg
 * @param value - Valor do peso em kg
 * @returns String formatada com "kg"
 */
export const formatWeight = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0,00 kg';
  return formatWeightBR(value);
};

/**
 * Formata percentual
 * @param value - Valor percentual (0-100)
 * @returns String formatada com "%"
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0,00%';
  return formatPercentageBR(value);
};

// Re-export das novas funções para facilitar importação
export {
  formatBrazilianCurrency,
  formatBrazilianNumber,
  formatBrazilianDate
} from '@/config/dateConfig';