import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente de teste
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// Mock do Prisma Client para testes
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/testdb'
    }
  }
});

// Configuração global para testes
beforeAll(async () => {
  // Conectar ao banco de testes
  await prisma.$connect();
});

afterAll(async () => {
  // Desconectar do banco após todos os testes
  await prisma.$disconnect();
});

// Limpar banco entre testes se necessário
beforeEach(async () => {
  // Pode adicionar lógica de limpeza aqui se necessário
});

// Configurar timeouts globais
jest.setTimeout(30000);

// Mock de console para evitar poluição nos testes
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  // manter log para debug se necessário
  log: console.log,
};

// Exportar prisma para uso nos testes
export { prisma };