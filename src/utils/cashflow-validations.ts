export interface CashFlowValidationErrors {
  type?: string;
  categoryId?: string;
  accountId?: string;
  description?: string;
  amount?: string;
  date?: string;
  dueDate?: string;
  general?: string;
}

export function validateCashFlow(data: any): CashFlowValidationErrors {
  const errors: CashFlowValidationErrors = {};

  // Validação de tipo
  if (!data.type || !['INCOME', 'EXPENSE'].includes(data.type)) {
    errors.type = 'Tipo de movimentação é obrigatório';
  }

  // Validação de categoria
  if (!data.categoryId) {
    errors.categoryId = 'Categoria é obrigatória';
  }

  // Validação de conta
  if (!data.accountId) {
    errors.accountId = 'Conta é obrigatória';
  }

  // Validação de descrição
  if (!data.description || data.description.trim().length < 3) {
    errors.description = 'Descrição deve ter pelo menos 3 caracteres';
  } else if (data.description.length > 200) {
    errors.description = 'Descrição não pode ter mais de 200 caracteres';
  }

  // Validação de valor
  if (!data.amount || isNaN(data.amount)) {
    errors.amount = 'Valor é obrigatório e deve ser um número';
  } else if (data.amount <= 0) {
    errors.amount = 'Valor deve ser maior que zero';
  } else if (data.amount > 999999999) {
    errors.amount = 'Valor muito alto';
  }

  // Validação de data
  if (!data.date) {
    errors.date = 'Data é obrigatória';
  } else {
    const date = new Date(data.date);
    if (isNaN(date.getTime())) {
      errors.date = 'Data inválida';
    }
  }

  // Validação de data de vencimento (opcional)
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.dueDate = 'Data de vencimento inválida';
    }
  }

  return errors;
}

export function hasValidationErrors(errors: CashFlowValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function formatValidationMessage(errors: CashFlowValidationErrors): string {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) return '';
  if (messages.length === 1) return messages[0];
  return 'Corrija os seguintes erros:\n' + messages.map(m => `• ${m}`).join('\n');
}