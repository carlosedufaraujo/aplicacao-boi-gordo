/**
 * Utilitários de formatação para valores monetários, numéricos e outros
 */

/**
 * Formata um valor numérico para o padrão de moeda brasileira
 * @param value - Valor numérico a ser formatado
 * @returns String formatada em R$ com separadores corretos
 */
export const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Formata um valor numérico grande de forma compacta (ex: 1.5M, 250K)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada de forma compacta
 */
export const formatCompactCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`;
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
  return value.toLocaleString('pt-BR');
};

/**
 * Formata peso em kg
 * @param value - Valor do peso em kg
 * @returns String formatada com "kg"
 */
export const formatWeight = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0,00 kg';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
};

/**
 * Formata percentual
 * @param value - Valor percentual (0-100)
 * @returns String formatada com "%"
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0,00%';
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

/**
 * Formata data no padrão brasileiro
 * @param date - Data a ser formatada
 * @returns String formatada em DD/MM/AAAA
 */
export const formatBrazilianDate = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

// Aliases para compatibilidade
export const formatBrazilianCurrency = formatCurrency;
export const formatBrazilianNumber = formatNumber;
