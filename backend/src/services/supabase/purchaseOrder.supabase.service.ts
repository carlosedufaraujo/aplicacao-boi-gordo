import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreatePurchaseOrderData {
  vendorId: string;
  brokerId?: string;
  location: string;
  purchaseDate: string;
  animalCount: number;
  animalType: 'CATTLE' | 'BULL' | 'COW';
  averageAge?: number;
  totalWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  commission: number;
  freightCost?: number;
  otherCosts?: number;
  paymentType: 'CASH' | 'INSTALLMENT' | 'FINANCING';
  payerAccountId: string;
  principalDueDate: string;
  commissionDueDate?: string;
  otherCostsDueDate?: string;
  notes?: string;
}

export interface UpdatePurchaseOrderData extends Partial<CreatePurchaseOrderData> {
  status?: 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  currentStage?: string;
}

export interface PurchaseOrderFilters {
  status?: string;
  currentStage?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class PurchaseOrderSupabaseService {
  /**
   * Lista todas as ordens de compra com filtros
   */
  async findAll(filters: PurchaseOrderFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:partners!purchase_orders_vendorId_fkey(*),
        broker:partners!purchase_orders_brokerId_fkey(*),
        payerAccount:payer_accounts!purchase_orders_payerAccountId_fkey(*)
      `);

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.currentStage) {
      query = query.eq('currentStage', filters.currentStage);
    }

    if (filters.vendorId) {
      query = query.eq('vendorId', filters.vendorId);
    }

    if (filters.startDate) {
      query = query.gte('purchaseDate', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('purchaseDate', filters.endDate);
    }

    if (filters.search) {
      query = query.or(`orderNumber.ilike.%${filters.search}%,location.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'createdAt';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar ordens de compra: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca uma ordem de compra por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:partners!purchase_orders_vendorId_fkey(*),
        broker:partners!purchase_orders_brokerId_fkey(*),
        payerAccount:payer_accounts!purchase_orders_payerAccountId_fkey(*),
        cattleLot:cattle_lots!cattle_lots_purchaseOrderId_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ordem de compra não encontrada');
      }
      throw new Error(`Erro ao buscar ordem de compra: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca ordens por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:partners!purchase_orders_vendorId_fkey(*),
        payerAccount:payer_accounts!purchase_orders_payerAccountId_fkey(*)
      `)
      .eq('status', status)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar ordens por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca ordens por etapa
   */
  async findByStage(stage: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        vendor:partners!purchase_orders_vendorId_fkey(*),
        payerAccount:payer_accounts!purchase_orders_payerAccountId_fkey(*)
      `)
      .eq('currentStage', stage)
      .order('createdAt', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar ordens por etapa: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cria uma nova ordem de compra
   */
  async create(orderData: CreatePurchaseOrderData, userId: string) {
    // Gerar número único da ordem
    const orderNumber = await this.generateOrderNumber();

    // Calcular valores
    const calculatedData = this.calculateOrderValues(orderData);

    const newOrder = {
      ...orderData,
      ...calculatedData,
      orderNumber,
      userId,
      status: 'PENDING',
      currentStage: 'NEGOTIATION',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('purchase_orders')
      .insert(newOrder)
      .select(`
        *,
        vendor:partners!purchase_orders_vendorId_fkey(*),
        payerAccount:payer_accounts!purchase_orders_payerAccountId_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao criar ordem de compra: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewOrder(data);

    return data;
  }

  /**
   * Atualiza uma ordem de compra
   */
  async update(id: string, updateData: UpdatePurchaseOrderData) {
    // Recalcular valores se necessário
    const calculatedData = this.calculateOrderValues(updateData);

    const updatedOrder = {
      ...updateData,
      ...calculatedData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('purchase_orders')
      .update(updatedOrder)
      .eq('id', id)
      .select(`
        *,
        vendor:partners!purchase_orders_vendorId_fkey(*),
        payerAccount:payer_accounts!purchase_orders_payerAccountId_fkey(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ordem de compra não encontrada');
      }
      throw new Error(`Erro ao atualizar ordem de compra: ${error.message}`);
    }

    return data;
  }

  /**
   * Atualiza apenas a etapa da ordem
   */
  async updateStage(id: string, stage: string) {
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ 
        currentStage: stage,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ordem de compra não encontrada');
      }
      throw new Error(`Erro ao atualizar etapa: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove uma ordem de compra
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Ordem de compra não encontrada');
    }

    // Verificar se pode ser removida (não deve ter lote associado)
    if (existing.cattleLot && existing.cattleLot.length > 0) {
      throw new ValidationError('Não é possível remover ordem com lote associado');
    }

    const { error } = await supabase
      .from('purchase_orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover ordem de compra: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas das ordens
   */
  async getStats() {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('status, animalCount, totalValue, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(o => o.status === 'PENDING').length || 0,
      confirmed: data?.filter(o => o.status === 'CONFIRMED').length || 0,
      inTransit: data?.filter(o => o.status === 'IN_TRANSIT').length || 0,
      received: data?.filter(o => o.status === 'RECEIVED').length || 0,
      cancelled: data?.filter(o => o.status === 'CANCELLED').length || 0,
      totalAnimals: data?.reduce((sum, o) => sum + (o.animalCount || 0), 0) || 0,
      totalValue: data?.reduce((sum, o) => sum + (o.totalValue || 0), 0) || 0,
    };

    return stats;
  }

  /**
   * Gera número único da ordem
   */
  private async generateOrderNumber(): Promise<string> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('orderNumber')
      .order('orderNumber', { ascending: false })
      .limit(1);

    if (error) {
      // Se der erro, usar timestamp como fallback
      return `ORD-${Date.now()}`;
    }

    const lastOrder = data?.[0];
    if (!lastOrder) {
      return 'ORD-000001';
    }

    // Extrair número da última ordem
    const lastNumber = parseInt(lastOrder.orderNumber.split('-')[1]) || 0;
    const newNumber = lastNumber + 1;

    return `ORD-${newNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Calcula valores da ordem
   */
  private calculateOrderValues(orderData: any) {
    const carcassWeight = (orderData.totalWeight || 0) * ((orderData.carcassYield || 0) / 100);
    const arrobas = carcassWeight / 15;
    const animalValue = arrobas * (orderData.pricePerArroba || 0);
    const totalValue = animalValue + (orderData.commission || 0) + (orderData.freightCost || 0) + (orderData.otherCosts || 0);

    return {
      carcassWeight,
      arrobas,
      animalValue,
      totalValue,
    };
  }

  /**
   * Integra nova ordem com outros módulos
   */
  private async integrateNewOrder(order: any) {
    try {
      // Criar despesas relacionadas
      await this.createOrderExpenses(order);

      // Criar eventos no calendário
      await this.createCalendarEvents(order);

      // Log da integração
      console.log(`✅ Ordem ${order.orderNumber} integrada com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração da ordem ${order.orderNumber}:`, error);
      // Não falhar a criação da ordem por erro de integração
    }
  }

  /**
   * Cria despesas relacionadas à ordem
   */
  private async createOrderExpenses(order: any) {
    const expenses = [];

    // Despesa principal (valor dos animais)
    if (order.animalValue > 0) {
      expenses.push({
        description: `Compra de gado - ${order.orderNumber}`,
        value: order.animalValue,
        dueDate: order.principalDueDate,
        categoryId: 'ACQUISITION',
        payerAccountId: order.payerAccountId,
        purchaseOrderId: order.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Despesa de comissão
    if (order.commission > 0) {
      expenses.push({
        description: `Comissão - ${order.orderNumber}`,
        value: order.commission,
        dueDate: order.commissionDueDate || order.principalDueDate,
        categoryId: 'COMMISSION',
        payerAccountId: order.payerAccountId,
        purchaseOrderId: order.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Despesa de frete
    if (order.freightCost > 0) {
      expenses.push({
        description: `Frete - ${order.orderNumber}`,
        value: order.freightCost,
        dueDate: order.principalDueDate,
        categoryId: 'FREIGHT',
        payerAccountId: order.payerAccountId,
        purchaseOrderId: order.id,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (expenses.length > 0) {
      const { error } = await supabase
        .from('expenses')
        .insert(expenses);

      if (error) {
        console.error('Erro ao criar despesas:', error);
      }
    }
  }

  /**
   * Cria eventos no calendário
   */
  private async createCalendarEvents(order: any) {
    const events = [];

    // Evento de vencimento principal
    events.push({
      title: `Vencimento - ${order.orderNumber}`,
      description: `Vencimento da compra de gado - ${order.animalCount} animais`,
      date: order.principalDueDate,
      type: 'PAYMENT_DUE',
      relatedId: order.id,
      relatedType: 'PURCHASE_ORDER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Evento de vencimento da comissão (se diferente)
    if (order.commissionDueDate && order.commissionDueDate !== order.principalDueDate) {
      events.push({
        title: `Vencimento Comissão - ${order.orderNumber}`,
        description: `Vencimento da comissão`,
        date: order.commissionDueDate,
        type: 'COMMISSION_DUE',
        relatedId: order.id,
        relatedType: 'PURCHASE_ORDER',
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
