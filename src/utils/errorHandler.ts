import { toast } from 'sonner';

/**
 * Interface para mensagens de erro estruturadas
 */
interface ErrorDetails {
  title: string;
  message: string;
  field?: string;
  code?: string;
  statusCode?: number;
}

/**
 * Mapeamento de mensagens de erro do backend para mensagens amigáveis
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Erros de validação
  'CPF/CNPJ já cadastrado': 'Este CPF/CNPJ já está cadastrado no sistema',
  'cpfCnpj with value': 'CPF/CNPJ inválido. Use 11 dígitos para CPF ou 14 para CNPJ',
  'Nome é obrigatório': 'Por favor, preencha o nome',
  'Tipo é obrigatório': 'Por favor, selecione o tipo de parceiro',
  
  // Erros de conflito
  'Conflict': 'Este registro já existe no sistema',
  '409': 'Registro duplicado',
  
  // Erros de validação de formato
  'fails to match the required pattern': 'Formato inválido',
  'must be a valid email': 'E-mail inválido',
  'must be a number': 'Deve ser um número',
  'is required': 'Campo obrigatório',
  
  // Erros de autenticação
  'Unauthorized': 'Você não tem permissão para esta ação',
  '401': 'Sessão expirada. Por favor, faça login novamente',
  
  // Erros de servidor
  'Internal Server Error': 'Erro no servidor. Tente novamente mais tarde',
  '500': 'Erro interno do servidor',
  
  // Erros de rede
  'Network Error': 'Erro de conexão. Verifique sua internet',
  'Failed to fetch': 'Não foi possível conectar ao servidor',
};

/**
 * Extrai detalhes do erro de diferentes formatos
 */
export function extractErrorDetails(error: any): ErrorDetails {
  // Se for uma string simples
  if (typeof error === 'string') {
    return {
      title: 'Erro',
      message: getMappedMessage(error),
    };
  }

  // Se for um Error object
  if (error instanceof Error) {
    const message = error.message || 'Erro desconhecido';
    
    // Tentar extrair código de status da mensagem
    let statusCode: number | undefined;
    const statusMatch = message.match(/\b(\d{3})\b/);
    if (statusMatch) {
      statusCode = parseInt(statusMatch[1]);
    }

    // Tentar extrair campo específico da mensagem de validação
    let field: string | undefined;
    const fieldMatch = message.match(/^(\w+) with value/);
    if (fieldMatch) {
      field = fieldMatch[1];
    }

    return {
      title: getErrorTitle(statusCode),
      message: getMappedMessage(message),
      field,
      statusCode,
    };
  }

  // Se for um objeto de resposta da API
  if (error?.response) {
    const { status, data } = error.response;
    return {
      title: getErrorTitle(status),
      message: getMappedMessage(data?.message || data?.error || 'Erro na requisição'),
      statusCode: status,
    };
  }

  // Se for um objeto com message
  if (error?.message) {
    return {
      title: 'Erro',
      message: getMappedMessage(error.message),
      code: error.code,
    };
  }

  // Fallback
  return {
    title: 'Erro',
    message: 'Ocorreu um erro inesperado',
  };
}

/**
 * Retorna uma mensagem de erro mapeada ou a original se não houver mapeamento
 */
function getMappedMessage(message: string): string {
  // Procurar por correspondência exata
  if (ERROR_MESSAGES[message]) {
    return ERROR_MESSAGES[message];
  }

  // Procurar por correspondência parcial
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return value;
    }
  }

  // Retornar mensagem original se não houver mapeamento
  return message;
}

/**
 * Retorna um título apropriado baseado no código de status
 */
function getErrorTitle(statusCode?: number): string {
  if (!statusCode) return 'Erro';

  if (statusCode >= 400 && statusCode < 500) {
    switch (statusCode) {
      case 400: return 'Dados inválidos';
      case 401: return 'Não autorizado';
      case 403: return 'Acesso negado';
      case 404: return 'Não encontrado';
      case 409: return 'Conflito';
      default: return 'Erro na requisição';
    }
  }

  if (statusCode >= 500) {
    return 'Erro no servidor';
  }

  return 'Erro';
}

/**
 * Mostra uma notificação de erro formatada
 */
export function showErrorNotification(error: any, defaultTitle?: string): void {
  const details = extractErrorDetails(error);
  const title = defaultTitle || details.title;

  // Adicionar informações extras na descrição
  let description = details.message;
  
  if (details.field) {
    description = `Campo: ${details.field}\n${description}`;
  }
  
  if (details.statusCode) {
    description = `${description}\n(Código: ${details.statusCode})`;
  }

  // Mostrar notificação com detalhes
  toast.error(title, {
    description,
    duration: 6000,
    closeButton: true,
  });
}

/**
 * Mostra uma notificação de sucesso
 */
export function showSuccessNotification(message: string, description?: string): void {
  toast.success(message, {
    description,
    duration: 4000,
  });
}

/**
 * Mostra uma notificação de aviso
 */
export function showWarningNotification(message: string, description?: string): void {
  toast.warning(message, {
    description,
    duration: 5000,
  });
}

/**
 * Mostra uma notificação de informação
 */
export function showInfoNotification(message: string, description?: string): void {
  toast.info(message, {
    description,
    duration: 4000,
  });
}

/**
 * Wrapper para lidar com erros em operações assíncronas
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorTitle?: string;
    showSuccess?: boolean;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    
    if (options?.showSuccess !== false && options?.successMessage) {
      showSuccessNotification(options.successMessage);
    }
    
    return result;
  } catch (_error) {
    showErrorNotification(error, options?.errorTitle);
    console.error('Operation failed:', error);
    return null;
  }
}
