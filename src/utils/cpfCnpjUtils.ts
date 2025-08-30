/**
 * Utilitários para formatação e validação de CPF/CNPJ
 */

/**
 * Remove todos os caracteres não numéricos
 */
export const cleanCpfCnpj = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Formata CPF (11 dígitos) ou CNPJ (14 dígitos)
 */
export const formatCpfCnpj = (value: string): string => {
  const cleaned = cleanCpfCnpj(value);
  
  if (cleaned.length <= 11) {
    // CPF: 000.000.000-00
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    // CNPJ: 00.000.000/0000-00
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

/**
 * Valida se é um CPF válido (11 dígitos)
 */
export const isValidCpf = (cpf: string): boolean => {
  const cleaned = cleanCpfCnpj(cpf);
  
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;
  
  return true;
};

/**
 * Valida se é um CNPJ válido (14 dígitos)
 */
export const isValidCnpj = (cnpj: string): boolean => {
  const cleaned = cleanCpfCnpj(cnpj);
  
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[12])) return false;
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[13])) return false;
  
  return true;
};

/**
 * Valida se é um CPF ou CNPJ válido
 */
export const isValidCpfCnpj = (value: string): boolean => {
  const cleaned = cleanCpfCnpj(value);
  
  if (cleaned.length === 11) {
    return isValidCpf(cleaned);
  } else if (cleaned.length === 14) {
    return isValidCnpj(cleaned);
  }
  
  return false;
};

/**
 * Retorna o tipo do documento (CPF ou CNPJ)
 */
export const getCpfCnpjType = (value: string): 'CPF' | 'CNPJ' | null => {
  const cleaned = cleanCpfCnpj(value);
  
  if (cleaned.length === 11) return 'CPF';
  if (cleaned.length === 14) return 'CNPJ';
  
  return null;
};