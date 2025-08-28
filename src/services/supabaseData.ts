import { supabase } from './supabase';
import type { SaleRecord } from '../types';

// Re-exportar tipos para compatibilidade
export type { SaleRecord } from '../types';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CattleLot {
  id: string;
  lotNumber: string;
  purchaseOrderId: string;
  entryDate: string;
  entryWeight: number;
  entryQuantity: number;
  acquisitionCost: number;
  healthCost: number;
  feedCost: number;
  operationalCost: number;
  freightCost: number;
  otherCosts: number;
  totalCost: number;
  deathCount: number;
  currentQuantity: number;
  status: 'ACTIVE' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  brokerId?: string;
  userId: string;
  location: string;
  purchaseDate: string;
  animalCount: number;
  animalType: 'MALE' | 'FEMALE' | 'MIXED';
  averageAge?: number;
  totalWeight: number;
  averageWeight: number;
  carcassYield: number;
  pricePerArroba: number;
  totalValue: number;
  commission: number;
  freightCost: number;
  otherCosts: number;
  paymentType: 'CASH' | 'INSTALLMENT' | 'MIXED';
  payerAccountId: string;
  principalDueDate: string;
  commissionDueDate?: string;
  otherCostsDueDate?: string;
  status: 'PENDING' | 'PAYMENT_VALIDATING' | 'RECEPTION' | 'CONFINED' | 'CANCELLED';
  currentStage: string;
  receptionDate?: string;
  actualWeight?: number;
  actualCount?: number;
  weightBreakPercentage?: number;
  transportMortality?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Partner {
  id: string;
  name: string;
  type: 'VENDOR' | 'BROKER' | 'BUYER' | 'INVESTOR' | 'SERVICE_PROVIDER' | 'OTHER';
  cpfCnpj?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pen {
  id: string;
  penNumber: string;
  capacity: number;
  location?: string;
  type: 'RECEPTION' | 'FATTENING' | 'QUARANTINE' | 'HOSPITAL';
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'QUARANTINE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  budget?: number;
  targetAnimals?: number;
  actualAnimals?: number;
  totalCost?: number;
  totalRevenue?: number;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  category: string;
  costCenterId?: string;
  description: string;
  totalAmount: number;
  dueDate: string;
  paymentDate?: string;
  isPaid: boolean;
  impactsCashFlow: boolean;
  lotId?: string;
  penId?: string;
  vendorId?: string;
  payerAccountId?: string;
  purchaseOrderId?: string;
  userId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Revenue {
  id: string;
  category: string;
  costCenterId?: string;
  description: string;
  totalAmount: number;
  dueDate: string;
  receiptDate?: string;
  isReceived: boolean;
  saleRecordId?: string;
  buyerId?: string;
  payerAccountId?: string;
  userId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: 'ACQUISITION' | 'FATTENING' | 'ADMINISTRATIVE' | 'FINANCIAL' | 'REVENUE' | 'CONTRIBUTION';
  parentId?: string;
  budget?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankStatement {
  id: string;
  payerAccountId: string;
  statementDate: string;
  description: string;
  amount: number;
  balance: number;
  transactionType: string;
  reference?: string;
  importBatchId?: string;
  isReconciled: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReconciliation {
  id: string;
  payerAccountId: string;
  reconciliationDate: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  totalReconciled: number;
  userId: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PayerAccount {
  id: string;
  bankName: string;
  accountName: string;
  agency?: string;
  accountNumber?: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CASH';
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SERVIÇOS DE DADOS
// ============================================================================

export class SupabaseDataService {
  // ============================================================================
  // LOTES DE GADO
  // ============================================================================
  
  async getCattleLots(): Promise<CattleLot[]> {
    try {
      const { data, error } = await supabase
        .from('cattle_lots')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar lotes:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getCattleLots:', error);
      throw error;
    }
  }

  async getCattleLotById(id: string): Promise<CattleLot | null> {
    try {
      const { data, error } = await supabase
        .from('cattle_lots')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar lote por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getCattleLotById:', error);
      return null;
    }
  }

  async createCattleLot(lot: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('cattle_lots')
        .insert([lot])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar lote:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createCattleLot:', error);
      throw error;
    }
  }

  async updateCattleLot(id: string, updates: Partial<CattleLot>): Promise<CattleLot> {
    try {
      const { data, error } = await supabase
        .from('cattle_lots')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar lote:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updateCattleLot:', error);
      throw error;
    }
  }

  async deleteCattleLot(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cattle_lots')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar lote:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteCattleLot:', error);
      throw error;
    }
  }

  // ============================================================================
  // ORDENS DE COMPRA
  // ============================================================================
  
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar ordens de compra:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getPurchaseOrders:', error);
      throw error;
    }
  }

  async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar ordem por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getPurchaseOrderById:', error);
      return null;
    }
  }

  async getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Erro ao buscar todas as ordens de compra:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço getAllPurchaseOrders:', error);
      return [];
    }
  }

  async getCattleLotByPurchaseOrderId(purchaseOrderId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('cattle_lots')
        .select('*')
        .eq('purchaseOrderId', purchaseOrderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhum resultado encontrado
          return null;
        }
        console.error('Erro ao buscar lote por purchaseOrderId:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro no serviço getCattleLotByPurchaseOrderId:', error);
      return null;
    }
  }

  async getExpensesByPurchaseOrderId(purchaseOrderId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('purchaseOrderId', purchaseOrderId);

      if (error) {
        console.error('Erro ao buscar despesas por purchaseOrderId:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro no serviço getExpensesByPurchaseOrderId:', error);
      return [];
    }
  }

  async generateUniqueOrderNumber(): Promise<string> {
    try {
      // Buscar o maior número de ordem existente
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('orderNumber')
        .order('orderNumber', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Erro ao buscar último número de ordem:', error);
        // Fallback: usar timestamp
        return `ORD-${Date.now()}`;
      }

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastOrderNumber = data[0].orderNumber;
        // Extrair número do formato (assumindo formato como "X0001", "ORD-001", etc.)
        const match = lastOrderNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        } else {
          // Se não conseguir extrair número, usar timestamp
          return `ORD-${Date.now()}`;
        }
      }

      return `X${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Erro ao gerar número de ordem único:', error);
      return `ORD-${Date.now()}`;
    }
  }

  async createPurchaseOrder(order: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt'>): Promise<PurchaseOrder> {
    try {
      const now = new Date().toISOString();
      const orderWithId = {
        ...order,
        id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };

      // Tentar inserir com retry em caso de conflito de orderNumber
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const { data, error } = await supabase
            .from('purchase_orders')
            .insert([orderWithId])
            .select()
            .single();

          if (error) {
            // Se for erro de chave duplicada, gerar novo número e tentar novamente
            if (error.code === '23505' && error.message.includes('orderNumber')) {
              console.warn(`Conflito de orderNumber detectado (tentativa ${attempts + 1}). Gerando novo código...`);
              const newOrderNumber = await this.generateUniqueOrderNumber();
              orderWithId.orderNumber = newOrderNumber;
              attempts++;
              continue;
            }
            throw error;
          }

          console.log('✅ Ordem de compra criada no Supabase:', data.id);
          return data;
        } catch (retryError) {
          if (attempts === maxAttempts - 1) {
            throw retryError;
          }
          attempts++;
        }
      }

      throw new Error('Falha ao criar ordem após múltiplas tentativas');
    } catch (error) {
      console.error('Erro no serviço createPurchaseOrder:', error);
      throw error;
    }
  }

  async updatePurchaseOrder(id: string, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar ordem de compra:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updatePurchaseOrder:', error);
      throw error;
    }
  }

  async deletePurchaseOrder(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar ordem de compra:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deletePurchaseOrder:', error);
      throw error;
    }
  }

  // ============================================================================
  // PARCEIROS
  // ============================================================================
  
  async getPartners(): Promise<Partner[]> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar parceiros:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getPartners:', error);
      throw error;
    }
  }

  async getPartnerById(id: string): Promise<Partner | null> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar parceiro por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getPartnerById:', error);
      return null;
    }
  }

  async createPartner(partner: Omit<Partner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Partner> {
    try {
      const now = new Date().toISOString();
      const partnerWithId = {
        ...partner,
        id: `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('partners')
        .insert([partnerWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar parceiro:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createPartner:', error);
      throw error;
    }
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    try {
      const { data, error } = await supabase
        .from('partners')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar parceiro:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updatePartner:', error);
      throw error;
    }
  }

  async deletePartner(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('partners')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar parceiro:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deletePartner:', error);
      throw error;
    }
  }

  // ============================================================================
  // BAÍAS
  // ============================================================================
  
  async getPens(): Promise<Pen[]> {
    try {
      const { data, error } = await supabase
        .from('pens')
        .select('*')
        .order('penNumber', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar baías:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getPens:', error);
      throw error;
    }
  }

  async getPenById(id: string): Promise<Pen | null> {
    try {
      const { data, error } = await supabase
        .from('pens')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar baía por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getPenById:', error);
      return null;
    }
  }

  async createPen(pen: Omit<Pen, 'id' | 'createdAt' | 'updatedAt'>): Promise<Pen> {
    try {
      const now = new Date().toISOString();
      const penWithId = {
        ...pen,
        id: `pen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('pens')
        .insert([penWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar baía:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createPen:', error);
      throw error;
    }
  }

  async updatePen(id: string, updates: Partial<Pen>): Promise<Pen> {
    try {
      const { data, error } = await supabase
        .from('pens')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar baía:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updatePen:', error);
      throw error;
    }
  }

  async deletePen(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('pens')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar baía:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deletePen:', error);
      throw error;
    }
  }

  // ============================================================================
  // CICLOS
  // ============================================================================
  
  async getCycles(): Promise<Cycle[]> {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar ciclos:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getCycles:', error);
      throw error;
    }
  }

  async getCycleById(id: string): Promise<Cycle | null> {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar ciclo por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getCycleById:', error);
      return null;
    }
  }

  async createCycle(cycle: Omit<Cycle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cycle> {
    try {
      const now = new Date().toISOString();
      const cycleWithId = {
        ...cycle,
        id: `cycle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'default_user', // Usuário padrão temporário
        status: cycle.status || 'ACTIVE',
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('cycles')
        .insert([cycleWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar ciclo:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createCycle:', error);
      throw error;
    }
  }

  async updateCycle(id: string, updates: Partial<Cycle>): Promise<Cycle> {
    try {
      const { data, error } = await supabase
        .from('cycles')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar ciclo:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updateCycle:', error);
      throw error;
    }
  }

  async deleteCycle(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cycles')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar ciclo:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteCycle:', error);
      throw error;
    }
  }

  // ============================================================================
  // DESPESAS
  // ============================================================================
  
  async getExpenses(): Promise<Expense[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar despesas:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getExpenses:', error);
      throw error;
    }
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar despesa por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getExpenseById:', error);
      return null;
    }
  }

  async createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expense])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar despesa:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createExpense:', error);
      throw error;
    }
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar despesa:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updateExpense:', error);
      throw error;
    }
  }

  async deleteExpense(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar despesa:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteExpense:', error);
      throw error;
    }
  }

  // ============================================================================
  // RECEITAS
  // ============================================================================
  
  async getRevenues(): Promise<Revenue[]> {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar receitas:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getRevenues:', error);
      throw error;
    }
  }

  async getRevenueById(id: string): Promise<Revenue | null> {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar receita por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getRevenueById:', error);
      return null;
    }
  }

  async createRevenue(revenue: Omit<Revenue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Revenue> {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .insert([revenue])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar receita:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createRevenue:', error);
      throw error;
    }
  }

  async updateRevenue(id: string, updates: Partial<Revenue>): Promise<Revenue> {
    try {
      const { data, error } = await supabase
        .from('revenues')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar receita:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updateRevenue:', error);
      throw error;
    }
  }

  async deleteRevenue(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('revenues')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar receita:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteRevenue:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONTAS PAGADORAS
  // ============================================================================
  
  async getPayerAccounts(): Promise<PayerAccount[]> {
    try {
      const { data, error } = await supabase
        .from('payer_accounts')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar contas pagadoras:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getPayerAccounts:', error);
      throw error;
    }
  }

  async getPayerAccountById(id: string): Promise<PayerAccount | null> {
    try {
      const { data, error } = await supabase
        .from('payer_accounts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar conta pagadora por ID:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço getPayerAccountById:', error);
      return null;
    }
  }

  async createPayerAccount(account: Omit<PayerAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<PayerAccount> {
    try {
      const now = new Date().toISOString();
      const accountWithId = {
        ...account,
        id: `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('payer_accounts')
        .insert([accountWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar conta pagadora:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createPayerAccount:', error);
      throw error;
    }
  }

  async updatePayerAccount(id: string, updates: Partial<PayerAccount>): Promise<PayerAccount> {
    try {
      const { data, error } = await supabase
        .from('payer_accounts')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar conta pagadora:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updatePayerAccount:', error);
      throw error;
    }
  }

  async deletePayerAccount(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('payer_accounts')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar conta pagadora:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deletePayerAccount:', error);
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARD - DADOS RESUMIDOS
  // ============================================================================
  
  async getDashboardData() {
    try {
      console.log('🔄 Buscando dados do dashboard...');
      
      const [
        cattleLots,
        purchaseOrders,
        expenses,
        revenues,
        cycles,
        partners
      ] = await Promise.all([
        this.getCattleLots(),
        this.getPurchaseOrders(),
        this.getExpenses(),
        this.getRevenues(),
        this.getCycles(),
        this.getPartners()
      ]);

      console.log('✅ Dados carregados:', {
        lots: cattleLots.length,
        orders: purchaseOrders.length,
        expenses: expenses.length,
        revenues: revenues.length,
        cycles: cycles.length,
        partners: partners.length
      });

      // Calcular totais
      const totalLots = cattleLots.length;
      const activeLots = cattleLots.filter(lot => lot.status === 'ACTIVE').length;
      const totalAnimals = cattleLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);
      const totalCosts = cattleLots.reduce((sum, lot) => sum + lot.totalCost, 0);
      
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
      const totalRevenues = revenues.reduce((sum, rev) => sum + rev.totalAmount, 0);
      const profit = totalRevenues - totalExpenses;
      
      const activeCycles = cycles.filter(cycle => cycle.status === 'ACTIVE').length;
      const totalPartners = partners.filter(partner => partner.isActive).length;

      const result = {
        summary: {
          totalLots,
          activeLots,
          totalAnimals,
          totalCosts,
          totalExpenses,
          totalRevenues,
          profit,
          activeCycles,
          totalPartners
        },
        recentData: {
          cattleLots: cattleLots.slice(0, 5),
          purchaseOrders: purchaseOrders.slice(0, 5),
          expenses: expenses.slice(0, 5),
          revenues: revenues.slice(0, 5)
        }
      };

      console.log('📊 Dashboard calculado:', result.summary);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar dados do dashboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // REGISTROS DE VENDAS
  // ============================================================================
  
  async getSaleRecords(): Promise<SaleRecord[]> {
    try {
      const { data, error } = await supabase
        .from('sale_records')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar registros de vendas:', error);
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getSaleRecords:', error);
      throw error;
    }
  }

  async createSaleRecord(saleRecord: Omit<SaleRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SaleRecord> {
    try {
      const { data, error } = await supabase
        .from('sale_records')
        .insert({
          ...saleRecord,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar registro de venda:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createSaleRecord:', error);
      throw error;
    }
  }

  async updateSaleRecord(id: string, updates: Partial<SaleRecord>): Promise<SaleRecord> {
    try {
      const { data, error } = await supabase
        .from('sale_records')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar registro de venda:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updateSaleRecord:', error);
      throw error;
    }
  }

  async deleteSaleRecord(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('sale_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar registro de venda:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteSaleRecord:', error);
      throw error;
    }
  }

  // ============================================================================
  // CENTROS DE CUSTO
  // ============================================================================
  
  async getCostCenters(): Promise<CostCenter[]> {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Erro ao buscar centros de custo:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getCostCenters:', error);
      throw error;
    }
  }

  async getCostCenterById(id: string): Promise<CostCenter | null> {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Erro ao buscar centro de custo:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro no serviço getCostCenterById:', error);
      return null;
    }
  }

  async createCostCenter(costCenter: Omit<CostCenter, 'id' | 'createdAt' | 'updatedAt'>): Promise<CostCenter> {
    try {
      const now = new Date().toISOString();
      const costCenterWithId = {
        ...costCenter,
        id: `cost_center_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('cost_centers')
        .insert([costCenterWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar centro de custo:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createCostCenter:', error);
      throw error;
    }
  }

  async updateCostCenter(id: string, updates: Partial<CostCenter>): Promise<CostCenter> {
    try {
      const { data, error } = await supabase
        .from('cost_centers')
        .update({
          ...updates,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar centro de custo:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço updateCostCenter:', error);
      throw error;
    }
  }

  async deleteCostCenter(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar centro de custo:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro no serviço deleteCostCenter:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXTRATOS BANCÁRIOS
  // ============================================================================
  
  async getBankStatements(): Promise<BankStatement[]> {
    try {
      const { data, error } = await supabase
        .from('bank_statements')
        .select('*')
        .order('statementDate', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar extratos bancários:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getBankStatements:', error);
      throw error;
    }
  }

  async createBankStatement(statement: Omit<BankStatement, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankStatement> {
    try {
      const now = new Date().toISOString();
      const statementWithId = {
        ...statement,
        id: `bank_statement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('bank_statements')
        .insert([statementWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar extrato bancário:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createBankStatement:', error);
      throw error;
    }
  }

  // ============================================================================
  // CONCILIAÇÕES FINANCEIRAS
  // ============================================================================
  
  async getFinancialReconciliations(): Promise<FinancialReconciliation[]> {
    try {
      const { data, error } = await supabase
        .from('financial_reconciliations')
        .select('*')
        .order('reconciliationDate', { ascending: false });
      
      if (error) {
        console.error('Erro ao buscar conciliações financeiras:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Erro no serviço getFinancialReconciliations:', error);
      throw error;
    }
  }

  async createFinancialReconciliation(reconciliation: Omit<FinancialReconciliation, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialReconciliation> {
    try {
      const now = new Date().toISOString();
      const reconciliationWithId = {
        ...reconciliation,
        id: `reconciliation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('financial_reconciliations')
        .insert([reconciliationWithId])
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar conciliação financeira:', error);
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Erro no serviço createFinancialReconciliation:', error);
      throw error;
    }
  }
}

// Instância única do serviço
export const dataService = new SupabaseDataService();
