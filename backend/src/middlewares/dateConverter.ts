/**
 * Middleware de Conversão de Datas BR-SP
 * ========================================
 * 
 * Converte automaticamente datas entre formatos BR e ISO
 * em requisições e respostas da API
 */

import { Request, Response, NextFunction } from 'express';
import { parseISO, isValid, format } from 'date-fns';
import { toSaoPauloTime, fromSaoPauloToUTC } from '@/config/dateConfig';

/**
 * Lista de campos que são datas no sistema
 */
const DATE_FIELDS = [
  'date',
  'createdAt',
  'updatedAt',
  'dueDate',
  'paymentDate',
  'receiptDate',
  'purchaseDate',
  'receivedDate',
  'startDate',
  'endDate',
  'applicationDate',
  'withdrawalPeriodEnd',
  'estimatedSlaughterDate',
  'principalDueDate',
  'commissionDueDate',
  'freightDueDate',
  'saleDate',
  'deliveryDate',
  'birthDate'
];

/**
 * Converte datas no formato BR (dd/MM/yyyy) para ISO
 */
function convertBRToISO(dateStr: string): string | null {
  // Verifica se já está em formato ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return dateStr;
  }
  
  // Tenta converter de dd/MM/yyyy para ISO
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    try {
      const date = parseISO(isoDate);
      if (isValid(date)) {
        return isoDate;
      }
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Processa objeto recursivamente convertendo datas BR para ISO
 */
function processRequestDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Se parecer uma data BR, tenta converter
    if (/^\d{2}\/\d{2}\/\d{4}/.test(obj)) {
      const converted = convertBRToISO(obj);
      return converted || obj;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(processRequestDates);
  }
  
  if (typeof obj === 'object') {
    const processed: any = {};
    
    for (const key in obj) {
      const value = obj[key];
      
      // Se é um campo de data conhecido
      if (DATE_FIELDS.includes(key) && typeof value === 'string') {
        // Tenta converter de BR para ISO
        if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
          const converted = convertBRToISO(value);
          processed[key] = converted || value;
        } else {
          processed[key] = value;
        }
      } else {
        processed[key] = processRequestDates(value);
      }
    }
    
    return processed;
  }
  
  return obj;
}

/**
 * Processa resposta convertendo datas para timezone SP
 */
function processResponseDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (obj instanceof Date) {
    // Converte Date para string ISO com timezone SP
    return toSaoPauloTime(obj).toISOString();
  }
  
  if (typeof obj === 'string') {
    // Se é uma string de data ISO, mantém como está
    // O frontend irá converter para exibição
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(processResponseDates);
  }
  
  if (typeof obj === 'object') {
    const processed: any = {};
    
    for (const key in obj) {
      processed[key] = processResponseDates(obj[key]);
    }
    
    return processed;
  }
  
  return obj;
}

/**
 * Middleware para converter datas em requisições
 */
export const dateConverterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Processa body da requisição
  if (req.body) {
    req.body = processRequestDates(req.body);
  }
  
  // Processa query params
  if (req.query) {
    req.query = processRequestDates(req.query);
  }
  
  // Intercepta o método json do response para processar datas na saída
  const originalJson = res.json.bind(res);
  
  res.json = function(data: any) {
    const processedData = processResponseDates(data);
    return originalJson(processedData);
  };
  
  next();
};

/**
 * Função auxiliar para validar e converter data BR para Date
 */
export function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Se já está em formato ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    try {
      const date = parseISO(dateStr);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  }
  
  // Se está em formato BR (dd/MM/yyyy)
  if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    try {
      const date = parseISO(isoDate);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  }
  
  return null;
}

/**
 * Função auxiliar para formatar data para resposta
 */
export function formatDateForResponse(date: Date | string | null): string | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return null;
    
    // Retorna sempre em formato ISO
    // O frontend irá converter para exibição em formato BR
    return dateObj.toISOString();
  } catch {
    return null;
  }
}

export default dateConverterMiddleware;