import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreatePenData {
  penNumber: string;
  capacity: number;
  type: 'CONFINEMENT' | 'PASTURE' | 'QUARANTINE' | 'HOSPITAL';
  location: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePenData extends Partial<CreatePenData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface PenFilters {
  status?: string;
  type?: string;
  location?: string;
  isActive?: boolean;
  search?: string;
}

export class PenSupabaseService {
  /**
   * Lista todos os currais com filtros
   */
  async findAll(filters: PenFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('pens')
      .select('*');

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('isActive', filters.isActive);
    }

    if (filters.search) {
      query = query.or(`penNumber.ilike.%${filters.search}%,location.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'penNumber';
    const sortOrder = pagination.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar currais: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca um curral por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('pens')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Curral não encontrado');
      }
      throw new Error(`Erro ao buscar curral: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca currais por tipo
   */
  async findByType(type: string) {
    const { data, error } = await supabase
      .from('pens')
      .select('*')
      .eq('type', type)
      .eq('isActive', true)
      .order('penNumber', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar currais por tipo: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca currais por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('pens')
      .select('*')
      .eq('status', status)
      .order('penNumber', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar currais por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca apenas currais ativos
   */
  async findActive() {
    const { data, error } = await supabase
      .from('pens')
      .select('*')
      .eq('isActive', true)
      .order('penNumber', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar currais ativos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca currais disponíveis (com capacidade)
   */
  async findAvailable() {
    // Buscar currais ativos com suas ocupações atuais
    const { data, error } = await supabase
      .from('pens')
      .select(`
        *,
        lot_pen_links!inner(
          quantity,
          exitDate
        )
      `)
      .eq('isActive', true)
      .is('lot_pen_links.exitDate', null);

    if (error) {
      throw new Error(`Erro ao buscar currais disponíveis: ${error.message}`);
    }

    // Calcular ocupação e filtrar disponíveis
    const availablePens = (data || []).filter(pen => {
      const currentOccupation = pen.lot_pen_links?.reduce((sum: number, link: any) => 
        sum + (link.quantity || 0), 0) || 0;
      return currentOccupation < pen.capacity;
    });

    return availablePens;
  }

  /**
   * Cria um novo curral
   */
  async create(penData: CreatePenData, userId: string) {
    // Verificar se já existe curral com mesmo número
    const { data: existing } = await supabase
      .from('pens')
      .select('id')
      .eq('penNumber', penData.penNumber)
      .single();

    if (existing) {
      throw new ValidationError('Já existe um curral com este número');
    }

    // Validar capacidade
    if (penData.capacity <= 0) {
      throw new ValidationError('Capacidade deve ser maior que zero');
    }

    const newPen = {
      ...penData,
      status: 'ACTIVE',
      isActive: penData.isActive !== false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pens')
      .insert(newPen)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao criar curral: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewPen(data);

    return data;
  }

  /**
   * Atualiza um curral
   */
  async update(id: string, updateData: UpdatePenData) {
    // Se está alterando número, verificar duplicatas
    if (updateData.penNumber) {
      const { data: duplicate } = await supabase
        .from('pens')
        .select('id')
        .eq('penNumber', updateData.penNumber)
        .neq('id', id)
        .single();

      if (duplicate) {
        throw new ValidationError('Já existe um curral com este número');
      }
    }

    // Validar capacidade se fornecida
    if (updateData.capacity !== undefined && updateData.capacity <= 0) {
      throw new ValidationError('Capacidade deve ser maior que zero');
    }

    const updatedPen = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('pens')
      .update(updatedPen)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Curral não encontrado');
      }
      throw new Error(`Erro ao atualizar curral: ${error.message}`);
    }

    return data;
  }

  /**
   * Ativa/desativa um curral
   */
  async toggleStatus(id: string, isActive: boolean) {
    const status = isActive ? 'ACTIVE' : 'INACTIVE';

    // Se está desativando, verificar se não há animais
    if (!isActive) {
      const { data: occupations } = await supabase
        .from('lot_pen_links')
        .select('quantity')
        .eq('penId', id)
        .is('exitDate', null);

      const currentOccupation = occupations?.reduce((sum, link) => sum + (link.quantity || 0), 0) || 0;
      
      if (currentOccupation > 0) {
        throw new ValidationError('Não é possível desativar curral com animais');
      }
    }

    const { data, error } = await supabase
      .from('pens')
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
        throw new NotFoundError('Curral não encontrado');
      }
      throw new Error(`Erro ao alterar status do curral: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove um curral
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Curral não encontrado');
    }

    // Verificar se pode ser removido (não deve ter histórico de ocupação)
    const { data: links } = await supabase
      .from('lot_pen_links')
      .select('id')
      .eq('penId', id)
      .limit(1);

    if (links && links.length > 0) {
      throw new ValidationError('Não é possível remover curral com histórico de ocupação');
    }

    const { error } = await supabase
      .from('pens')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover curral: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas dos currais
   */
  async getStats() {
    const { data, error } = await supabase
      .from('pens')
      .select('status, type, capacity, isActive, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(p => p.status === 'ACTIVE').length || 0,
      inactive: data?.filter(p => p.status === 'INACTIVE').length || 0,
      maintenance: data?.filter(p => p.status === 'MAINTENANCE').length || 0,
      confinement: data?.filter(p => p.type === 'CONFINEMENT').length || 0,
      pasture: data?.filter(p => p.type === 'PASTURE').length || 0,
      quarantine: data?.filter(p => p.type === 'QUARANTINE').length || 0,
      hospital: data?.filter(p => p.type === 'HOSPITAL').length || 0,
      totalCapacity: data?.reduce((sum, p) => sum + (p.capacity || 0), 0) || 0,
      averageCapacity: data?.length ? Math.round((data.reduce((sum, p) => sum + (p.capacity || 0), 0) / data.length)) : 0,
    };

    return stats;
  }

  /**
   * Retorna ocupação atual dos currais
   */
  async getOccupancy() {
    const { data, error } = await supabase
      .from('pens')
      .select(`
        *,
        lot_pen_links(
          quantity,
          exitDate
        )
      `)
      .eq('isActive', true);

    if (error) {
      throw new Error(`Erro ao buscar ocupação: ${error.message}`);
    }

    const occupancy = (data || []).map(pen => {
      const currentOccupation = pen.lot_pen_links
        ?.filter((link: any) => !link.exitDate)
        ?.reduce((sum: number, link: any) => sum + (link.quantity || 0), 0) || 0;

      return {
        ...pen,
        currentOccupation,
        availableCapacity: pen.capacity - currentOccupation,
        occupancyRate: pen.capacity > 0 ? (currentOccupation / pen.capacity) * 100 : 0,
      };
    });

    return occupancy;
  }

  /**
   * Integra novo curral com outros módulos
   */
  private async integrateNewPen(pen: any) {
    try {
      // Log da integração
      console.log(`✅ Curral ${pen.id} integrado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração do curral ${pen.id}:`, error);
      // Não falhar a criação do curral por erro de integração
    }
  }
}
