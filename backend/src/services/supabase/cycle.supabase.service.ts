import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreateCycleData {
  name: string;
  description?: string;
  startDate: string;
  expectedEndDate: string;
  targetWeight?: number;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateCycleData extends Partial<CreateCycleData> {
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  actualEndDate?: string;
}

export interface CycleFilters {
  status?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export class CycleSupabaseService {
  /**
   * Lista todos os ciclos com filtros
   */
  async findAll(filters: CycleFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('cycles')
      .select('*');

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('isActive', filters.isActive);
    }

    if (filters.startDate) {
      query = query.gte('startDate', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('expectedEndDate', filters.endDate);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'startDate';
    const sortOrder = pagination.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar ciclos: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca um ciclo por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ciclo não encontrado');
      }
      throw new Error(`Erro ao buscar ciclo: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca ciclos por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('status', status)
      .order('startDate', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar ciclos por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca apenas ciclos ativos
   */
  async findActive() {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('isActive', true)
      .order('startDate', { ascending: false });

    if (error) {
      throw new Error(`Erro ao buscar ciclos ativos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca ciclo atual (ativo mais recente)
   */
  async findCurrent() {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('isActive', true)
      .eq('status', 'ACTIVE')
      .order('startDate', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Nenhum ciclo ativo encontrado
      }
      throw new Error(`Erro ao buscar ciclo atual: ${error.message}`);
    }

    return data;
  }

  /**
   * Cria um novo ciclo
   */
  async create(cycleData: CreateCycleData, userId: string) {
    // Verificar se já existe ciclo com mesmo nome
    const { data: existing } = await supabase
      .from('cycles')
      .select('id')
      .eq('name', cycleData.name)
      .single();

    if (existing) {
      throw new ValidationError('Já existe um ciclo com este nome');
    }

    // Validar datas
    const startDate = new Date(cycleData.startDate);
    const endDate = new Date(cycleData.expectedEndDate);

    if (endDate <= startDate) {
      throw new ValidationError('Data de término deve ser posterior à data de início');
    }

    // Validar peso alvo se fornecido
    if (cycleData.targetWeight !== undefined && cycleData.targetWeight <= 0) {
      throw new ValidationError('Peso alvo deve ser maior que zero');
    }

    const newCycle = {
      ...cycleData,
      status: 'ACTIVE',
      isActive: cycleData.isActive !== false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cycles')
      .insert(newCycle)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao criar ciclo: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewCycle(data);

    return data;
  }

  /**
   * Atualiza um ciclo
   */
  async update(id: string, updateData: UpdateCycleData) {
    // Se está alterando nome, verificar duplicatas
    if (updateData.name) {
      const { data: duplicate } = await supabase
        .from('cycles')
        .select('id')
        .eq('name', updateData.name)
        .neq('id', id)
        .single();

      if (duplicate) {
        throw new ValidationError('Já existe um ciclo com este nome');
      }
    }

    // Validar datas se fornecidas
    if (updateData.startDate || updateData.expectedEndDate) {
      const existing = await this.findById(id);
      const startDate = new Date(updateData.startDate || existing.startDate);
      const endDate = new Date(updateData.expectedEndDate || existing.expectedEndDate);

      if (endDate <= startDate) {
        throw new ValidationError('Data de término deve ser posterior à data de início');
      }
    }

    // Validar peso alvo se fornecido
    if (updateData.targetWeight !== undefined && updateData.targetWeight <= 0) {
      throw new ValidationError('Peso alvo deve ser maior que zero');
    }

    const updatedCycle = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cycles')
      .update(updatedCycle)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ciclo não encontrado');
      }
      throw new Error(`Erro ao atualizar ciclo: ${error.message}`);
    }

    return data;
  }

  /**
   * Completa um ciclo
   */
  async complete(id: string, actualEndDate?: string) {
    const updateData = {
      status: 'COMPLETED',
      isActive: false,
      actualEndDate: actualEndDate || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cycles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ciclo não encontrado');
      }
      throw new Error(`Erro ao completar ciclo: ${error.message}`);
    }

    return data;
  }

  /**
   * Cancela um ciclo
   */
  async cancel(id: string, reason?: string) {
    const updateData = {
      status: 'CANCELLED',
      isActive: false,
      actualEndDate: new Date().toISOString(),
      notes: reason ? `Cancelado: ${reason}` : 'Ciclo cancelado',
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('cycles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Ciclo não encontrado');
      }
      throw new Error(`Erro ao cancelar ciclo: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove um ciclo
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Ciclo não encontrado');
    }

    // Verificar se pode ser removido (não deve ter lotes associados)
    const { data: lots } = await supabase
      .from('cattle_lots')
      .select('id')
      .eq('cycleId', id)
      .limit(1);

    if (lots && lots.length > 0) {
      throw new ValidationError('Não é possível remover ciclo com lotes associados');
    }

    const { error } = await supabase
      .from('cycles')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover ciclo: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas dos ciclos
   */
  async getStats() {
    const { data, error } = await supabase
      .from('cycles')
      .select('status, targetWeight, startDate, expectedEndDate, actualEndDate, isActive, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const now = new Date();
    const stats = {
      total: data?.length || 0,
      active: data?.filter(c => c.status === 'ACTIVE').length || 0,
      completed: data?.filter(c => c.status === 'COMPLETED').length || 0,
      cancelled: data?.filter(c => c.status === 'CANCELLED').length || 0,
      overdue: data?.filter(c => 
        c.status === 'ACTIVE' && 
        new Date(c.expectedEndDate) < now
      ).length || 0,
      averageDuration: this.calculateAverageDuration(data || []),
      totalTargetWeight: data?.reduce((sum, c) => sum + (c.targetWeight || 0), 0) || 0,
    };

    return stats;
  }

  /**
   * Calcula duração média dos ciclos completados
   */
  private calculateAverageDuration(cycles: any[]): number {
    const completedCycles = cycles.filter(c => c.status === 'COMPLETED' && c.actualEndDate);
    
    if (completedCycles.length === 0) return 0;

    const totalDays = completedCycles.reduce((sum, cycle) => {
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.actualEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);

    return Math.round(totalDays / completedCycles.length);
  }

  /**
   * Integra novo ciclo com outros módulos
   */
  private async integrateNewCycle(cycle: any) {
    try {
      // Criar eventos no calendário para o ciclo
      await this.createCycleEvents(cycle);

      // Log da integração
      console.log(`✅ Ciclo ${cycle.id} integrado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração do ciclo ${cycle.id}:`, error);
      // Não falhar a criação do ciclo por erro de integração
    }
  }

  /**
   * Cria eventos no calendário para o ciclo
   */
  private async createCycleEvents(cycle: any) {
    const events = [];

    // Evento de início do ciclo
    events.push({
      title: `Início - ${cycle.name}`,
      description: cycle.description || `Início do ciclo ${cycle.name}`,
      date: cycle.startDate,
      type: 'CYCLE_START',
      relatedId: cycle.id,
      relatedType: 'CYCLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Evento de término esperado
    events.push({
      title: `Término Esperado - ${cycle.name}`,
      description: `Término esperado do ciclo ${cycle.name}`,
      date: cycle.expectedEndDate,
      type: 'CYCLE_END',
      relatedId: cycle.id,
      relatedType: 'CYCLE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Evento de acompanhamento (meio do ciclo)
    const startDate = new Date(cycle.startDate);
    const endDate = new Date(cycle.expectedEndDate);
    const midDate = new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) / 2);

    events.push({
      title: `Acompanhamento - ${cycle.name}`,
      description: `Acompanhamento do meio do ciclo ${cycle.name}`,
      date: midDate.toISOString(),
      type: 'CYCLE_FOLLOWUP',
      relatedId: cycle.id,
      relatedType: 'CYCLE',
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
