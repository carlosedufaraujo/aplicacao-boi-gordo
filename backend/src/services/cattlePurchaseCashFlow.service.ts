import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CattlePurchaseCashFlowService {
  /**
   * Cria movimentações no CashFlow quando uma compra de gado é cadastrada
   */
  async createPurchaseCashFlows(purchaseId: string) {
    try {
      // Buscar a compra com todos os dados necessários
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId },
        include: {
          vendor: true,
          broker: true,
          transportCompany: true,
          payerAccount: true
        }
      });

      if (!purchase) {
        throw new Error('Compra não encontrada');
      }

      const cashFlows = [];
      
      // Buscar as categorias padrão do sistema
      const categoryCompra = await prisma.category.findUnique({
        where: { id: 'cat-exp-01' } // Compra de Gado
      });
      
      const categoryComissao = await prisma.category.findUnique({
        where: { id: 'cat-exp-03' } // Comissão de Compra
      });
      
      const categoryFrete = await prisma.category.findUnique({
        where: { id: 'cat-exp-02' } // Frete de Gado
      });

      if (!categoryCompra || !categoryComissao || !categoryFrete) {
        console.warn('⚠️ Categorias padrão não encontradas. Execute o seed de categorias.');
        console.warn(`Compra: ${categoryCompra?.id}, Comissão: ${categoryComissao?.id}, Frete: ${categoryFrete?.id}`);
      } else {
        console.log(`✅ Categorias encontradas - Compra: ${categoryCompra.id}, Comissão: ${categoryComissao.id}, Frete: ${categoryFrete.id}`);
      }

      // 1. Despesa principal - Compra do Gado
      const cattleCashFlow = await prisma.cashFlow.create({
        data: {
          type: 'EXPENSE',
          categoryId: categoryCompra?.id || 'cat-exp-01',
          accountId: purchase.payerAccountId,
          description: `Compra de Gado - Lote ${purchase.lotCode}`,
          amount: purchase.purchaseValue,
          date: purchase.purchaseDate,
          dueDate: purchase.principalDueDate || purchase.purchaseDate,
          status: 'PENDING',
          supplier: purchase.vendor?.name || 'Fornecedor não informado',
          reference: `COMPRA-${purchase.lotCode}`,
          notes: `${purchase.initialQuantity} cabeças | Peso médio: ${(purchase.purchaseWeight / purchase.initialQuantity).toFixed(2)}kg | R$ ${purchase.pricePerArroba.toFixed(2)}/@`,
          tags: ['compra-gado', purchase.lotCode, purchase.animalType],
          userId: purchase.userId
        }
      });
      cashFlows.push(cattleCashFlow);
      console.log(`✅ CashFlow de compra criado: R$ ${purchase.purchaseValue.toFixed(2)}`);

      // 2. Despesa de Comissão (se houver)
      if (purchase.commission > 0) {
        const commissionCashFlow = await prisma.cashFlow.create({
          data: {
            type: 'EXPENSE',
            categoryId: categoryComissao?.id || 'cat-exp-03',
            accountId: purchase.payerAccountId,
            description: `Comissão - Lote ${purchase.lotCode}`,
            amount: purchase.commission,
            date: purchase.purchaseDate,
            dueDate: purchase.commissionDueDate || purchase.purchaseDate,
            status: 'PENDING',
            supplier: purchase.broker?.name || 'Corretor não informado',
            reference: `COMISSAO-${purchase.lotCode}`,
            notes: `Comissão sobre compra de ${purchase.initialQuantity} cabeças`,
            tags: ['comissao', purchase.lotCode],
            userId: purchase.userId
          }
        });
        cashFlows.push(commissionCashFlow);
        console.log(`✅ CashFlow de comissão criado: R$ ${purchase.commission.toFixed(2)}`);
      }

      // 3. Despesa de Frete (se houver)
      if (purchase.freightCost > 0) {
        const freightCashFlow = await prisma.cashFlow.create({
          data: {
            type: 'EXPENSE',
            categoryId: categoryFrete?.id || 'cat-exp-02',
            accountId: purchase.payerAccountId,
            description: `Frete - Lote ${purchase.lotCode}`,
            amount: purchase.freightCost,
            date: purchase.purchaseDate,
            dueDate: purchase.freightDueDate || purchase.purchaseDate,
            status: 'PENDING',
            supplier: purchase.transportCompany?.name || 'Transportadora não informada',
            reference: `FRETE-${purchase.lotCode}`,
            notes: purchase.freightDistance 
              ? `Distância: ${purchase.freightDistance}km | R$ ${(purchase.freightCost / purchase.freightDistance).toFixed(2)}/km | Origem: ${purchase.city || 'N/A'}-${purchase.state || 'N/A'}`
              : `Origem: ${purchase.city || 'N/A'}-${purchase.state || 'N/A'} | Destino: ${purchase.farm || 'Fazenda'}`,
            tags: ['frete', purchase.lotCode],
            userId: purchase.userId
          }
        });
        cashFlows.push(freightCashFlow);
        console.log(`✅ CashFlow de frete criado: R$ ${purchase.freightCost.toFixed(2)}`);
      }

      // 4. Criar eventos no calendário para vencimentos
      for (const cashFlow of cashFlows) {
        if (cashFlow.dueDate) {
          try {
            await prisma.calendarEvent.create({
              data: {
                title: `💸 ${cashFlow.description}`,
                date: cashFlow.dueDate,
                type: 'FINANCE',
                description: `Valor: R$ ${cashFlow.amount.toFixed(2)} | Status: ${cashFlow.status}`
              }
            });
          } catch (error) {
            console.warn('Erro ao criar evento no calendário:', error);
          }
        }
      }

      console.log(`\n✅ Total de ${cashFlows.length} movimentações criadas para o Lote ${purchase.lotCode}`);
      console.log(`   Valor Total: R$ ${(purchase.purchaseValue + purchase.commission + purchase.freightCost).toFixed(2)}`);

      return {
        success: true,
        cashFlows: cashFlows,
        summary: {
          lotCode: purchase.lotCode,
          totalCashFlows: cashFlows.length,
          cattleValue: purchase.purchaseValue,
          commission: purchase.commission,
          freight: purchase.freightCost,
          totalValue: purchase.purchaseValue + purchase.commission + purchase.freightCost
        }
      };

    } catch (error) {
      console.error('❌ Erro ao criar movimentações da compra:', error);
      throw error;
    }
  }

  /**
   * Atualiza movimentações quando a compra é alterada
   */
  async updatePurchaseCashFlows(purchaseId: string) {
    try {
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

      // Buscar movimentações existentes pela referência
      const existingCashFlows = await prisma.cashFlow.findMany({
        where: {
          OR: [
            { reference: `COMPRA-${purchase.lotCode}` },
            { reference: `COMISSAO-${purchase.lotCode}` },
            { reference: `FRETE-${purchase.lotCode}` }
          ]
        }
      });

      // Atualizar movimentação de compra
      const cattleCashFlow = existingCashFlows.find(cf => cf.reference === `COMPRA-${purchase.lotCode}`);
      if (cattleCashFlow) {
        await prisma.cashFlow.update({
          where: { id: cattleCashFlow.id },
          data: {
            amount: purchase.purchaseValue,
            dueDate: purchase.principalDueDate || purchase.purchaseDate,
            supplier: purchase.vendor?.name || cattleCashFlow.supplier,
            notes: `${purchase.initialQuantity} cabeças | Peso médio: ${(purchase.purchaseWeight / purchase.initialQuantity).toFixed(2)}kg | R$ ${purchase.pricePerArroba.toFixed(2)}/@`
          }
        });
        console.log(`✅ CashFlow de compra atualizado`);
      }

      // Atualizar movimentação de comissão
      const commissionCashFlow = existingCashFlows.find(cf => cf.reference === `COMISSAO-${purchase.lotCode}`);
      if (purchase.commission > 0) {
        if (commissionCashFlow) {
          await prisma.cashFlow.update({
            where: { id: commissionCashFlow.id },
            data: {
              amount: purchase.commission,
              dueDate: purchase.commissionDueDate || purchase.purchaseDate,
              supplier: purchase.broker?.name || commissionCashFlow.supplier
            }
          });
        } else {
          // Criar nova movimentação de comissão
          const categoryComissao = await prisma.category.findUnique({
            where: { id: 'cat-exp-03' }
          });
          
          await prisma.cashFlow.create({
            data: {
              type: 'EXPENSE',
              categoryId: categoryComissao?.id || 'cat-exp-03',
              accountId: purchase.payerAccountId,
              description: `Comissão - Lote ${purchase.lotCode}`,
              amount: purchase.commission,
              date: purchase.purchaseDate,
              dueDate: purchase.commissionDueDate || purchase.purchaseDate,
              status: 'PENDING',
              supplier: purchase.broker?.name || 'Corretor não informado',
              reference: `COMISSAO-${purchase.lotCode}`,
              notes: `Comissão sobre compra de ${purchase.initialQuantity} cabeças`,
              tags: ['comissao', purchase.lotCode],
              userId: purchase.userId
            }
          });
        }
        console.log(`✅ CashFlow de comissão atualizado`);
      } else if (commissionCashFlow) {
        // Remover movimentação de comissão se valor for zero
        await prisma.cashFlow.delete({
          where: { id: commissionCashFlow.id }
        });
        console.log(`🗑️ CashFlow de comissão removido`);
      }

      // Atualizar movimentação de frete
      const freightCashFlow = existingCashFlows.find(cf => cf.reference === `FRETE-${purchase.lotCode}`);
      if (purchase.freightCost > 0) {
        if (freightCashFlow) {
          await prisma.cashFlow.update({
            where: { id: freightCashFlow.id },
            data: {
              amount: purchase.freightCost,
              dueDate: purchase.freightDueDate || purchase.purchaseDate,
              supplier: purchase.transportCompany?.name || freightCashFlow.supplier,
              notes: purchase.freightDistance 
                ? `Distância: ${purchase.freightDistance}km | R$ ${(purchase.freightCost / purchase.freightDistance).toFixed(2)}/km | Origem: ${purchase.city || 'N/A'}-${purchase.state || 'N/A'}`
                : `Origem: ${purchase.city || 'N/A'}-${purchase.state || 'N/A'} | Destino: ${purchase.farm || 'Fazenda'}`
            }
          });
        } else {
          // Criar nova movimentação de frete
          const categoryFrete = await prisma.category.findUnique({
            where: { id: 'cat-exp-02' }
          });
          
          await prisma.cashFlow.create({
            data: {
              type: 'EXPENSE',
              categoryId: categoryFrete?.id || 'cat-exp-02',
              accountId: purchase.payerAccountId,
              description: `Frete - Lote ${purchase.lotCode}`,
              amount: purchase.freightCost,
              date: purchase.purchaseDate,
              dueDate: purchase.freightDueDate || purchase.purchaseDate,
              status: 'PENDING',
              supplier: purchase.transportCompany?.name || 'Transportadora não informada',
              reference: `FRETE-${purchase.lotCode}`,
              notes: purchase.freightDistance 
                ? `Distância: ${purchase.freightDistance}km | R$ ${(purchase.freightCost / purchase.freightDistance).toFixed(2)}/km`
                : `Origem: ${purchase.city || 'N/A'}-${purchase.state || 'N/A'}`,
              tags: ['frete', purchase.lotCode],
              userId: purchase.userId
            }
          });
        }
        console.log(`✅ CashFlow de frete atualizado`);
      } else if (freightCashFlow) {
        // Remover movimentação de frete se valor for zero
        await prisma.cashFlow.delete({
          where: { id: freightCashFlow.id }
        });
        console.log(`🗑️ CashFlow de frete removido`);
      }

      console.log(`\n✅ Movimentações do Lote ${purchase.lotCode} atualizadas com sucesso`);

      return {
        success: true,
        message: 'Movimentações atualizadas com sucesso'
      };

    } catch (error) {
      console.error('❌ Erro ao atualizar movimentações:', error);
      throw error;
    }
  }

  /**
   * Remove movimentações quando a compra é deletada
   */
  async deletePurchaseCashFlows(purchaseId: string) {
    try {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId }
      });

      if (!purchase) {
        console.warn('Compra não encontrada para exclusão');
        return;
      }

      // Deletar todas as movimentações relacionadas
      const deleted = await prisma.cashFlow.deleteMany({
        where: {
          OR: [
            { reference: `COMPRA-${purchase.lotCode}` },
            { reference: `COMISSAO-${purchase.lotCode}` },
            { reference: `FRETE-${purchase.lotCode}` }
          ]
        }
      });

      console.log(`🗑️ ${deleted.count} movimentações removidas do Lote ${purchase.lotCode}`);

      return {
        success: true,
        deletedCount: deleted.count
      };

    } catch (error) {
      console.error('❌ Erro ao deletar movimentações:', error);
      throw error;
    }
  }
}

export default new CattlePurchaseCashFlowService();