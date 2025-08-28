import { supabase } from '@/config/supabase';

export interface SaleRecord {
  id: string;
  lotId: string;
  slaughterhouseId: string;
  saleDate: string;
  animalType: 'male' | 'female';
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  grossRevenue: number;
  netProfit: number;
  profitMargin: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: string;
  commonAnimals: number;
  chinaAnimals: number;
  angusAnimals: number;
  observations?: string;
  reconciled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRecordData {
  lotId: string;
  slaughterhouseId: string;
  saleDate: string;
  animalType: 'male' | 'female';
  quantity: number;
  totalWeight: number;
  pricePerArroba: number;
  paymentType: 'cash' | 'installment';
  paymentDate?: string;
  commonAnimals: number;
  chinaAnimals: number;
  angusAnimals: number;
  observations?: string;
}

export interface UpdateSaleRecordData {
  saleDate?: string;
  animalType?: 'male' | 'female';
  quantity?: number;
  totalWeight?: number;
  pricePerArroba?: number;
  paymentType?: 'cash' | 'installment';
  paymentDate?: string;
  commonAnimals?: number;
  chinaAnimals?: number;
  angusAnimals?: number;
  observations?: string;
  reconciled?: boolean;
}

export interface SaleRecordFilters {
  lotId?: string;
  slaughterhouseId?: string;
  animalType?: string;
  paymentType?: string;
  reconciled?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SaleRecordStats {
  totalRecords: number;
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  byAnimalType: {
    type: string;
    count: number;
    revenue: number;
  }[];
  byPaymentType: {
    type: string;
    count: number;
    percentage: number;
  }[];
  recentRecords: number;
}

export class SaleRecordSupabaseService {
  async findAll(filters: SaleRecordFilters = {}): Promise<SaleRecord[]> {
    try {
      let query = supabase
        .from('sale_records_history')
        .select(`
          *,
          lot:cattle_lots!sale_records_history_lotId_fkey(id, lotNumber, currentQuantity),
          slaughterhouse:partners!sale_records_history_slaughterhouseId_fkey(id, name, type)
        `)
        .order('createdAt', { ascending: false });

      // Aplicar filtros
      if (filters.lotId) {
        query = query.eq('lotId', filters.lotId);
      }

      if (filters.slaughterhouseId) {
        query = query.eq('slaughterhouseId', filters.slaughterhouseId);
      }

      if (filters.animalType) {
        query = query.eq('animalType', filters.animalType);
      }

      if (filters.paymentType) {
        query = query.eq('paymentType', filters.paymentType);
      }

      if (filters.reconciled !== undefined) {
        query = query.eq('reconciled', filters.reconciled);
      }

      if (filters.startDate) {
        query = query.gte('saleDate', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('saleDate', filters.endDate);
      }

      if (filters.search) {
        query = query.or(`observations.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar registros de venda:', error);
        throw new Error(`Erro ao buscar registros de venda: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      console.error('Erro no serviço de registros de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async findById(id: string): Promise<SaleRecord | null> {
    try {
      const { data, error } = await supabase
        .from('sale_records_history')
        .select(`
          *,
          lot:cattle_lots!sale_records_history_lotId_fkey(id, lotNumber, currentQuantity, status),
          slaughterhouse:partners!sale_records_history_slaughterhouseId_fkey(id, name, type, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erro ao buscar registro de venda:', error);
        throw new Error(`Erro ao buscar registro de venda: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Erro no serviço de registro de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async create(recordData: CreateSaleRecordData): Promise<SaleRecord> {
    try {
      // Calcular valores derivados
      const grossRevenue = recordData.totalWeight * recordData.pricePerArroba;
      
      // Para calcular o lucro líquido, precisaríamos dos custos do lote
      // Por enquanto, vamos usar uma estimativa baseada no peso
      const estimatedCost = recordData.totalWeight * 15; // R$ 15 por kg estimado
      const netProfit = grossRevenue - estimatedCost;
      const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

      const newRecord = {
        ...recordData,
        grossRevenue,
        netProfit,
        profitMargin,
        reconciled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('sale_records_history')
        .insert(newRecord)
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar registro de venda:', error);
        throw new Error(`Erro ao criar registro de venda: ${error.message}`);
      }

      // Criar receita no sistema financeiro
      await this.createRevenueEntry(data);

      return data;
    } catch (error: any) {
      console.error('Erro no serviço de criação de registro de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async update(id: string, updates: UpdateSaleRecordData): Promise<SaleRecord> {
    try {
      let updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Recalcular valores se necessário
      if (updates.totalWeight || updates.pricePerArroba) {
        const current = await this.findById(id);
        if (current) {
          const weight = updates.totalWeight || current.totalWeight;
          const price = updates.pricePerArroba || current.pricePerArroba;
          const grossRevenue = weight * price;
          const estimatedCost = weight * 15;
          const netProfit = grossRevenue - estimatedCost;
          const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

          updateData = {
            ...updateData,
            grossRevenue,
            netProfit,
            profitMargin
          };
        }
      }

      const { data, error } = await supabase
        .from('sale_records_history')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar registro de venda:', error);
        throw new Error(`Erro ao atualizar registro de venda: ${error.message}`);
      }

      return data;
    } catch (error: any) {
      console.error('Erro no serviço de atualização de registro de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('sale_records_history')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir registro de venda:', error);
        throw new Error(`Erro ao excluir registro de venda: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      console.error('Erro no serviço de exclusão de registro de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  async getStats(): Promise<SaleRecordStats> {
    try {
      // Buscar todos os registros
      const { data: records, error } = await supabase
        .from('sale_records_history')
        .select('animalType, paymentType, grossRevenue, netProfit, profitMargin, createdAt');

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      const totalRecords = records?.length || 0;
      const totalRevenue = records?.reduce((sum, record) => sum + (record.grossRevenue || 0), 0) || 0;
      const totalProfit = records?.reduce((sum, record) => sum + (record.netProfit || 0), 0) || 0;
      const averageMargin = records?.length > 0 
        ? records.reduce((sum, record) => sum + (record.profitMargin || 0), 0) / records.length 
        : 0;

      // Agrupar por tipo de animal
      const animalTypeGroups = records?.reduce((acc: any, record) => {
        const type = record.animalType;
        if (!acc[type]) {
          acc[type] = { count: 0, revenue: 0 };
        }
        acc[type].count += 1;
        acc[type].revenue += record.grossRevenue || 0;
        return acc;
      }, {}) || {};

      const byAnimalType = Object.entries(animalTypeGroups).map(([type, data]: [string, any]) => ({
        type,
        count: data.count,
        revenue: data.revenue
      }));

      // Agrupar por tipo de pagamento
      const paymentTypeGroups = records?.reduce((acc: any, record) => {
        acc[record.paymentType] = (acc[record.paymentType] || 0) + 1;
        return acc;
      }, {}) || {};

      const byPaymentType = Object.entries(paymentTypeGroups).map(([type, count]) => ({
        type,
        count: count as number,
        percentage: totalRecords > 0 ? ((count as number) / totalRecords) * 100 : 0
      }));

      // Registros recentes (últimos 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRecords = records?.filter(record => 
        new Date(record.createdAt) >= thirtyDaysAgo
      ).length || 0;

      return {
        totalRecords,
        totalRevenue,
        totalProfit,
        averageMargin,
        byAnimalType,
        byPaymentType,
        recentRecords
      };
    } catch (error: any) {
      console.error('Erro ao calcular estatísticas de registros de venda:', error);
      throw new Error(error.message || 'Erro interno do servidor');
    }
  }

  private async createRevenueEntry(record: SaleRecord): Promise<void> {
    try {
      // Criar receita no sistema financeiro
      const revenueEntry = {
        description: `Venda de Gado - Lote ${record.lotId}`,
        amount: record.grossRevenue,
        category: 'CATTLE_SALE',
        dueDate: record.paymentDate || record.saleDate,
        isReceived: record.paymentType === 'cash',
        paymentMethod: record.paymentType === 'cash' ? 'CASH' : 'BANK_TRANSFER',
        relatedId: record.id,
        relatedType: 'sale_record',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await supabase
        .from('revenues')
        .insert(revenueEntry);
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      // Não falhar a criação do registro por causa da receita
    }
  }
}
