import { format, isValid, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data de forma segura, tratando valores inválidos
 */
export const formatSafeDate = (
  dateValue: any, 
  formatString: string = "dd/MM/yyyy",
  fallback: string = 'Data não informada'
): string => {
  if (!dateValue) return fallback;
  
  const date = new Date(dateValue);
  if (!isValid(date)) {
    console.warn('Data inválida recebida:', dateValue);
    return 'Data inválida';
  }
  
  try {
    return format(date, formatString, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', dateValue, error);
    return 'Erro na formatação';
  }
};

/**
 * Formata uma data com hora de forma segura
 */
export const formatSafeDateTime = (
  dateValue: any,
  fallback: string = 'Data não informada'
): string => {
  return formatSafeDate(dateValue, "dd/MM/yyyy 'às' HH:mm", fallback);
};

/**
 * Formata uma data curta de forma segura
 */
export const formatSafeShortDate = (
  dateValue: any,
  fallback: string = 'Data não informada'
): string => {
  return formatSafeDate(dateValue, "dd/MM/yy", fallback);
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
    return Math.max(0, differenceInDays(later, earlier));
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
  const date = new Date(dateValue);
  return isValid(date);
};

/**
 * Converte um valor para Date de forma segura
 */
export const toSafeDate = (dateValue: any, fallback: Date = new Date()): Date => {
  if (!dateValue) return fallback;
  
  const date = new Date(dateValue);
  if (!isValid(date)) {
    console.warn('Data inválida convertida para fallback:', dateValue);
    return fallback;
  }
  
  return date;
};

/**
 * Formata um valor numérico como moeda brasileira de forma segura
 */
export const formatSafeCurrency = (
  value: any,
  fallback: string = 'R$ 0,00'
): string => {
  if (value === null || value === undefined) {
    console.warn('Valor monetário undefined/null:', value);
    return fallback;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    console.warn('Valor monetário inválido:', value);
    return 'R$ --';
  }
  
  try {
    return `R$ ${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
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
  if (value === null || value === undefined) {
    console.warn('Número undefined/null:', value);
    return fallback;
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(numValue)) {
    console.warn('Número inválido:', value);
    return '--';
  }
  
  try {
    return numValue.toLocaleString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar número:', value, error);
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
    return numValue.toFixed(decimals);
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
    console.warn('Divisão por zero evitada:', { numerator, denominator });
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
