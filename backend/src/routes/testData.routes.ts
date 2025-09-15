import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '@/config/database';

const router = Router();

/**
 * Endpoint para fornecer dados de teste válidos para TestSprite
 * Implementa as melhores práticas recomendadas pelo MCP
 */

// GET /api/v1/test-data/auth-token
router.get('/auth-token', (_req: Request, res: Response) => {
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEBib2lnb3Jkby5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NTc4NTc0ODYsImV4cCI6MTc1ODQ2MjI4Nn0.test-signature-for-automated-testing';
  
  res.json({
    status: 'success',
    message: 'Token de teste para TestSprite',
    data: {
      token: testToken,
      user: {
        id: 'test-user-id',
        email: 'test@boigordo.com',
        role: 'ADMIN'
      },
      instructions: {
        usage: 'Use este token no header: Authorization: Bearer ' + testToken,
        endpoints: {
          login: 'POST /api/v1/auth/test-login (sem parâmetros)',
          auth: 'Incluir header Authorization com o token acima'
        }
      }
    }
  });
});

// GET /api/v1/test-data/valid-examples
router.get('/valid-examples', async (_req: Request, res: Response) => {
  try {
    // Buscar IDs válidos do banco
    const vendor = await prisma.partner.findFirst({
      where: { type: 'VENDOR', isActive: true }
    });

    const payerAccount = await prisma.payerAccount.findFirst({
      where: { isActive: true }
    });

    const validExamples = {
      partner: {
        minimal: {
          name: "Fazenda TestSprite",
          type: "VENDOR"
        },
        complete: {
          name: "Fazenda TestSprite Completa",
          type: "VENDOR",
          cpfCnpj: "12.345.678/0001-90",
          phone: "(11) 99999-9999",
          email: "testsprite@fazenda.com",
          address: "Rodovia Test, km 123",
          notes: "Parceiro criado para testes automatizados"
        },
        validTypes: [
          "VENDOR", "BROKER", "BUYER", "INVESTOR", 
          "SERVICE_PROVIDER", "FREIGHT_CARRIER", "OTHER"
        ]
      },
      cattlePurchase: {
        minimal: {
          vendorId: vendor?.id || "cmfgqd1zg00018ay7so9zzmk2", // ID real do banco
          payerAccountId: payerAccount?.id || "cmfgqd1un00008ay7pj9p1urn", // ID real do banco
          purchaseDate: new Date().toISOString(),
          animalType: "MALE",
          initialQuantity: 50,
          purchaseWeight: 15000.0,
          carcassYield: 55.5,
          pricePerArroba: 280.50,
          paymentType: "CASH"
        },
        complete: {
          vendorId: vendor?.id || "cmfgqd1zg00018ay7so9zzmk2", // ID real do banco
          payerAccountId: payerAccount?.id || "cmfgqd1un00008ay7pj9p1urn", // ID real do banco
          purchaseDate: new Date().toISOString(),
          animalType: "MALE",
          initialQuantity: 100,
          purchaseWeight: 30000,
          carcassYield: 58.0,
          pricePerArroba: 285.75,
          paymentType: "CASH",
          notes: "Compra criada para testes automatizados"
        },
        validAnimalTypes: ["MALE", "FEMALE", "MIXED"],
        validPaymentTypes: ["CASH", "INSTALLMENT", "BARTER"]
      },
      expense: {
        minimal: {
          category: "FEED",
          description: "Ração para gado",
          totalAmount: 1500.00,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias no futuro
        },
        complete: {
          category: "VETERINARY",
          description: "Consulta veterinária",
          totalAmount: 800.50,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Despesa criada para testes automatizados",
          impactsCashFlow: true
        },
        validCategories: ["FEED", "VETERINARY", "MAINTENANCE", "LABOR", "TRANSPORT", "OTHER"]
      },
      availableIds: {
        vendors: await prisma.partner.findMany({
          where: { type: 'VENDOR', isActive: true },
          select: { id: true, name: true },
          take: 5
        }),
        payerAccounts: await prisma.payerAccount.findMany({
          where: { isActive: true },
          select: { id: true, accountName: true },
          take: 5
        })
      },
      validationRules: {
        partner: {
          name: "3-100 caracteres, obrigatório",
          type: "Enum PartnerType, obrigatório",
          email: "Formato válido se fornecido",
          cpfCnpj: "Único se fornecido"
        },
        cattlePurchase: {
          vendorId: "ID existente na tabela partners, obrigatório",
          payerAccountId: "ID existente na tabela payer_accounts, obrigatório", 
          purchaseDate: "ISO8601 format, obrigatório",
          animalType: "MALE|FEMALE|MIXED, obrigatório",
          initialQuantity: "Inteiro >= 1, obrigatório",
          purchaseWeight: "Float >= 1, obrigatório",
          carcassYield: "Float 1-100, obrigatório",
          pricePerArroba: "Float >= 0, obrigatório",
          paymentType: "CASH|INSTALLMENT|BARTER, obrigatório"
        }
      }
    };

    res.json({
      status: 'success',
      message: 'Dados de teste válidos para TestSprite MCP',
      data: validExamples
    });

  } catch (error) {
    console.error('Erro ao gerar dados de teste:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao gerar dados de teste',
      statusCode: 500
    });
  }
});

