/**
 * Utilidades para manipulação de datas no backend
 */

import { format, parseISO, isValid, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data para o formato brasileiro (dd/MM/yyyy)
 */
export const formatBrazilianDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

/**
 * Formata uma data e hora para o formato brasileiro
 */
export const formatBrazilianDateTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return 'Data inválida';
    
    return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data/hora:', error);
    return 'Data inválida';
  }
};

/**
 * Verifica se uma data é válida
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
    return isValid(dateObj);
  } catch {
    return false;
  }
};

/**
 * Converte string para Date de forma segura
 */
export const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  try {
    // Tenta diferentes formatos
    let date: Date;
    
    // ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      date = parseISO(dateString);
    } 
    // Brazilian format (DD/MM/YYYY)
    else if (/^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
      const [day, month, year] = dateString.split('/');
      date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Default
    else {
      date = new Date(dateString);
    }
    
    return isValid(date) ? date : null;
  } catch (error) {
    console.error('Erro ao fazer parse da data:', error);
    return null;
  }
};

/**
 * Calcula diferença em dias entre duas datas
 */
export const calculateDaysDifference = (date1: Date | string, date2: Date | string): number => {
  try {
    const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
    const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
    
    if (!isValid(d1) || !isValid(d2)) return 0;
    
    return Math.abs(differenceInDays(d1, d2));
  } catch (error) {
    console.error('Erro ao calcular diferença de dias:', error);
    return 0;
  }
};

/**
 * Obtém a data atual no início do dia (00:00:00)
 */
export const getStartOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * Obtém a data atual no final do dia (23:59:59)
 */
export const getEndOfToday = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
};

/**
 * Converte data para ISO string de forma segura
 */
export const toISOString = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) throw new Error('Data inválida');
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Erro ao converter para ISO string:', error);
    return new Date().toISOString();
  }
};

/**
 * Adiciona dias a uma data
 */
export const addDays = (date: Date | string, days: number): Date => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) throw new Error('Data inválida');
    
    const newDate = new Date(dateObj);
    newDate.setDate(newDate.getDate() + days);
    return newDate;
  } catch (error) {
    console.error('Erro ao adicionar dias:', error);
    return new Date();
  }
};

/**
 * Remove dias de uma data
 */
export const subtractDays = (date: Date | string, days: number): Date => {
  return addDays(date, -days);
};