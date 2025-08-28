import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreateRevenueData {
  description: string;
  value: number;
  receivedDate: string;
  categoryId: string;
  payerAccountId: string;
  saleRecordId?: string;
  notes?: string;
  isReceived?: boolean;
  receivedValue?: number;
}

export interface UpdateRevenueData extends Partial<CreateRevenueData> {
  status?: 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED';
}

export interface RevenueFilters {
  status?: string;
  categoryId?: string;
  payerAccountId?: string;
  saleRecordId?: string;
  startDate?: string;
  endDate?: string;
  isReceived?: boolean;
  search?: string;
}

export class RevenueSupabaseService {
  /**
   * Lista todas as receitas com filtros
   */
  async findAll(filters: RevenueFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('revenues')
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*),
        saleRecord:sale_records!revenues_saleRecordId_fkey(*)
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

    if (filters.saleRecordId) {
      query = query.eq('saleRecordId', filters.saleRecordId);
    }

    if (filters.startDate) {
      query = query.gte('receivedDate', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('receivedDate', filters.endDate);
    }

    if (filters.isReceived !== undefined) {
      query = query.eq('isReceived', filters.isReceived);
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
    const sortBy = pagination.sortBy || 'receivedDate';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar receitas: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca uma receita por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('revenues')
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*),
        saleRecord:sale_records!revenues_saleRecordId_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Receita não encontrada');
      }
      throw new Error(`Erro ao buscar receita: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca receitas por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('revenues')
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*)
      `)
      .eq('status', status)
      .order('receivedDate', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar receitas por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca receitas por categoria
   */
  async findByCategory(categoryId: string) {
    const { data, error } = await supabase
      .from('revenues')
      .select(`
        *,
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*)
      `)
      .eq('categoryId', categoryId)
      .order('receivedDate', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar receitas por categoria: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca receitas por registro de venda
   */
  async findBySaleRecord(saleRecordId: string) {
    const { data, error } = await supabase
      .from('revenues')
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*)
      `)
      .eq('saleRecordId', saleRecordId)
      .order('receivedDate', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar receitas por venda: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cria uma nova receita
   */
  async create(revenueData: CreateRevenueData, userId: string) {
    // Calcular status baseado na data de recebimento
    const status = this.calculateStatus(revenueData.receivedDate, revenueData.isReceived);

    const newRevenue = {
      ...revenueData,
      status,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('revenues')
      .insert(newRevenue)
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*),
        saleRecord:sale_records!revenues_saleRecordId_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao criar receita: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewRevenue(data);

    return data;
  }

  /**
   * Atualiza uma receita
   */
  async update(id: string, updateData: UpdateRevenueData) {
    // Recalcular status se necessário
    let status = updateData.status;
    if (updateData.receivedDate || updateData.isReceived !== undefined) {
      const existing = await this.findById(id);
      const receivedDate = updateData.receivedDate || existing.receivedDate;
      const isReceived = updateData.isReceived !== undefined ? updateData.isReceived : existing.isReceived;
      status = this.calculateStatus(receivedDate, isReceived);
    }

    const updatedRevenue = {
      ...updateData,
      ...(status && { status }),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('revenues')
      .update(updatedRevenue)
      .eq('id', id)
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*),
        saleRecord:sale_records!revenues_saleRecordId_fkey(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Receita não encontrada');
      }
      throw new Error(`Erro ao atualizar receita: ${error.message}`);
    }

    return data;
  }

  /**
   * Marca uma receita como recebida
   */
  async markAsReceived(id: string, receivedValue?: number, receivedDate?: string) {
    const updateData = {
      isReceived: true,
      receivedDate: receivedDate || new Date().toISOString(),
      receivedValue: receivedValue,
      status: 'RECEIVED',
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('revenues')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        category:cost_centers!revenues_categoryId_fkey(*),
        payerAccount:payer_accounts!revenues_payerAccountId_fkey(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Receita não encontrada');
      }
      throw new Error(`Erro ao marcar receita como recebida: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove uma receita
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Receita não encontrada');
    }

    // Verificar se pode ser removida (não deve estar recebida)
    if (existing.isReceived) {
      throw new ValidationError('Não é possível remover receita já recebida');
    }

    const { error } = await supabase
      .from('revenues')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover receita: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas das receitas
   */
  async getStats() {
    const { data, error } = await supabase
      .from('revenues')
      .select('status, value, isReceived, receivedDate, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const now = new Date();
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(r => r.status === 'PENDING').length || 0,
      received: data?.filter(r => r.status === 'RECEIVED').length || 0,
      overdue: data?.filter(r => r.status === 'OVERDUE').length || 0,
      cancelled: data?.filter(r => r.status === 'CANCELLED').length || 0,
      totalValue: data?.reduce((sum, r) => sum + (r.value || 0), 0) || 0,
      receivedValue: data?.filter(r => r.isReceived).reduce((sum, r) => sum + (r.value || 0), 0) || 0,
      pendingValue: data?.filter(r => !r.isReceived).reduce((sum, r) => sum + (r.value || 0), 0) || 0,
      overdueValue: data?.filter(r => r.status === 'OVERDUE').reduce((sum, r) => sum + (r.value || 0), 0) || 0,
    };

    return stats;
  }

  /**
   * Calcula o status baseado na data de recebimento
   */
  private calculateStatus(receivedDate: string, isReceived?: boolean): 'PENDING' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED' {
    if (isReceived) return 'RECEIVED';
    
    const due = new Date(receivedDate);
    const now = new Date();
    
    if (due < now) return 'OVERDUE';
    return 'PENDING';
  }

  /**
   * Integra nova receita com outros módulos
   */
  private async integrateNewRevenue(revenue: any) {
    try {
      // Criar eventos no calendário para recebimento
      await this.createRevenueEvents(revenue);

      // Log da integração
      console.log(`✅ Receita ${revenue.id} integrada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração da receita ${revenue.id}:`, error);
      // Não falhar a criação da receita por erro de integração
    }
  }

  /**
   * Cria eventos no calendário para a receita
   */
  private async createRevenueEvents(revenue: any) {
    const events = [];

    // Evento de recebimento
    events.push({
      title: `Recebimento - ${revenue.description}`,
      description: `Receita de R$ ${revenue.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      date: revenue.receivedDate,
      type: 'REVENUE_DUE',
      relatedId: revenue.id,
      relatedType: 'REVENUE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Evento de lembrete (3 dias antes do recebimento)
    const reminderDate = new Date(revenue.receivedDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    
    if (reminderDate > new Date()) {
      events.push({
        title: `Lembrete - ${revenue.description}`,
        description: `Receita a receber em 3 dias - R$ ${revenue.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        date: reminderDate.toISOString(),
        type: 'REVENUE_REMINDER',
        relatedId: revenue.id,
        relatedType: 'REVENUE',
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