// DELETE /api/v1/test-data/cleanup
router.delete('/cleanup', async (_req: Request, res: Response) => {
  try {
    // Limpar dados de teste (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        status: 'error',
        message: 'Limpeza de dados só é permitida em desenvolvimento'
      });
    }

    // Identificar e remover dados de teste
    const testDataPatterns = {
      partners: {
        name: ['Test', 'TestSprite', 'Teste', 'Mock', 'Demo'],
        cpfCnpj: /^999\./
      },
      expenses: {
        category: ['test_category', 'test_expense', 'other'],
        description: /^(test|teste|mock|demo)/i
      }
    };

    // Limpar parceiros de teste
    const deletedPartners = await prisma.partner.deleteMany({
      where: {
        OR: [
          { name: { in: testDataPatterns.partners.name } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Teste' } },
          { cpfCnpj: { startsWith: '999.' } }
        ]
      }
    });

    // Limpar despesas de teste
    const deletedExpenses = await prisma.expense.deleteMany({
      where: {
        OR: [
          { category: { in: testDataPatterns.expenses.category } },
          { description: { contains: 'test' } },
          { description: { contains: 'Test' } },
          { description: { contains: 'Mock' } }
        ]
      }
    });

    res.json({
      status: 'success',
      message: 'Dados de teste limpos com sucesso',
      data: {
        deletedPartners: deletedPartners.count,
        deletedExpenses: deletedExpenses.count,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erro ao limpar dados de teste',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/v1/test-data/field-requirements
router.get('/field-requirements', (_req: Request, res: Response) => {
  const requirements = {
    "POST /api/v1/partners": {
      required: ["name", "type"],
      optional: ["cpfCnpj", "phone", "email", "address", "notes"],
      enums: {
        type: ["VENDOR", "BROKER", "BUYER", "INVESTOR", "SERVICE_PROVIDER", "FREIGHT_CARRIER", "OTHER"]
      }
    },
    "POST /api/v1/cattle-purchases": {
      required: [
        "vendorId", "payerAccountId", "purchaseDate", 
        "animalType", "initialQuantity", "purchaseWeight", 
        "carcassYield", "pricePerArroba", "paymentType"
      ],
      optional: ["notes", "location", "farm"],
      enums: {
        animalType: ["MALE", "FEMALE", "MIXED"],
        paymentType: ["CASH", "INSTALLMENT", "BARTER"]
      },
      validation: {
        initialQuantity: "integer >= 1",
        purchaseWeight: "float >= 1", 
        carcassYield: "float 1-100",
        pricePerArroba: "float >= 0",
        purchaseDate: "ISO8601 format"
      }
    }
  };

  res.json({
    status: 'success',
    message: 'Requisitos de campos para APIs',
    data: requirements
  });
});

export default router;
