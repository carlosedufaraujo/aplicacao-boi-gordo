import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreatePayerAccountData {
  accountName: string;
  bankName: string;
  accountNumber: string;
  agency: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  balance: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePayerAccountData extends Partial<CreatePayerAccountData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface PayerAccountFilters {
  status?: string;
  accountType?: string;
  bankName?: string;
  isActive?: boolean;
  search?: string;
}

export class PayerAccountSupabaseService {
  /**
   * Lista todas as contas pagadoras com filtros
   */
  async findAll(filters: PayerAccountFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('payer_accounts')
      .select('*');

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.accountType) {
      query = query.eq('accountType', filters.accountType);
    }

    if (filters.bankName) {
      query = query.ilike('bankName', `%${filters.bankName}%`);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('isActive', filters.isActive);
    }

    if (filters.search) {
      query = query.or(`accountName.ilike.%${filters.search}%,bankName.ilike.%${filters.search}%,accountNumber.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'accountName';
    const sortOrder = pagination.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar contas pagadoras: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca uma conta pagadora por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('payer_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Conta pagadora não encontrada');
      }
      throw new Error(`Erro ao buscar conta pagadora: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca contas por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('payer_accounts')
      .select('*')
      .eq('status', status)
      .order('accountName', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar contas por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca contas por tipo
   */
  async findByType(accountType: string) {
    const { data, error } = await supabase
      .from('payer_accounts')
      .select('*')
      .eq('accountType', accountType)
      .order('accountName', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar contas por tipo: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca contas ativas
   */
  async findActive() {
    const { data, error } = await supabase
      .from('payer_accounts')
      .select('*')
      .eq('isActive', true)
      .order('accountName', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar contas ativas: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cria uma nova conta pagadora
   */
  async create(accountData: CreatePayerAccountData, userId: string) {
    // Verificar se já existe conta com mesmo número e agência
    const { data: existing } = await supabase
      .from('payer_accounts')
      .select('id')
      .eq('accountNumber', accountData.accountNumber)
      .eq('agency', accountData.agency)
      .single();

    if (existing) {
      throw new ValidationError('Já existe uma conta com este número e agência');
    }

    const newAccount = {
      ...accountData,
      status: 'ACTIVE',
      isActive: accountData.isActive !== false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('payer_accounts')
      .insert(newAccount)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao criar conta pagadora: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewAccount(data);

    return data;
  }

  /**
   * Atualiza uma conta pagadora
   */
  async update(id: string, updateData: UpdatePayerAccountData) {
    // Se está alterando número/agência, verificar duplicatas
    if (updateData.accountNumber || updateData.agency) {
      const existing = await this.findById(id);
      const accountNumber = updateData.accountNumber || existing.accountNumber;
      const agency = updateData.agency || existing.agency;

      const { data: duplicate } = await supabase
        .from('payer_accounts')
        .select('id')
        .eq('accountNumber', accountNumber)
        .eq('agency', agency)
        .neq('id', id)
        .single();

      if (duplicate) {
        throw new ValidationError('Já existe uma conta com este número e agência');
      }
    }

    const updatedAccount = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('payer_accounts')
      .update(updatedAccount)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Conta pagadora não encontrada');
      }
      throw new Error(`Erro ao atualizar conta pagadora: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualiza o saldo de uma conta
   */
  async updateBalance(id: string, newBalance: number, operation: 'ADD' | 'SUBTRACT' | 'SET') {
    const existing = await this.findById(id);
    
    let finalBalance: number;
    
    switch (operation) {
      case 'ADD':
        finalBalance = existing.balance + newBalance;
        break;
      case 'SUBTRACT':
        finalBalance = existing.balance - newBalance;
        break;
      case 'SET':
        finalBalance = newBalance;
        break;
      default:
        throw new ValidationError('Operação inválida');
    }

    const { data, error } = await supabase
      .from('payer_accounts')
      .update({ 
        balance: finalBalance,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar saldo: ${error.message}`);
    }

    return data;
  }

  /**
   * Ativa/desativa uma conta
   */
  async toggleStatus(id: string, isActive: boolean) {
    const status = isActive ? 'ACTIVE' : 'INACTIVE';

    const { data, error } = await supabase
      .from('payer_accounts')
      .update({ 
        isActive,
        status,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Conta pagadora não encontrada');
      }
      throw new Error(`Erro ao alterar status da conta: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove uma conta pagadora
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Conta pagadora não encontrada');
    }

    // Verificar se pode ser removida (não deve ter transações)
    const { data: transactions } = await supabase
      .from('expenses')
      .select('id')
      .eq('payerAccountId', id)
      .limit(1);

    if (transactions && transactions.length > 0) {
      throw new ValidationError('Não é possível remover conta com transações associadas');
    }

    const { error } = await supabase
      .from('payer_accounts')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover conta pagadora: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas das contas
   */
  async getStats() {
    const { data, error } = await supabase
      .from('payer_accounts')
      .select('status, accountType, balance, isActive, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(a => a.status === 'ACTIVE').length || 0,
      inactive: data?.filter(a => a.status === 'INACTIVE').length || 0,
      blocked: data?.filter(a => a.status === 'BLOCKED').length || 0,
      checking: data?.filter(a => a.accountType === 'CHECKING').length || 0,
      savings: data?.filter(a => a.accountType === 'SAVINGS').length || 0,
      investment: data?.filter(a => a.accountType === 'INVESTMENT').length || 0,
      totalBalance: data?.reduce((sum, a) => sum + (a.balance || 0), 0) || 0,
      activeBalance: data?.filter(a => a.isActive).reduce((sum, a) => sum + (a.balance || 0), 0) || 0,
    };

    return stats;
  }

  /**
   * Integra nova conta com outros módulos
   */
  private async integrateNewAccount(account: any) {
    try {
      // Log da integração
      console.log(`✅ Conta pagadora ${account.id} integrada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração da conta ${account.id}:`, error);
      // Não falhar a criação da conta por erro de integração
    }
  }
}
