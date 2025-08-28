import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreateCattleLotData {
  purchaseOrderId: string;
  entryDate: string;
  currentQuantity: number;
  initialQuantity: number;
  averageWeight: number;
  breed?: string;
  origin: string;
  healthStatus: 'HEALTHY' | 'QUARANTINE' | 'SICK' | 'TREATMENT';
  notes?: string;
}

export interface UpdateCattleLotData extends Partial<CreateCattleLotData> {
  status?: 'ACTIVE' | 'SOLD' | 'TRANSFERRED' | 'DECEASED';
}

export interface CattleLotFilters {
  status?: string;
  healthStatus?: string;
  purchaseOrderId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class CattleLotSupabaseService {
  /**
   * Lista todos os lotes de gado com filtros
   */
  async findAll(filters: CattleLotFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('cattle_lots')
      .select(`
        *,
        purchaseOrder:purchase_orders!cattle_lots_purchaseOrderId_fkey(*),
        penAllocations:pen_allocations!pen_allocations_cattleLotId_fkey(
          *,
          pen:pens!pen_allocations_penId_fkey(*)
        )
      `);

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.healthStatus) {
      query = query.eq('healthStatus', filters.healthStatus);
    }

    if (filters.purchaseOrderId) {
      query = query.eq('purchaseOrderId', filters.purchaseOrderId);
    }

    if (filters.startDate) {
      query = query.gte('entryDate', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('entryDate', filters.endDate);
    }

    if (filters.search) {
      query = query.or(`origin.ilike.%${filters.search}%,breed.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'entryDate';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar lotes de gado: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca um lote de gado por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('cattle_lots')
      .select(`
        *,
        purchaseOrder:purchase_orders!cattle_lots_purchaseOrderId_fkey(*),
        penAllocations:pen_allocations!pen_allocations_cattleLotId_fkey(
          *,
          pen:pens!pen_allocations_penId_fkey(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Lote de gado não encontrado');
      }
      throw new Error(`Erro ao buscar lote de gado: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca lotes por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('cattle_lots')
      .select(`
        *,
        purchaseOrder:purchase_orders!cattle_lots_purchaseOrderId_fkey(*)
      `)
      .eq('status', status)
      .order('entryDate', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar lotes por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca lotes por ordem de compra
   */
  async findByPurchaseOrder(purchaseOrderId: string) {
    const { data, error } = await supabase
      .from('cattle_lots')
      .select(`
        *,
        penAllocations:pen_allocations!pen_allocations_cattleLotId_fkey(
          *,
          pen:pens!pen_allocations_penId_fkey(*)
        )
      `)
      .eq('purchaseOrderId', purchaseOrderId)
      .order('entryDate', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar lotes por ordem de compra: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cria um novo lote de gado
   */
  async create(lotData: CreateCattleLotData, userId: string) {
    const newLot = {
      ...lotData,
      status: 'ACTIVE',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cattle_lots')
      .insert(newLot)
      .select(`
        *,
        purchaseOrder:purchase_orders!cattle_lots_purchaseOrderId_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(`Erro ao criar lote de gado: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewLot(data);

    return data;
  }

  /**
   * Atualiza um lote de gado
   */
  async update(id: string, updateData: UpdateCattleLotData) {
    const updatedLot = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cattle_lots')
      .update(updatedLot)
      .eq('id', id)
      .select(`
        *,
        purchaseOrder:purchase_orders!cattle_lots_purchaseOrderId_fkey(*)
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Lote de gado não encontrado');
      }
      throw new Error(`Erro ao atualizar lote de gado: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove um lote de gado
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Lote de gado não encontrado');
    }

    // Verificar se pode ser removido (não deve ter alocações ativas)
    if (existing.penAllocations && existing.penAllocations.length > 0) {
      throw new ValidationError('Não é possível remover lote com alocações de currais');
    }

    const { error } = await supabase
      .from('cattle_lots')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover lote de gado: ${error.message}`);
    }
  }

  /**
   * Aloca animais em currais
   */
  async allocateToPens(lotId: string, allocations: Array<{ penId: string; quantity: number }>) {
    try {
      // Verificar se o lote existe
      const lot = await this.findById(lotId);
      if (!lot) {
        throw new NotFoundError('Lote não encontrado');
      }

      // Verificar se a quantidade total não excede a disponível
      const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
      if (totalAllocated > lot.currentQuantity) {
        throw new ValidationError('Quantidade alocada excede a disponível no lote');
      }

      // Criar alocações
      const allocationData = allocations.map(alloc => ({
        cattleLotId: lotId,
        penId: alloc.penId,
        quantity: alloc.quantity,
        allocationDate: new Date().toISOString(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('pen_allocations')
        .insert(allocationData)
        .select(`
          *,
          pen:pens!pen_allocations_penId_fkey(*)
        `);

      if (error) {
        throw new Error(`Erro ao alocar animais: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erro na alocação de currais:', error);
      throw error;
    }
  }

  /**
   * Retorna estatísticas dos lotes
   */
  async getStats() {
    const { data, error } = await supabase
      .from('cattle_lots')
      .select('status, healthStatus, currentQuantity, initialQuantity, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(l => l.status === 'ACTIVE').length || 0,
      sold: data?.filter(l => l.status === 'SOLD').length || 0,
      transferred: data?.filter(l => l.status === 'TRANSFERRED').length || 0,
      deceased: data?.filter(l => l.status === 'DECEASED').length || 0,
      healthy: data?.filter(l => l.healthStatus === 'HEALTHY').length || 0,
      quarantine: data?.filter(l => l.healthStatus === 'QUARANTINE').length || 0,
      sick: data?.filter(l => l.healthStatus === 'SICK').length || 0,
      treatment: data?.filter(l => l.healthStatus === 'TREATMENT').length || 0,
      totalAnimals: data?.reduce((sum, l) => sum + (l.currentQuantity || 0), 0) || 0,
      initialAnimals: data?.reduce((sum, l) => sum + (l.initialQuantity || 0), 0) || 0,
    };

    return stats;
  }

  /**
   * Integra novo lote com outros módulos
   */
  private async integrateNewLot(lot: any) {
    try {
      // Criar eventos no calendário para acompanhamento
      await this.createLotEvents(lot);

      // Log da integração
      console.log(`✅ Lote ${lot.id} integrado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração do lote ${lot.id}:`, error);
      // Não falhar a criação do lote por erro de integração
    }
  }

  /**
   * Cria eventos no calendário para o lote
   */
  private async createLotEvents(lot: any) {
    const events = [];

    // Evento de entrada do lote
    events.push({
      title: `Entrada de Lote - ${lot.initialQuantity} animais`,
      description: `Lote de ${lot.breed || 'gado'} - ${lot.origin}`,
      date: lot.entryDate,
      type: 'LOT_ENTRY',
      relatedId: lot.id,
      relatedType: 'CATTLE_LOT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Evento de acompanhamento (30 dias após entrada)
    const followUpDate = new Date(lot.entryDate);
    followUpDate.setDate(followUpDate.getDate() + 30);
    
    events.push({
      title: `Acompanhamento de Lote`,
      description: `Verificar status do lote de ${lot.initialQuantity} animais`,
      date: followUpDate.toISOString(),
      type: 'LOT_FOLLOWUP',
      relatedId: lot.id,
      relatedType: 'CATTLE_LOT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

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
