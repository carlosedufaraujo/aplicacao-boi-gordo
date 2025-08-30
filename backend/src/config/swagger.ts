import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BoviControl - API de Gestão Pecuária',
      version: '1.0.0',
      description: 'API para gerenciamento completo de gestão pecuária, incluindo compras, lotes, vendas e finanças.',
      contact: {
        name: 'BoviControl',
        email: 'contato@bovicontrol.com.br',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
        description: 'Servidor de Desenvolvimento',
      },
      {
        url: `https://api.bovicontrol.com.br${env.API_PREFIX}`,
        description: 'Servidor de Produção',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
            },
            statusCode: {
              type: 'number',
              description: 'Código de status HTTP',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {},
            },
            total: {
              type: 'number',
            },
            page: {
              type: 'number',
            },
            limit: {
              type: 'number',
            },
            totalPages: {
              type: 'number',
            },
          },
        },
        Partner: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { 
              type: 'string',
              enum: ['VENDOR', 'BROKER', 'BUYER', 'INVESTOR', 'SERVICE_PROVIDER', 'OTHER'],
            },
            cpfCnpj: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            address: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PurchaseOrder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            orderNumber: { type: 'string' },
            vendorId: { type: 'string' },
            brokerId: { type: 'string', nullable: true },
            location: { type: 'string' },
            purchaseDate: { type: 'string', format: 'date-time' },
            animalCount: { type: 'number' },
            animalType: { 
              type: 'string',
              enum: ['MALE', 'FEMALE', 'MIXED'],
            },
            averageAge: { type: 'number', nullable: true },
            totalWeight: { type: 'number' },
            averageWeight: { type: 'number' },
            carcassYield: { type: 'number' },
            pricePerArroba: { type: 'number' },
            totalValue: { type: 'number' },
            commission: { type: 'number' },
            freightCost: { type: 'number' },
            otherCosts: { type: 'number' },
            paymentType: { 
              type: 'string',
              enum: ['CASH', 'INSTALLMENT', 'MIXED'],
            },
            status: { 
              type: 'string',
              enum: ['PENDING', 'PAYMENT_VALIDATING', 'RECEPTION', 'CONFINED', 'CANCELLED'],
            },
            currentStage: { type: 'string' },
            notes: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CattleLot: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            lotNumber: { type: 'string' },
            purchaseOrderId: { type: 'string' },
            entryDate: { type: 'string', format: 'date-time' },
            entryWeight: { type: 'number' },
            entryQuantity: { type: 'number' },
            currentQuantity: { type: 'number' },
            deathCount: { type: 'number' },
            acquisitionCost: { type: 'number' },
            healthCost: { type: 'number' },
            feedCost: { type: 'number' },
            operationalCost: { type: 'number' },
            freightCost: { type: 'number' },
            otherCosts: { type: 'number' },
            totalCost: { type: 'number' },
            status: { 
              type: 'string',
              enum: ['ACTIVE', 'SOLD', 'CANCELLED'],
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 6,
            },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
            },
            password: {
              type: 'string',
              minLength: 6,
            },
            name: {
              type: 'string',
              minLength: 2,
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'USER', 'VIEWER'],
              default: 'USER',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
            token: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
  ],
};

export const swaggerSpecs = swaggerJsdoc(options);