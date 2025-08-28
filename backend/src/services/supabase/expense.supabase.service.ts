import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreateExpenseData {
  description: string;
  value: number;
  dueDate: string;
  categoryId: string;
  payerAccountId: string;
  purchaseOrderId?: string;
  notes?: string;
  isPaid?: boolean;
  paidDate?: string;
  paidValue?: number;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {
  status?: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
}

export interface ExpenseFilters {
  status?: string;
  categoryId?: string;
  payerAccountId?: string;
  purchaseOrderId?: string;
  startDate?: string;
  endDate?: string;
  isPaid?: boolean;
  search?: string;
}

export class ExpenseSupabaseService {
  /**
   * Lista todas as despesas com filtros
   */
  async findAll(filters: ExpenseFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('expenses')
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*),
        purchaseOrder:purchase_orders!expenses_purchaseOrderId_fkey(*)
      `);

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.categoryId) {
      query = query.eq('categoryId', filters.categoryId);
    }

    if (filters.payerAccountId) {
      query = query.eq('payerAccountId', filters.payerAccountId);
    }

    if (filters.purchaseOrderId) {
      query = query.eq('purchaseOrderId', filters.purchaseOrderId);
    }

    if (filters.startDate) {
      query = query.gte('dueDate', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('dueDate', filters.endDate);
    }

    if (filters.isPaid !== undefined) {
      query = query.eq('isPaid', filters.isPaid);
    }

    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'dueDate';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar despesas: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca uma despesa por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*),
        purchaseOrder:purchase_orders!expenses_purchaseOrderId_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Despesa não encontrada');
      }
      throw new Error(`Erro ao buscar despesa: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca despesas por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*)
      `)
      .eq('status', status)
      .order('dueDate', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar despesas por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca despesas por categoria
   */
  async findByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*)
      `)
      .eq('categoryId', categoryId)
      .order('dueDate', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar despesas por categoria: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca despesas por ordem de compra
   */
  async findByPurchaseOrder(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*)
      `)
      .eq('purchaseOrderId', purchaseOrderId)
      .order('dueDate', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar despesas por ordem de compra: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cria uma nova despesa
   */
  async create(expenseData: CreateExpenseData, userId: string) {
    // Calcular status baseado na data de vencimento
    const status = this.calculateStatus(expenseData.dueDate, expenseData.isPaid);

    const newExpense = {
      ...expenseData,
      status,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .insert(newExpense)
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*),
        purchaseOrder:purchase_orders!expenses_purchaseOrderId_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao criar despesa: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewExpense(data);

    return data;
  }

  /**
   * Atualiza uma despesa
   */
  async update(id: string, updateData: UpdateExpenseData) {
    // Recalcular status se necessário
    let status = updateData.status;
    if (updateData.dueDate || updateData.isPaid !== undefined) {
      const existing = await this.findById(id);
      const dueDate = updateData.dueDate || existing.dueDate;
      const isPaid = updateData.isPaid !== undefined ? updateData.isPaid : existing.isPaid;
      status = this.calculateStatus(dueDate, isPaid);
    }

    const updatedExpense = {
      ...updateData,
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(updatedExpense)
      .eq('id', id)
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*),
        purchaseOrder:purchase_orders!expenses_purchaseOrderId_fkey(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Despesa não encontrada');
      }
      throw new Error(`Erro ao atualizar despesa: ${error.message}`);
    }

    return data;
  }

  /**
   * Marca uma despesa como paga
   */
  async markAsPaid(id: string, paidValue?: number, paidDate?: string) {
    const updateData = {
      isPaid: true,
      paidDate: paidDate || new Date().toISOString(),
      paidValue: paidValue,
      status: 'PAID',
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:cost_centers!expenses_categoryId_fkey(*),
        payerAccount:payer_accounts!expenses_payerAccountId_fkey(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Despesa não encontrada');
      }
      throw new Error(`Erro ao marcar despesa como paga: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove uma despesa
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Despesa não encontrada');
    }

    // Verificar se pode ser removida (não deve estar paga)
    if (existing.isPaid) {
      throw new ValidationError('Não é possível remover despesa já paga');
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover despesa: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas das despesas
   */
  async getStats() {
    const { data, error } = await supabase
      .from('expenses')
      .select('status, value, isPaid, dueDate, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const now = new Date();
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(e => e.status === 'PENDING').length || 0,
      paid: data?.filter(e => e.status === 'PAID').length || 0,
      overdue: data?.filter(e => e.status === 'OVERDUE').length || 0,
      cancelled: data?.filter(e => e.status === 'CANCELLED').length || 0,
      totalValue: data?.reduce((sum, e) => sum + (e.value || 0), 0) || 0,
      paidValue: data?.filter(e => e.isPaid).reduce((sum, e) => sum + (e.value || 0), 0) || 0,
      pendingValue: data?.filter(e => !e.isPaid).reduce((sum, e) => sum + (e.value || 0), 0) || 0,
      overdueValue: data?.filter(e => e.status === 'OVERDUE').reduce((sum, e) => sum + (e.value || 0), 0) || 0,
    };

    return stats;
  }

  /**
   * Calcula o status baseado na data de vencimento
   */
  private calculateStatus(dueDate: string, isPaid?: boolean): 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
    if (isPaid) return 'PAID';
    
    const due = new Date(dueDate);
    const now = new Date();
    
    if (due < now) return 'OVERDUE';
    return 'PENDING';
  }

  /**
   * Integra nova despesa com outros módulos
   */
  private async integrateNewExpense(expense: any) {
    try {
      // Criar eventos no calendário para vencimento
      await this.createExpenseEvents(expense);

      // Log da integração
      console.log(`✅ Despesa ${expense.id} integrada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração da despesa ${expense.id}:`, error);
      // Não falhar a criação da despesa por erro de integração
    }
  }

  /**
   * Cria eventos no calendário para a despesa
   */
  private async createExpenseEvents(expense: any) {
    const events = [];

    // Evento de vencimento
    events.push({
      title: `Vencimento - ${expense.description}`,
      description: `Despesa de R$ ${expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      date: expense.dueDate,
      type: 'EXPENSE_DUE',
      relatedId: expense.id,
      relatedType: 'EXPENSE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Evento de lembrete (3 dias antes do vencimento)
    const reminderDate = new Date(expense.dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    
    if (reminderDate > new Date()) {
      events.push({
        title: `Lembrete - ${expense.description}`,
        description: `Despesa vence em 3 dias - R$ ${expense.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        date: reminderDate.toISOString(),
        type: 'EXPENSE_REMINDER',
        relatedId: expense.id,
        relatedType: 'EXPENSE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (events.length > 0) {
      // Assumindo que existe uma tabela calendar_events
      const { error } = await supabase
        .from('calendar_events')
        .insert(events);

      if (error) {
        console.error('Erro ao criar eventos do calendário:', error);
      }
    }
  }
}
