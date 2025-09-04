/**
 * Configuração Padrão de Datas e Horários - BR-SP
 * ================================================
 * 
 * Este arquivo define o padrão de datas e horários para todo o sistema,
 * garantindo consistência no formato brasileiro (São Paulo).
 */

import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Configurações padrão do sistema
 */
export const DATE_CONFIG = {
  // Timezone padrão: São Paulo, Brasil (UTC-3)
  TIMEZONE: 'America/Sao_Paulo',
  
  // Locale padrão para formatação
  LOCALE: ptBR,
  
  // Formatos padrão de data e hora
  FORMATS: {
    // Datas
    DATE_SHORT: 'dd/MM/yy',           // 03/09/25
    DATE_FULL: 'dd/MM/yyyy',          // 03/09/2025
    DATE_LONG: "dd 'de' MMMM 'de' yyyy", // 03 de setembro de 2025
    DATE_MONTH_YEAR: 'MM/yyyy',       // 09/2025
    
    // Horários
    TIME_SHORT: 'HH:mm',              // 15:30
    TIME_FULL: 'HH:mm:ss',            // 15:30:45
    
    // Data e Hora combinados
    DATETIME_SHORT: "dd/MM/yy 'às' HH:mm",      // 03/09/25 às 15:30
    DATETIME_FULL: "dd/MM/yyyy 'às' HH:mm:ss",  // 03/09/2025 às 15:30:45
    DATETIME_DISPLAY: "dd/MM/yyyy 'às' HH:mm",  // 03/09/2025 às 15:30
    
    // Formatos para inputs HTML
    DATE_INPUT: 'yyyy-MM-dd',         // 2025-09-03 (para <input type="date">)
    DATETIME_INPUT: "yyyy-MM-dd'T'HH:mm", // 2025-09-03T15:30 (para <input type="datetime-local">)
    
    // Formatos para API/Banco de dados
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // 2025-09-03T18:30:45.123Z
    API_DATE: 'yyyy-MM-dd',           // 2025-09-03
    API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss", // 2025-09-03T15:30:45
  },
  
  // Configurações de validação
  VALIDATION: {
    MIN_DATE: new Date('2020-01-01'),
    MAX_DATE: new Date('2030-12-31'),
    ALLOW_FUTURE_DATES: true,
    ALLOW_PAST_DATES: true,
  },
  
  // Configurações de exibição
  DISPLAY: {
    USE_RELATIVE_TIME: false, // Não usar "há 2 dias", sempre mostrar data completa
    SHOW_YEAR_IN_CURRENT: true, // Sempre mostrar o ano, mesmo se for o atual
    TIME_24H: true, // Usar formato 24h (não AM/PM)
  }
};

/**
 * Funções utilitárias para trabalhar com datas no padrão BR-SP
 */

/**
 * Converte uma data UTC para o timezone de São Paulo
 */
export function toSaoPauloTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, DATE_CONFIG.TIMEZONE);
}

/**
 * Converte uma data de São Paulo para UTC
 */
export function fromSaoPauloToUTC(date: Date): Date {
  return fromZonedTime(date, DATE_CONFIG.TIMEZONE);
}

/**
 * Formata uma data no padrão brasileiro
 */
export function formatBrazilianDate(
  date: Date | string,
  formatType: keyof typeof DATE_CONFIG.FORMATS = 'DATE_FULL'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const spDate = toSaoPauloTime(dateObj);
  return format(spDate, DATE_CONFIG.FORMATS[formatType], { locale: DATE_CONFIG.LOCALE });
}

/**
 * Formata valor monetário no padrão brasileiro
 */
export function formatBrazilianCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata número no padrão brasileiro
 */
export function formatBrazilianNumber(
  value: number, 
  decimals: number = 0
): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formata peso em kg
 */
export function formatWeight(value: number): string {
  return `${formatBrazilianNumber(value, 2)} kg`;
}

/**
 * Formata percentual
 */
export function formatPercentage(value: number): string {
  return `${formatBrazilianNumber(value, 2)}%`;
}

/**
 * Obtém a data/hora atual em São Paulo
 */
export function getCurrentSaoPauloTime(): Date {
  return toSaoPauloTime(new Date());
}

/**
 * Valida se uma data está dentro dos limites permitidos
 */
export function isDateValid(date: Date): boolean {
  return date >= DATE_CONFIG.VALIDATION.MIN_DATE && 
         date <= DATE_CONFIG.VALIDATION.MAX_DATE;
}

/**
 * Exemplos de uso:
 * 
 * // Formatação de datas
 * const hoje = new Date();
 * console.log(formatBrazilianDate(hoje)); // "03/09/2025"
 * console.log(formatBrazilianDate(hoje, 'DATETIME_DISPLAY')); // "03/09/2025 às 15:30"
 * 
 * // Formatação de valores
 * console.log(formatBrazilianCurrency(1500.50)); // "R$ 1.500,50"
 * console.log(formatWeight(450.75)); // "450,75 kg"
 * console.log(formatPercentage(15.5)); // "15,50%"
 * 
 * // Conversão de timezone
 * const utcDate = new Date('2025-09-03T18:30:00Z');
 * const spDate = toSaoPauloTime(utcDate);
 * console.log(spDate); // Data ajustada para horário de SP
 */

export default DATE_CONFIG;