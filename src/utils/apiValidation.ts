/**
 * Utilitários de validação para APIs
 * Implementa as melhores práticas recomendadas pelo TestSprite MCP
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos válidos para PartnerType
export const PARTNER_TYPES = {
  VENDOR: 'VENDOR',
  BROKER: 'BROKER', 
  BUYER: 'BUYER',
  INVESTOR: 'INVESTOR',
  SERVICE_PROVIDER: 'SERVICE_PROVIDER',
  FREIGHT_CARRIER: 'FREIGHT_CARRIER',
  OTHER: 'OTHER'
} as const;

export type PartnerType = keyof typeof PARTNER_TYPES;

// Tipos válidos para AnimalType
export const ANIMAL_TYPES = {
  MALE: 'MALE',
  FEMALE: 'FEMALE', 
  MIXED: 'MIXED'
} as const;

export type AnimalType = keyof typeof ANIMAL_TYPES;

// Tipos válidos para PaymentType
export const PAYMENT_TYPES = {
  CASH: 'CASH',
  INSTALLMENT: 'INSTALLMENT',
  BARTER: 'BARTER'
} as const;

export type PaymentType = keyof typeof PAYMENT_TYPES;

/**
 * Valida dados de criação de parceiro
 */
export function validatePartnerData(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Nome obrigatório
  if (!data.name || typeof data.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Nome é obrigatório',
      value: data.name
    });
  } else if (data.name.length < 3) {
    errors.push({
      field: 'name', 
      message: 'Nome deve ter no mínimo 3 caracteres',
      value: data.name
    });
  } else if (data.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Nome deve ter no máximo 100 caracteres', 
      value: data.name
    });
  }

  // Tipo obrigatório
  if (!data.type) {
    errors.push({
      field: 'type',
      message: 'Tipo é obrigatório',
      value: data.type
    });
  } else if (!Object.values(PARTNER_TYPES).includes(data.type)) {
    errors.push({
      field: 'type',
      message: `Tipo inválido. Valores válidos: ${Object.values(PARTNER_TYPES).join(', ')}`,
      value: data.type
    });
  }

  // Email opcional mas deve ser válido se fornecido
  if (data.email && !isValidEmail(data.email)) {
    errors.push({
      field: 'email',
      message: 'Email inválido',
      value: data.email
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida dados de compra de gado
 */
export function validateCattlePurchaseData(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Fornecedor obrigatório
  if (!data.vendorId || typeof data.vendorId !== 'string') {
    errors.push({
      field: 'vendorId',
      message: 'Fornecedor é obrigatório',
      value: data.vendorId
    });
  }

  // Conta pagadora obrigatória
  if (!data.payerAccountId || typeof data.payerAccountId !== 'string') {
    errors.push({
      field: 'payerAccountId',
      message: 'Conta pagadora é obrigatória',
      value: data.payerAccountId
    });
  }

  // Data de compra obrigatória
  if (!data.purchaseDate) {
    errors.push({
      field: 'purchaseDate',
      message: 'Data de compra é obrigatória',
      value: data.purchaseDate
    });
  } else if (!isValidISODate(data.purchaseDate)) {
    errors.push({
      field: 'purchaseDate',
      message: 'Data de compra deve estar no formato ISO8601',
      value: data.purchaseDate
    });
  }

  // Tipo de animal obrigatório
  if (!data.animalType) {
    errors.push({
      field: 'animalType',
      message: 'Tipo de animal é obrigatório',
      value: data.animalType
    });
  } else if (!Object.values(ANIMAL_TYPES).includes(data.animalType)) {
    errors.push({
      field: 'animalType',
      message: `Tipo de animal inválido. Valores válidos: ${Object.values(ANIMAL_TYPES).join(', ')}`,
      value: data.animalType
    });
  }

  // Quantidade inicial obrigatória
  if (!data.initialQuantity || typeof data.initialQuantity !== 'number') {
    errors.push({
      field: 'initialQuantity',
      message: 'Quantidade inicial é obrigatória',
      value: data.initialQuantity
    });
  } else if (data.initialQuantity < 1 || !Number.isInteger(data.initialQuantity)) {
    errors.push({
      field: 'initialQuantity',
      message: 'Quantidade deve ser um número inteiro maior que zero',
      value: data.initialQuantity
    });
  }

  // Peso da compra obrigatório
  if (!data.purchaseWeight || typeof data.purchaseWeight !== 'number') {
    errors.push({
      field: 'purchaseWeight',
      message: 'Peso da compra é obrigatório',
      value: data.purchaseWeight
    });
  } else if (data.purchaseWeight < 1) {
    errors.push({
      field: 'purchaseWeight',
      message: 'Peso deve ser maior que zero',
      value: data.purchaseWeight
    });
  }

  // Rendimento de carcaça obrigatório
  if (!data.carcassYield || typeof data.carcassYield !== 'number') {
    errors.push({
      field: 'carcassYield',
      message: 'Rendimento de carcaça é obrigatório',
      value: data.carcassYield
    });
  } else if (data.carcassYield < 1 || data.carcassYield > 100) {
    errors.push({
      field: 'carcassYield',
      message: 'Rendimento deve estar entre 1 e 100',
      value: data.carcassYield
    });
  }

  // Preço por arroba obrigatório
  if (data.pricePerArroba === undefined || typeof data.pricePerArroba !== 'number') {
    errors.push({
      field: 'pricePerArroba',
      message: 'Preço por arroba é obrigatório',
      value: data.pricePerArroba
    });
  } else if (data.pricePerArroba < 0) {
    errors.push({
      field: 'pricePerArroba',
      message: 'Preço por arroba deve ser maior ou igual a zero',
      value: data.pricePerArroba
    });
  }

  // Tipo de pagamento obrigatório
  if (!data.paymentType) {
    errors.push({
      field: 'paymentType',
      message: 'Tipo de pagamento é obrigatório',
      value: data.paymentType
    });
  } else if (!Object.values(PAYMENT_TYPES).includes(data.paymentType)) {
    errors.push({
      field: 'paymentType',
      message: `Tipo de pagamento inválido. Valores válidos: ${Object.values(PAYMENT_TYPES).join(', ')}`,
      value: data.paymentType
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida formato de data ISO8601
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) && dateString.includes('T');
}

/**
 * Formata erros de validação para exibição
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join('\n');
}

/**
 * Cria dados de exemplo válidos para testes
 */
export function createValidPartnerExample(): any {
  return {
    name: "Fazenda Exemplo",
    type: PARTNER_TYPES.VENDOR,
    cpfCnpj: "12.345.678/0001-90",
    phone: "(11) 99999-9999",
    email: "contato@fazenda.com"
  };
}

export function createValidCattlePurchaseExample(vendorId: string, payerAccountId: string): any {
  return {
    vendorId,
    payerAccountId,
    purchaseDate: new Date().toISOString(),
    animalType: ANIMAL_TYPES.MALE,
    initialQuantity: 50,
    purchaseWeight: 15000,
    carcassYield: 55.5,
    pricePerArroba: 280.50,
    paymentType: PAYMENT_TYPES.CASH
  };
}
