import { supabase } from '@/config/supabase';

export interface Sale {
  id: string;
  saleNumber: string;
  lotId: string;
  buyerId: string;
  designationDate: string;
  slaughterPlant: string;
  expectedDate: string;
  shipmentDate?: string;
  shipmentWeight?: number;
  transportCompany?: string;
  slaughterDate?: string;
  slaughterWeight?: number;
  carcassYield?: number;
  pricePerArroba?: number;
  totalValue?: number;
  invoiceNumber?: string;
  paymentDate?: string;
  status: 'NEXT_SLAUGHTER' | 'SCHEDULED' | 'SHIPPED' | 'SLAUGHTERED' | 'RECONCILED' | 'CANCELLED';
  userId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleData {
  lotId: string;
  buyerId: string;
  designationDate: string;
  slaughterPlant: string;
  expectedDate: string;
  pricePerArroba?: number;
  notes?: string;
}

export interface UpdateSaleData {
  designationDate?: string;
  slaughterPlant?: string;
  expectedDate?: string;
  shipmentDate?: string;
  shipmentWeight?: number;
  transportCompany?: string;
  slaughterDate?: string;
  slaughterWeight?: number;
  carcassYield?: number;
  pricePerArroba?: number;
  totalValue?: number;
  invoiceNumber?: string;
  paymentDate?: string;
  status?: 'NEXT_SLAUGHTER' | 'SCHEDULED' | 'SHIPPED' | 'SLAUGHTERED' | 'RECONCILED' | 'CANCELLED';
  notes?: string;
}

export interface SaleFilters {
  status?: string;
  buyerId?: string;
  lotId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SaleStats {
  totalSales: number;
  totalValue: number;
  averageValue: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  recentSales: number;
}

export class SaleSupabaseService {
  async findAll(filters: SaleFilters = {}): Promise<Sale[]> {
    try {
      let query = supabase
        .from('sale_records')
        .select(`
          *,
          buyer:partners!sale_records_buyerId_fkey(id, name, type),
          lot:cattle_lots!sale_records_lotId_fkey(id, lotNumber, currentQuantity)
        `)
        .order('createdAt', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.buyerId) {
        query = query.eq('buyerId', filters.buyerId);
      }

      if (filters.lotId) {
        query = query.eq('lotId', filters.lotId);
      }

      if (filters.startDate) {
        query = query.gte('designationDate', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('designationDate', filters.endDate);
      }

      if (filters.search) {
        query = query.or(`saleNumber.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        throw new Error(`Erro ao buscar vendas: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Erro no serviço de vendas:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async findById(id: string): Promise<Sale | null> {
    try {
      const { data, error } = await supabase
        .from('sale_records')
        .select(`
          *,
          buyer:partners!sale_records_buyerId_fkey(id, name, type, email, phone),
          lot:cattle_lots!sale_records_lotId_fkey(id, lotNumber, currentQuantity, status)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erro ao buscar venda:', error);
        throw new Error(`Erro ao buscar venda: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Erro no serviço de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async create(saleData: CreateSaleData, userId: string): Promise<Sale> {
    try {
      // Gerar número da venda
      const saleNumber = await this.generateSaleNumber();

      const newSale = {
        saleNumber,
        ...saleData,
        userId,
        status: 'NEXT_SLAUGHTER' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sale_records')
        .insert(newSale)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar venda:', error);
        throw new Error(`Erro ao criar venda: ${error.message}`);
      }

      // Criar evento no calendário
      await this.createCalendarEvent(data);

      return data;
    } catch (error: any) {
      console.error('Erro no serviço de criação de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async update(id: string, updates: UpdateSaleData): Promise<Sale> {
    try {
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sale_records')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar venda:', error);
        throw new Error(`Erro ao atualizar venda: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Erro no serviço de atualização de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sale_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir venda:', error);
        throw new Error(`Erro ao excluir venda: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('Erro no serviço de exclusão de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async getStats(): Promise<SaleStats> {
    try {
      // Buscar todas as vendas
      const { data: sales, error } = await supabase
        .from('sale_records')
        .select('status, totalValue, createdAt');

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      const totalSales = sales?.length || 0;
      const totalValue = sales?.reduce((sum, sale) => sum + (sale.totalValue || 0), 0) || 0;
      const averageValue = totalSales > 0 ? totalValue / totalSales : 0;

      // Agrupar por status
      const statusGroups = sales?.reduce((acc: any, sale) => {
        acc[sale.status] = (acc[sale.status] || 0) + 1;
        return acc;
      }, {}) || {};

      const byStatus = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: totalSales > 0 ? ((count as number) / totalSales) * 100 : 0
      }));

      // Vendas recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentSales = sales?.filter(sale => 
        new Date(sale.createdAt) >= thirtyDaysAgo
      ).length || 0;

      return {
        totalSales,
        totalValue,
        averageValue,
        byStatus,
        recentSales
      };
    } catch (error: any) {
      console.error('Erro ao calcular estatísticas de vendas:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  private async generateSaleNumber(): Promise<string> {
    try {
      const year = new Date().getFullYear();
      
      const { data: lastSale } = await supabase
        .from('sale_records')
        .select('saleNumber')
        .like('saleNumber', `VND${year}%`)
        .order('saleNumber', { ascending: false })
        .limit(1)
        .single();

      let sequence = 1;
      if (lastSale && lastSale.saleNumber) {
        const lastSequence = parseInt(lastSale.saleNumber.slice(-4));
        sequence = lastSequence + 1;
      }

      return `VND${year}${sequence.toString().padStart(4, '0')}`;
    } catch (error) {
      // Se não encontrar nenhuma venda, começar do 1
      const year = new Date().getFullYear();
      return `VND${year}0001`;
    }
  }

  private async createCalendarEvent(sale: Sale): Promise<void> {
    try {
      // Criar evento no calendário para a data esperada de abate
      const calendarEvent = {
        title: `Abate Programado - ${sale.saleNumber}`,
        description: `Venda programada para abate\nLote: ${sale.lotId}\nFrigorífico: ${sale.slaughterPlant}`,
        eventDate: sale.expectedDate,
        eventType: 'sale',
        relatedId: sale.id,
        userId: sale.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await supabase
        .from('calendar_events')
        .insert(calendarEvent);
    } catch (error) {
      console.error('Erro ao criar evento no calendário:', error);
      // Não falhar a criação da venda por causa do calendário
    }
  }
}
