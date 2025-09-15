/**
 * Testes de Persistência de Dados
 * Garante que todos os dados são salvos e recuperados corretamente
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

describe('Testes de Persistência de Dados', () => {

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Persistência de Usuários', () => {
    let userId: string;

    it('deve criar e persistir um usuário', async () => {
      const userData = {
        email: `test-${Date.now()}@test.com`,
        password: 'hashedPassword123',
        name: 'Test User',
        role: 'USER' as const,
        isActive: true
      };

      const user = await prisma.user.create({ data: userData });
      userId = user.id;

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
    });

    it('deve recuperar o usuário após criação', async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });

    it('deve atualizar dados do usuário', async () => {
      const newName = 'Updated User';

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { name: newName }
      });

      expect(updated.name).toBe(newName);

      // Verificar persistência da atualização
      const fetched = await prisma.user.findUnique({
        where: { id: userId }
      });

      expect(fetched?.name).toBe(newName);
    });

    afterAll(async () => {
      // Limpar dados de teste
      if (userId) {
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      }
    });
  });

  describe('Persistência de Lotes de Gado', () => {
    let purchaseId: string;
    let partnerId: string;
    let payerAccountId: string;
    let userId: string;

    beforeAll(async () => {
      // Criar dependências necessárias
      const user = await prisma.user.create({
        data: {
          email: `test-lot-${Date.now()}@test.com`,
          password: 'test',
          name: 'Lot Test User',
          role: 'USER',
          isActive: true
        }
      });
      userId = user.id;

      const partner = await prisma.partner.create({
        data: {
          name: 'Test Vendor',
          type: 'VENDOR',
          documentType: 'CPF',
          documentNumber: `${Date.now()}`,
          isActive: true
        }
      });
      partnerId = partner.id;

      const account = await prisma.payerAccount.create({
        data: {
          bankName: 'Test Bank',
          accountNumber: `${Date.now()}`,
          accountHolder: 'Test Holder',
          documentNumber: `${Date.now()}`,
          balance: 100000,
          isActive: true
        }
      });
      payerAccountId = account.id;
    });

    it('deve criar e persistir uma compra de gado', async () => {
      const purchaseData = {
        lotCode: `LOT-TEST-${Date.now()}`,
        vendorId: partnerId,
        payerAccountId: payerAccountId,
        userId: userId,
        purchaseDate: new Date(),
        animalType: 'MALE' as const,
        initialQuantity: 100,
        currentQuantity: 100,
        purchaseWeight: 30000, // 300kg por animal
        averageWeight: 300,
        pricePerArroba: 280,
        purchaseValue: 56000, // Calculado: (30000 * 50% / 15) * 280
        status: 'CONFIRMED' as const,
        carcassYield: 50
      };

      const purchase = await prisma.cattlePurchase.create({ data: purchaseData });
      purchaseId = purchase.id;

      expect(purchase).toBeDefined();
      expect(purchase.id).toBeDefined();
      expect(purchase.lotCode).toBe(purchaseData.lotCode);
      expect(purchase.purchaseValue).toBe(purchaseData.purchaseValue);
    });

    it('deve manter integridade dos dados numéricos', async () => {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId }
      });

      expect(purchase).toBeDefined();
      expect(purchase?.purchaseValue).toBe(56000);
      expect(purchase?.initialQuantity).toBe(100);
      expect(purchase?.currentQuantity).toBe(100);
      expect(purchase?.averageWeight).toBe(300);
    });

    it('deve persistir relacionamentos corretamente', async () => {
      const purchase = await prisma.cattlePurchase.findUnique({
        where: { id: purchaseId },
        include: {
          vendor: true,
          payerAccount: true,
          user: true
        }
      });

      expect(purchase?.vendor).toBeDefined();
      expect(purchase?.vendor?.id).toBe(partnerId);
      expect(purchase?.payerAccount?.id).toBe(payerAccountId);
      expect(purchase?.user?.id).toBe(userId);
    });

    afterAll(async () => {
      // Limpar dados de teste na ordem correta
      if (purchaseId) {
        await prisma.cattlePurchase.delete({ where: { id: purchaseId } }).catch(() => {});
      }
      if (partnerId) {
        await prisma.partner.delete({ where: { id: partnerId } }).catch(() => {});
      }
      if (payerAccountId) {
        await prisma.payerAccount.delete({ where: { id: payerAccountId } }).catch(() => {});
      }
      if (userId) {
        await prisma.user.delete({ where: { id: userId } }).catch(() => {});
      }
    });
  });

  describe('Transações e Rollback', () => {
    it('deve fazer rollback em caso de erro na transação', async () => {
      const email = `transaction-test-${Date.now()}@test.com`;

      try {
        await prisma.$transaction(async (tx) => {
          // Criar usuário com sucesso
          const user = await tx.user.create({
            data: {
              email: email,
              password: 'test',
              name: 'Transaction Test',
              role: 'USER',
              isActive: true
            }
          });

          // Forçar erro criando usuário duplicado
          await tx.user.create({
            data: {
              email: email, // Email duplicado causará erro
              password: 'test2',
              name: 'Duplicate Test',
              role: 'USER',
              isActive: true
            }
          });
        });
      } catch (error) {
        // Erro esperado
      }

      // Verificar que nenhum usuário foi criado (rollback funcionou)
      const user = await prisma.user.findUnique({
        where: { email: email }
      });

      expect(user).toBeNull();
    });
  });

  describe('Concorrência de Acessos', () => {
    it('deve lidar com atualizações concorrentes', async () => {
      // Criar conta para teste
      const account = await prisma.payerAccount.create({
        data: {
          bankName: 'Concurrency Test',
          accountNumber: `${Date.now()}`,
          accountHolder: 'Test',
          documentNumber: `${Date.now()}`,
          balance: 1000,
          isActive: true
        }
      });

      // Simular atualizações concorrentes
      const updates = await Promise.all([
        prisma.payerAccount.update({
          where: { id: account.id },
          data: { balance: { increment: 100 } }
        }),
        prisma.payerAccount.update({
          where: { id: account.id },
          data: { balance: { increment: 200 } }
        }),
        prisma.payerAccount.update({
          where: { id: account.id },
          data: { balance: { decrement: 50 } }
        })
      ]);

      // Verificar resultado final
      const finalAccount = await prisma.payerAccount.findUnique({
        where: { id: account.id }
      });

      expect(finalAccount?.balance).toBe(1250); // 1000 + 100 + 200 - 50

      // Limpar
      await prisma.payerAccount.delete({ where: { id: account.id } });
    });
  });

  describe('Validação de Constraints', () => {
    it('não deve permitir emails duplicados', async () => {
      const email = `unique-test-${Date.now()}@test.com`;

      // Criar primeiro usuário
      const user1 = await prisma.user.create({
        data: {
          email: email,
          password: 'test',
          name: 'User 1',
          role: 'USER',
          isActive: true
        }
      });

      // Tentar criar segundo usuário com mesmo email
      await expect(
        prisma.user.create({
          data: {
            email: email,
            password: 'test',
            name: 'User 2',
            role: 'USER',
            isActive: true
          }
        })
      ).rejects.toThrow();

      // Limpar
      await prisma.user.delete({ where: { id: user1.id } });
    });

    it('deve respeitar relacionamentos obrigatórios', async () => {
      // Tentar criar compra sem vendor (deve falhar)
      await expect(
        prisma.cattlePurchase.create({
          data: {
            lotCode: `LOT-INVALID-${Date.now()}`,
            vendorId: 'non-existent-id',
            payerAccountId: 'non-existent-id',
            userId: 'non-existent-id',
            purchaseDate: new Date(),
            animalType: 'MALE',
            initialQuantity: 100,
            currentQuantity: 100,
            purchaseWeight: 30000,
            averageWeight: 300,
            pricePerArroba: 280,
            purchaseValue: 56000,
            status: 'CONFIRMED',
            carcassYield: 50
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Soft Delete e Arquivamento', () => {
    it('deve marcar registros como inativos ao invés de deletar', async () => {
      const partner = await prisma.partner.create({
        data: {
          name: 'Soft Delete Test',
          type: 'VENDOR',
          documentType: 'CPF',
          documentNumber: `${Date.now()}`,
          isActive: true
        }
      });

      // "Deletar" marcando como inativo
      const updated = await prisma.partner.update({
        where: { id: partner.id },
        data: { isActive: false }
      });

      expect(updated.isActive).toBe(false);

      // Registro ainda existe no banco
      const found = await prisma.partner.findUnique({
        where: { id: partner.id }
      });

      expect(found).toBeDefined();
      expect(found?.isActive).toBe(false);

      // Limpar de verdade
      await prisma.partner.delete({ where: { id: partner.id } });
    });
  });
});