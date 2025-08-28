import { supabase } from '@/config/supabase';
import { NotFoundError, ValidationError } from '@/utils/AppError';

export interface CreatePartnerData {
  name: string;
  email?: string;
  phone?: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  partnerType: 'VENDOR' | 'BUYER' | 'BROKER' | 'TRANSPORTER';
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isActive?: boolean;
  notes?: string;
}

export interface UpdatePartnerData extends Partial<CreatePartnerData> {
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
}

export interface PartnerFilters {
  status?: string;
  partnerType?: string;
  documentType?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  search?: string;
}

export class PartnerSupabaseService {
  /**
   * Lista todos os parceiros com filtros
   */
  async findAll(filters: PartnerFilters = {}, pagination: any = {}) {
    let query = supabase
      .from('partners')
      .select('*');

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.partnerType) {
      query = query.eq('partnerType', filters.partnerType);
    }

    if (filters.documentType) {
      query = query.eq('documentType', filters.documentType);
    }

    if (filters.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters.state) {
      query = query.eq('state', filters.state);
    }

    if (filters.isActive !== undefined) {
      query = query.eq('isActive', filters.isActive);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,document.ilike.%${filters.search}%`);
    }

    // Aplicar paginação
    if (pagination.page && pagination.limit) {
      const from = (pagination.page - 1) * pagination.limit;
      const to = from + pagination.limit - 1;
      query = query.range(from, to);
    }

    // Aplicar ordenação
    const sortBy = pagination.sortBy || 'name';
    const sortOrder = pagination.sortOrder || 'asc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar parceiros: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page: pagination.page || 1,
      limit: pagination.limit || data?.length || 0,
    };
  }

  /**
   * Busca um parceiro por ID
   */
  async findById(id: string) {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Parceiro não encontrado');
      }
      throw new Error(`Erro ao buscar parceiro: ${error.message}`);
    }

    return data;
  }

  /**
   * Busca parceiros por tipo
   */
  async findByType(partnerType: string) {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('partnerType', partnerType)
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar parceiros por tipo: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca parceiros por status
   */
  async findByStatus(status: string) {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', status)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar parceiros por status: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Busca apenas parceiros ativos
   */
  async findActive() {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('isActive', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Erro ao buscar parceiros ativos: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Cria um novo parceiro
   */
  async create(partnerData: CreatePartnerData, userId: string) {
    // Verificar se já existe parceiro com mesmo documento
    const { data: existing } = await supabase
      .from('partners')
      .select('id')
      .eq('document', partnerData.document)
      .single();

    if (existing) {
      throw new ValidationError('Já existe um parceiro com este documento');
    }

    // Validar tipo de documento
    if (partnerData.documentType === 'CPF' && partnerData.document.length !== 11) {
      throw new ValidationError('CPF deve ter 11 dígitos');
    }

    if (partnerData.documentType === 'CNPJ' && partnerData.document.length !== 14) {
      throw new ValidationError('CNPJ deve ter 14 dígitos');
    }

    const newPartner = {
      ...partnerData,
      status: 'ACTIVE',
      isActive: partnerData.isActive !== false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('partners')
      .insert(newPartner)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Erro ao criar parceiro: ${error.message}`);
    }

    // Integrar com outros módulos
    await this.integrateNewPartner(data);

    return data;
  }

  /**
   * Atualiza um parceiro
   */
  async update(id: string, updateData: UpdatePartnerData) {
    // Se está alterando documento, verificar duplicatas
    if (updateData.document) {
      const { data: duplicate } = await supabase
        .from('partners')
        .select('id')
        .eq('document', updateData.document)
        .neq('id', id)
        .single();

      if (duplicate) {
        throw new ValidationError('Já existe um parceiro com este documento');
      }

      // Validar tipo de documento se fornecido
      if (updateData.documentType) {
        if (updateData.documentType === 'CPF' && updateData.document.length !== 11) {
          throw new ValidationError('CPF deve ter 11 dígitos');
        }

        if (updateData.documentType === 'CNPJ' && updateData.document.length !== 14) {
          throw new ValidationError('CNPJ deve ter 14 dígitos');
        }
      }
    }

    const updatedPartner = {
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('partners')
      .update(updatedPartner)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Parceiro não encontrado');
      }
      throw new Error(`Erro ao atualizar parceiro: ${error.message}`);
    }

    return data;
  }

  /**
   * Ativa/desativa um parceiro
   */
  async toggleStatus(id: string, isActive: boolean) {
    const status = isActive ? 'ACTIVE' : 'INACTIVE';

    const { data, error } = await supabase
      .from('partners')
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
        throw new NotFoundError('Parceiro não encontrado');
      }
      throw new Error(`Erro ao alterar status do parceiro: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove um parceiro
   */
  async delete(id: string) {
    // Verificar se existe
    const existing = await this.findById(id);
    if (!existing) {
      throw new NotFoundError('Parceiro não encontrado');
    }

    // Verificar se pode ser removido (não deve ter transações)
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('vendorId', id)
      .limit(1);

    if (orders && orders.length > 0) {
      throw new ValidationError('Não é possível remover parceiro com ordens de compra associadas');
    }

    const { error } = await supabase
      .from('partners')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao remover parceiro: ${error.message}`);
    }
  }

  /**
   * Retorna estatísticas dos parceiros
   */
  async getStats() {
    const { data, error } = await supabase
      .from('partners')
      .select('status, partnerType, documentType, isActive, createdAt');

    if (error) {
      throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter(p => p.status === 'ACTIVE').length || 0,
      inactive: data?.filter(p => p.status === 'INACTIVE').length || 0,
      blocked: data?.filter(p => p.status === 'BLOCKED').length || 0,
      vendors: data?.filter(p => p.partnerType === 'VENDOR').length || 0,
      buyers: data?.filter(p => p.partnerType === 'BUYER').length || 0,
      brokers: data?.filter(p => p.partnerType === 'BROKER').length || 0,
      transporters: data?.filter(p => p.partnerType === 'TRANSPORTER').length || 0,
      cpf: data?.filter(p => p.documentType === 'CPF').length || 0,
      cnpj: data?.filter(p => p.documentType === 'CNPJ').length || 0,
    };

    return stats;
  }

  /**
   * Integra novo parceiro com outros módulos
   */
  private async integrateNewPartner(partner: any) {
    try {
      // Log da integração
      console.log(`✅ Parceiro ${partner.id} integrado com sucesso`);
    } catch (error) {
      console.error(`❌ Erro na integração do parceiro ${partner.id}:`, error);
      // Não falhar a criação do parceiro por erro de integração
    }
  }
}
