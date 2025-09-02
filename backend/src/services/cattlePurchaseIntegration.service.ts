import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export class CattlePurchaseIntegrationService {
  /**
   * Cria despesas financeiras automaticamente quando uma compra de gado é cadastrada
   */
  async createPurchaseExpenses(purchaseId: string) {
    try {
      // Buscar a compra com todos os dados necessários
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true
        }
      });

      if (!purchase) {
        throw new Error('Compra não encontrada');
      }

      const expenses = [];
      
      // 1. Criar Centro de Custo para o Lote (se não existir)
      let lotCostCenter = await prisma.costCenter.findFirst({
        where: { 
          code: `LOT-${purchase.lotCode}` 
        }
      });

      if (!lotCostCenter) {
        lotCostCenter = await prisma.costCenter.create({
          data: {
            code: `LOT-${purchase.lotCode}`,
            name: `Lote ${purchase.lotCode}`,
            type: 'ACQUISITION',
            isActive: true
          }
        });
        console.log(`✅ Centro de custo criado para Lote ${purchase.lotCode}`);
      }

      // 2. Despesa principal - Compra do Gado
      const cattleExpense = await prisma.expense.create({
        data: {
          description: `Compra de Gado - Lote ${purchase.lotCode}`,
          category: 'COMPRA_GADO',
          totalAmount: purchase.purchaseValue,
          dueDate: purchase.principalDueDate || purchase.purchaseDate,
          isPaid: false,
          impactsCashFlow: true,
          purchaseId: purchase.id,
          vendorId: purchase.vendorId,
          costCenterId: lotCostCenter.id,
          userId: purchase.userId || 'system',
          notes: `${purchase.initialQuantity} cabeças - Peso médio: ${purchase.averageWeight || purchase.purchaseWeight / purchase.initialQuantity}kg`
        }
      });
      expenses.push(cattleExpense);
      console.log(`✅ Despesa de compra criada: R$ ${purchase.purchaseValue}`);

      // 3. Despesa de Comissão (se houver)
      if (purchase.commission > 0) {
        const commissionExpense = await prisma.expense.create({
          data: {
            description: `Comissão - Lote ${purchase.lotCode}`,
            category: 'COMISSAO',
            totalAmount: purchase.commission,
            dueDate: purchase.commissionDueDate || purchase.purchaseDate,
            isPaid: false,
            impactsCashFlow: true,
            purchaseId: purchase.id,
            vendorId: purchase.brokerId || purchase.vendorId,
            costCenterId: lotCostCenter.id,
            userId: purchase.userId || 'system',
            notes: purchase.broker ? `Corretor: ${purchase.broker.name}` : 'Comissão sobre compra'
          }
        });
        expenses.push(commissionExpense);
        console.log(`✅ Despesa de comissão criada: R$ ${purchase.commission}`);
      }

      // 4. Despesa de Frete (se houver)
      if (purchase.freightCost > 0) {
        const freightExpense = await prisma.expense.create({
          data: {
            description: `Frete - Lote ${purchase.lotCode}`,
            category: 'TRANSPORTE',
            totalAmount: purchase.freightCost,
            dueDate: purchase.freightDueDate || purchase.purchaseDate,
            isPaid: false,
            impactsCashFlow: true,
            purchaseId: purchase.id,
            vendorId: purchase.transportCompanyId || purchase.vendorId,
            costCenterId: lotCostCenter.id,
            userId: purchase.userId || 'system',
            notes: purchase.freightDistance 
              ? `Distância: ${purchase.freightDistance}km - R$ ${(purchase.freightCost / purchase.freightDistance).toFixed(2)}/km`
              : `Origem: ${purchase.city || 'N/A'} - ${purchase.state || 'N/A'}`
          }
        });
        expenses.push(freightExpense);
        console.log(`✅ Despesa de frete criada: R$ ${purchase.freightCost}`);
      }

      // 5. Criar alocações para rastreabilidade
      for (const expense of expenses) {
        await prisma.expenseAllocation.create({
          data: {
            expenseId: expense.id,
            entityType: 'LOT',
            entityId: purchase.id,
            allocatedAmount: expense.totalAmount,
            percentage: 100
          }
        });
      }

      console.log(`\n✅ Total de ${expenses.length} despesas criadas para o Lote ${purchase.lotCode}`);
      console.log(`   Valor Total: R$ ${(purchase.purchaseValue + purchase.commission + purchase.freightCost).toFixed(2)}`);

      return {
        success: true,
        costCenter: lotCostCenter,
        expenses: expenses,
        summary: {
          lotCode: purchase.lotCode,
          totalExpenses: expenses.length,
          cattleValue: purchase.purchaseValue,
          commission: purchase.commission,
          freight: purchase.freightCost,
          totalValue: purchase.purchaseValue + purchase.commission + purchase.freightCost
        }
      };

    } catch (error) {
      console.error('❌ Erro ao criar despesas da compra:', error);
      throw error;
    }
  }

  /**
   * Atualiza despesas quando a compra é alterada
   */
  async updatePurchaseExpenses(purchaseId: string) {
    try {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) {
        throw new Error('Compra não encontrada');
      }

      // Buscar despesas existentes
      const existingExpenses = await prisma.expense.findMany({
        where: { purchaseId: purchase.id }
      });

      // Atualizar despesa de compra
      const cattleExpense = existingExpenses.find(e => e.category === 'COMPRA_GADO');
      if (cattleExpense) {
        await prisma.expense.update({
          where: { id: cattleExpense.id },
          data: {
            totalAmount: purchase.purchaseValue,
            dueDate: purchase.principalDueDate || purchase.purchaseDate
          }
        });
      }

      // Atualizar despesa de comissão
      const commissionExpense = existingExpenses.find(e => e.category === 'COMISSAO');
      if (purchase.commission > 0) {
        if (commissionExpense) {
          await prisma.expense.update({
            where: { id: commissionExpense.id },
            data: {
              totalAmount: purchase.commission,
              dueDate: purchase.commissionDueDate || purchase.purchaseDate
            }
          });
        } else {
          // Criar nova despesa de comissão se não existir
          await this.createPurchaseExpenses(purchaseId);
        }
      } else if (commissionExpense) {
        // Remover despesa de comissão se valor for zero
        await prisma.expense.delete({
          where: { id: commissionExpense.id }
        });
      }

      // Atualizar despesa de frete
      const freightExpense = existingExpenses.find(e => e.category === 'TRANSPORTE');
      if (purchase.freightCost > 0) {
        if (freightExpense) {
          await prisma.expense.update({
            where: { id: freightExpense.id },
            data: {
              totalAmount: purchase.freightCost,
              dueDate: purchase.freightDueDate || purchase.purchaseDate
            }
          });
        } else {
          // Criar nova despesa de frete se não existir
          await this.createPurchaseExpenses(purchaseId);
        }
      } else if (freightExpense) {
        // Remover despesa de frete se valor for zero
        await prisma.expense.delete({
          where: { id: freightExpense.id }
        });
      }

      console.log(`✅ Despesas do Lote ${purchase.lotCode} atualizadas`);
      return { success: true };

    } catch (error) {
      console.error('❌ Erro ao atualizar despesas:', error);
      throw error;
    }
  }

  /**
   * Remove despesas quando a compra é deletada
   */
  async deletePurchaseExpenses(purchaseId: string) {
    try {
      // Primeiro remover alocações
      const expenses = await prisma.expense.findMany({
        where: { purchaseId }
      });

      for (const expense of expenses) {
        await prisma.expenseAllocation.deleteMany({
          where: { expenseId: expense.id }
        });
      }

      // Depois remover despesas
      const result = await prisma.expense.deleteMany({
        where: { purchaseId }
      });

      console.log(`✅ ${result.count} despesas removidas`);
      return { success: true, deletedCount: result.count };

    } catch (error) {
      console.error('❌ Erro ao remover despesas:', error);
      throw error;
    }
  }
}

export const cattlePurchaseIntegration = new CattlePurchaseIntegrationService();