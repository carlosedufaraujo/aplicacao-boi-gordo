import { SaleRecordRepository } from '@/repositories/saleRecord.repository';
import { NotFoundError, ValidationError } from '@/utils/AppError';
import { PaginationParams } from '@/repositories/base.repository';
import { prisma } from '@/config/database';
import cashFlowService from '@/services/cashFlow.service';
import calendarEventService from '@/services/calendarEvent.service';
import { CattlePurchaseRepository } from '@/repositories/cattlePurchase.repository';

interface CreateSaleRecordData {
  purchaseId: string;
  buyerId: string;
  cycleId?: string;
  saleDate: Date;
  quantity: number;
  totalWeight: number;
  pricePerKg: number;
  grossValue: number;
  deductions?: number;
  netValue: number;
  paymentTerms?: string;
  deliveryDate?: Date;
  deliveryLocation?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  payerAccountId?: string;
  notes?: string;
}

interface UpdateSaleRecordData extends Partial<CreateSaleRecordData> {}

interface SaleRecordFilters {
  purchaseId?: string;
  buyerId?: string;
  cycleId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export class SaleRecordService {
  private saleRecordRepository: SaleRecordRepository;
  private cattlePurchaseRepository: CattlePurchaseRepository;

  constructor() {
    this.saleRecordRepository = new SaleRecordRepository();
    this.cattlePurchaseRepository = new CattlePurchaseRepository();
  }

  async findAll(filters: SaleRecordFilters, pagination?: PaginationParams) {
    const where: any = {};

    if (filters.purchaseId) {
      where.purchaseId = filters.purchaseId;
    }

    if (filters.buyerId) {
      where.buyerId = filters.buyerId;
    }
    
    if (filters.cycleId) {
      where.cycleId = filters.cycleId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.saleDate = {};
      if (filters.startDate) {
        where.saleDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.saleDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { deliveryLocation: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const options = {
      include: {
        pen: true,
        purchase: true,
        buyer: true,
        receiverAccount: true,
      }
    };

    return this.saleRecordRepository.findAll(where, pagination, options);
  }

  async findById(id: string) {
    const saleRecord = await this.saleRecordRepository.findWithRelations(id);
    
    if (!saleRecord) {
      throw new NotFoundError('Registro de venda não encontrado');
    }

    return saleRecord;
  }

  async findByPeriod(startDate: Date, endDate: Date, filters?: any) {
    return this.saleRecordRepository.findByPeriod(startDate, endDate, filters);
  }

  async findByPurchase(purchaseId: string) {
    return this.saleRecordRepository.findAll({ purchaseId });
  }

  async findByBuyer(buyerId: string) {
    return this.saleRecordRepository.findByBuyer(buyerId);
  }

  async create(data: CreateSaleRecordData) {
    console.log('🔍 DEBUG SERVICE - Dados recebidos:', JSON.stringify(data, null, 2));

    // Validar campos obrigatórios
    if (!data.saleDate) {
      throw new ValidationError('Data da venda é obrigatória');
    }
    if (!data.buyerId) {
      throw new ValidationError('Comprador é obrigatório');
    }
    if (!data.quantity || data.quantity <= 0) {
      throw new ValidationError('Quantidade deve ser maior que zero');
    }

    // Validar estoque disponível
    // Se penId foi fornecido, é venda por curral
    // Se não, é venda aleatória
    if (data.penId) {
      // Venda por curral - validar estoque do curral específico
      // Por enquanto, apenas validar que o penId existe
      // TODO: Implementar validação de estoque por curral
    } else {
      // Venda aleatória - validar estoque total
      const allPurchases = await this.cattlePurchaseRepository.findAll({ status: 'CONFIRMED' });

      let totalAvailable = 0;
      for (const purchase of allPurchases) {
        const initialQty = purchase.initialQuantity || purchase.quantity || 0;
        const deaths = purchase.deaths || purchase.mortalityCount || 0;
        const currentQty = purchase.currentQuantity !== undefined
          ? purchase.currentQuantity
          : initialQty - deaths;
        totalAvailable += currentQty;
      }

      if (totalAvailable < data.quantity) {
        throw new ValidationError(`Quantidade insuficiente no estoque total. Disponível: ${totalAvailable}, Solicitado: ${data.quantity}`);
      }
    }

    // Preparar dados garantindo que todos os campos obrigatórios estejam presentes
    const saleRecordData: any = {
      saleDate: new Date(data.saleDate),
      penId: data.penId || null,
      purchaseId: data.purchaseId || null,
      saleType: data.saleType || 'total',
      quantity: Number(data.quantity),
      buyerId: data.buyerId,
      exitWeight: Number(data.exitWeight || 0),
      carcassWeight: Number(data.carcassWeight || 0),
      carcassYield: Number(data.carcassYield || 50),
      pricePerArroba: Number(data.pricePerArroba || 0),
      arrobas: Number(data.arrobas || 0),
      totalValue: Number(data.totalValue || 0),
      deductions: Number(data.deductions || 0),
      netValue: Number(data.netValue || 0),
      paymentType: data.paymentType || 'cash',
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
      receiverAccountId: data.receiverAccountId || null,
      invoiceNumber: data.invoiceNumber || null,
      contractNumber: data.contractNumber || null,
      observations: data.observations || null,
      // Garantir que o status seja sempre em maiúsculo para o enum do Prisma
      status: data.status ? data.status.toUpperCase() : 'PENDING',
    };

    // Remover campos com valor null que não são opcionais no banco
    Object.keys(saleRecordData).forEach(key => {
      if (saleRecordData[key] === undefined) {
        delete saleRecordData[key];
      }
    });

    console.log('📤 DEBUG SERVICE - Dados preparados para o banco:', JSON.stringify(saleRecordData, null, 2));

    try {
      const result = await this.saleRecordRepository.create(saleRecordData);
      console.log('✅ DEBUG SERVICE - Venda criada com sucesso:', result.id);

      // Atualizar estoque baseado no tipo de seleção
      if (data.penId) {
        // Venda por curral - atualizar animais do curral especificamente
        // TODO: Implementar lógica para atualizar estoque baseado no curral
        console.log(`ℹ️ Venda por curral ${data.penId} - ${data.quantity} animais`);
      } else {
        // Venda aleatória - distribuir baixa proporcionalmente entre todos os lotes
        try {
          const allPurchases = await this.cattlePurchaseRepository.findAll({ status: 'CONFIRMED' });

          // Filtrar apenas lotes com animais disponíveis
          const availablePurchases = allPurchases.filter(p => {
            const currentQty = p.currentQuantity !== undefined
              ? p.currentQuantity
              : (p.initialQuantity || p.quantity || 0) - (p.deaths || p.mortalityCount || 0);
            return currentQty > 0;
          });

          // Distribuir a venda proporcionalmente ou usar FIFO
          let remainingToSell = data.quantity;

          // Usar FIFO - vender dos lotes mais antigos primeiro
          const sortedPurchases = availablePurchases.sort((a, b) =>
            new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
          );

          for (const purchase of sortedPurchases) {
            if (remainingToSell <= 0) break;

            const currentQty = purchase.currentQuantity !== undefined
              ? purchase.currentQuantity
              : (purchase.initialQuantity || purchase.quantity || 0) - (purchase.deaths || purchase.mortalityCount || 0);

            const toSellFromThis = Math.min(currentQty, remainingToSell);
            const newQuantity = currentQty - toSellFromThis;

            await this.cattlePurchaseRepository.update(purchase.id, {
              currentQuantity: newQuantity
            });

            console.log(`✅ Estoque atualizado: Lote ${purchase.id} - Anterior: ${currentQty}, Vendido: ${toSellFromThis}, Novo: ${newQuantity}`);

            remainingToSell -= toSellFromThis;
          }
        } catch (error) {
          console.error('⚠️ Erro ao atualizar estoque:', error);
          // Não falha a criação da venda se o update do estoque falhar
        }
      }

      // Criar entrada no CashFlow para a venda
      try {
        await cashFlowService.create({
          type: 'INCOME',
          category: 'VENDA_GADO',
          description: `Venda de ${saleRecordData.quantity} animais`,
          amount: saleRecordData.netValue,
          date: saleRecordData.saleDate,
          dueDate: saleRecordData.paymentDate || saleRecordData.saleDate,
          status: saleRecordData.status === 'PAID' ? 'RECEIVED' : 'PENDING',
          accountId: saleRecordData.receiverAccountId || '',
          relatedId: result.id,
          notes: `Venda para ${saleRecordData.buyerId} - ${saleRecordData.quantity} cabeças`,
          userId: saleRecordData.userId || ''
        });
        console.log('✅ Entrada no CashFlow criada para a venda');
      } catch (error) {
        console.error('⚠️ Erro ao criar entrada no CashFlow:', error);
        // Não falha a criação da venda se o cashflow falhar
      }

      // Criar evento no calendário para acompanhar a venda
      try {
        await calendarEventService.createEvent({
          title: `Venda de ${saleRecordData.quantity} animais`,
          description: `Venda para ${saleRecordData.buyerId} - Valor: R$ ${saleRecordData.netValue.toFixed(2)}`,
          type: 'SALE',
          date: saleRecordData.deliveryDate || saleRecordData.saleDate,
          status: saleRecordData.status === 'PAID' ? 'COMPLETED' : 'SCHEDULED',
          priority: saleRecordData.netValue > 50000 ? 'HIGH' : 'MEDIUM',
          tags: ['venda', 'gado'],
          color: '#10b981',
          relatedId: result.id,
          amount: saleRecordData.netValue,
          autoGenerated: true,
          userId: saleRecordData.userId || ''
        });
        console.log('✅ Evento no calendário criado para a venda');
      } catch (error) {
        console.error('⚠️ Erro ao criar evento no calendário:', error);
        // Não falha a criação da venda se o calendário falhar
      }

      return result;
    } catch (error: any) {
      console.error('❌ DEBUG SERVICE - Erro ao criar venda:', error);
      console.error('❌ DEBUG SERVICE - Detalhes:', error.message);
      throw error;
    }
  }

  async update(id: string, data: UpdateSaleRecordData) {
    // Verifica se o registro existe
    await this.findById(id);

    // Valida mudanças de status
    if (data.status === 'CANCELLED') {
      // Adicionar lógica para reverter estoque se necessário
    }

    return this.saleRecordRepository.update(id, data);
  }

  async updateStatus(id: string, status: string) {
    // Verifica se o registro existe
    const saleRecord = await this.findById(id);

    // Valida transição de status
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['PAID', 'CANCELLED'],
      PAID: [],
      CANCELLED: [],
    };

    if (!validTransitions[saleRecord.status]?.includes(status)) {
      throw new ValidationError(`Não é possível mudar de ${saleRecord.status} para ${status}`);
    }

    const updatedRecord = await this.saleRecordRepository.update(id, { status });

    // Atualizar CashFlow e Calendário quando o status mudar para PAID
    if (status === 'PAID') {
      try {
        // Buscar e atualizar o cashflow relacionado
        const cashFlows = await prisma.cashFlow.findMany({
          where: { relatedId: id }
        });

        for (const cashFlow of cashFlows) {
          await cashFlowService.update(cashFlow.id, {
            status: 'RECEIVED'
          });
        }

        // Buscar e atualizar eventos do calendário relacionados
        const events = await prisma.calendarEvent.findMany({
          where: { relatedId: id }
        });

        for (const event of events) {
          await calendarEventService.updateEvent(event.id, {
            status: 'COMPLETED'
          });
        }
      } catch (error) {
        console.error('⚠️ Erro ao atualizar cashflow/calendário:', error);
      }
    }

    return updatedRecord;
  }

  async delete(id: string) {
    // Verifica se o registro existe
    const saleRecord = await this.findById(id);

    // Não permite deletar vendas completas
    if (saleRecord.status === 'COMPLETED') {
      throw new ValidationError('Não é possível excluir vendas completas');
    }

    return this.saleRecordRepository.delete(id);
  }

  async getStats(startDate?: Date, endDate?: Date) {
    const stats = await this.saleRecordRepository.getStatsByPeriod(startDate, endDate);
    const statusStats = await this.saleRecordRepository.getSalesByStatus();
    
    return {
      ...stats,
      byStatus: statusStats,
    };
  }

  async getSummary(filters?: SaleRecordFilters) {
    const records = await this.findAll(filters || {}, { page: 1, limit: 1000 });

    const summary = {
      total: records.total,
      totalQuantity: records.items.reduce((sum: number, r) => sum + r.quantity, 0),
      totalWeight: records.items.reduce((sum: number, r) => sum + (r.exitWeight || 0), 0),
      totalCarcassWeight: records.items.reduce((sum: number, r) => sum + (r.carcassWeight || 0), 0),
      totalGrossValue: records.items.reduce((sum: number, r) => sum + (r.totalValue || 0), 0),
      totalNetValue: records.items.reduce((sum: number, r) => sum + r.netValue, 0),
      averagePrice: 0,
      byStatus: {
        pending: records.items.filter(r => r.status === 'PENDING').length,
        confirmed: records.items.filter(r => r.status === 'CONFIRMED').length,
        delivered: records.items.filter(r => r.status === 'DELIVERED').length,
        paid: records.items.filter(r => r.status === 'PAID').length,
        cancelled: records.items.filter(r => r.status === 'CANCELLED').length,
        completed: records.items.filter(r => r.status === 'PAID').length, // Usar PAID como completed
      },
    };

    if (summary.totalWeight > 0) {
      summary.averagePrice = summary.totalNetValue / summary.totalWeight;
    }

    return summary;
  }
}