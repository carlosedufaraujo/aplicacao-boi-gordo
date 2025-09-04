/**
 * Este arquivo agora importa e re-exporta as funções do dateConfig
 * para manter compatibilidade com código existente
 */

import { differenceInDays, isValid } from 'date-fns';
import {
  formatBrazilianDate,
  formatBrazilianCurrency,
  formatBrazilianNumber,
  toSaoPauloTime,
  isDateValid
} from '@/config/dateConfig';

/**
 * Formata uma data de forma segura, tratando valores inválidos
 */
export const formatSafeDate = (
  dateValue: any, 
  formatString: string = "dd/MM/yyyy",
  fallback: string = 'Data não informada'
): string => {
  if (!dateValue) return fallback;
  
  try {
    // Mapear formato antigo para o novo
    const formatMap: Record<string, keyof typeof import('@/config/dateConfig').DATE_CONFIG.FORMATS> = {
      'dd/MM/yyyy': 'DATE_FULL',
      'dd/MM/yy': 'DATE_SHORT',
      "dd/MM/yyyy 'às' HH:mm": 'DATETIME_DISPLAY',
      "dd 'de' MMMM 'de' yyyy": 'DATE_LONG'
    };
    
    const newFormat = formatMap[formatString] || 'DATE_FULL';
    return formatBrazilianDate(dateValue, newFormat);
  } catch (error) {
    console.error('Erro ao formatar data:', dateValue, error);
    return fallback;
  }
};

/**
 * Formata uma data com hora de forma segura
 */
export const formatSafeDateTime = (
  dateValue: any,
  fallback: string = 'Data não informada'
): string => {
  if (!dateValue) return fallback;
  
  try {
    return formatBrazilianDate(dateValue, 'DATETIME_DISPLAY');
  } catch (error) {
    console.error('Erro ao formatar data/hora:', dateValue, error);
    return fallback;
  }
};

/**
 * Formata uma data curta de forma segura
 */
export const formatSafeShortDate = (
  dateValue: any,
  fallback: string = 'Data não informada'
): string => {
  if (!dateValue) return fallback;
  
  try {
    return formatBrazilianDate(dateValue, 'DATE_SHORT');
  } catch (error) {
    console.error('Erro ao formatar data curta:', dateValue, error);
    return fallback;
  }
};

/**
 * Calcula diferença em dias de forma segura
 */
export const safeDifferenceInDays = (
  laterDate: any,
  earlierDate: any
): number => {
  const later = new Date(laterDate);
  const earlier = new Date(earlierDate);
  
  if (!isValid(later) || !isValid(earlier)) {
    console.warn('Datas inválidas para cálculo de diferença:', { laterDate, earlierDate });
    return 0;
  }
  
  try {
    // Converter para horário de SP antes de calcular
    const laterSP = toSaoPauloTime(later);
    const earlierSP = toSaoPauloTime(earlier);
    return Math.max(0, differenceInDays(laterSP, earlierSP));
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return 0;
  }
};

/**
 * Verifica se uma data é válida
 */
export const isValidDate = (dateValue: any): boolean => {
  if (!dateValue) return false;
  
  try {
    const date = new Date(dateValue);
    return isValid(date) && isDateValid(date);
  } catch {
    return false;
  }
};

/**
 * Converte um valor para Date de forma segura
 */
export const toSafeDate = (dateValue: any, fallback: Date = new Date()): Date => {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (!isValid(date)) {
      console.warn('Data inválida convertida para fallback:', dateValue);
      return fallback;
    }
    
    // Converter para horário de SP
    return toSaoPauloTime(date);
  } catch (error) {
    console.error('Erro ao converter data:', dateValue, error);
    return fallback;
  }
};

/**
 * Formata um valor numérico como moeda brasileira de forma segura
 */
export const formatSafeCurrency = (
  value: any,
  fallback: string = 'R$ 0,00'
): string => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    console.warn('Valor monetário inválido:', value);
    return 'R$ --';
  }
  
  try {
    return formatBrazilianCurrency(numValue);
  } catch (error) {
    console.error('Erro ao formatar valor monetário:', value, error);
    return fallback;
  }
};

/**
 * Formata um número de forma segura
 */
export const formatSafeNumber = (
  value: any,
  fallback: string = '0'
): string => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    return fallback;
  }
  
  try {
    return formatBrazilianNumber(numValue);
  } catch (error) {
    return fallback;
  }
};

/**
 * Formata um número com decimais de forma segura
 */
export const formatSafeDecimal = (
  value: any,
  decimals: number = 2,
  fallback: string = '0'
): string => {
  if (value === null || value === undefined) {
    console.warn('Valor decimal undefined/null:', value);
    return fallback;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    console.warn('Valor decimal inválido:', value);
    return '--';
  }
  
  try {
    return formatBrazilianNumber(numValue, decimals);
  } catch (error) {
    console.error('Erro ao formatar decimal:', value, error);
    return fallback;
  }
};

/**
 * Converte um valor para número de forma segura
 */
export const toSafeNumber = (value: any, fallback: number = 0): number => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    console.warn('Valor numérico inválido convertido para fallback:', value);
    return fallback;
  }
  
  return numValue;
};

/**
 * Divisão segura que evita divisão por zero
 */
export const safeDivision = (
  numerator: any, 
  denominator: any, 
  fallback: number = 0
): number => {
  const num = toSafeNumber(numerator, 0);
  const den = toSafeNumber(denominator, 0);
  
  if (den === 0) {
    return fallback;
  }
  
  const result = num / den;
  
  if (isNaN(result)) {
    console.warn('Resultado de divisão inválido:', { numerator, denominator, result });
    return fallback;
  }
  
  return result;
};

/**
 * Multiplicação segura
 */
export const safeMultiplication = (...values: any[]): number => {
  let result = 1;
  
  for (const value of values) {
    const num = toSafeNumber(value, 0);
    if (num === 0) return 0; // Se qualquer valor for 0, resultado é 0
    result *= num;
  }
  
  if (isNaN(result)) {
    console.warn('Resultado de multiplicação inválido:', values);
    return 0;
  }
  
  return result;
};

// Re-export funções do dateConfig
export {
  formatBrazilianDate,
  formatBrazilianCurrency,
  formatBrazilianNumber,
  formatWeight,
  formatPercentage,
  toSaoPauloTime,
  fromSaoPauloToUTC,
  getCurrentSaoPauloTime,
  DATE_CONFIG
} from '@/config/dateConfig';