/**
 * Configuração Padrão de Datas e Horários - BR-SP (Backend)
 * ===========================================================
 * 
 * Este arquivo define o padrão de datas e horários para o backend,
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
    
    // Formatos para API/Banco de dados
    ISO: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", // 2025-09-03T18:30:45.123Z
    API_DATE: 'yyyy-MM-dd',           // 2025-09-03
    API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss", // 2025-09-03T15:30:45
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
 * Converte uma data de São Paulo para UTC (para salvar no banco)
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
 * Obtém a data/hora atual em São Paulo
 */
export function getCurrentSaoPauloTime(): Date {
  return toSaoPauloTime(new Date());
}

/**
 * Middleware para converter datas em requisições/respostas
 */
export function convertDatesToSaoPaulo(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Date) {
    return toSaoPauloTime(obj);
  }
  
  if (typeof obj === 'string') {
    // Verifica se é uma string de data ISO
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
      try {
        return toSaoPauloTime(obj);
      } catch {
        return obj;
      }
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertDatesToSaoPaulo);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertDatesToSaoPaulo(obj[key]);
    }
    return converted;
  }
  
  return obj;
}

/**
 * Converter datas para UTC antes de salvar no banco
 */
export function convertDatesToUTC(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Lista de campos que são datas
  const dateFields = [
    'createdAt', 'updatedAt', 'date', 'dueDate', 'paymentDate', 
    'receiptDate', 'purchaseDate', 'receivedDate', 'startDate', 
    'endDate', 'applicationDate', 'withdrawalPeriodEnd'
  ];
  
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const converted: any = {};
    for (const key in obj) {
      if (dateFields.includes(key) && obj[key]) {
        // Converter para UTC se for um campo de data
        if (typeof obj[key] === 'string' || obj[key] instanceof Date) {
          const date = typeof obj[key] === 'string' ? parseISO(obj[key]) : obj[key];
          converted[key] = fromSaoPauloToUTC(date);
        } else {
          converted[key] = obj[key];
        }
      } else {
        converted[key] = obj[key];
      }
    }
    return converted;
  }
  
  return obj;
}

export default DATE_CONFIG;