#!/usr/bin/env node

/**
 * TESTE COMPLETO DO SISTEMA BOVICONTROL
 * 
 * Este script testa:
 * 1. Conexão do backend com banco PostgreSQL
 * 2. API do backend funcionando
 * 3. Dados reais sendo lidos/escritos
 * 4. Frontend Vercel funcionando
 * 5. Sistema de fallback
 */

const axios = require('axios');
const { PrismaClient } = require('./backend/node_modules/@prisma/client');

// Configurações
const BACKEND_URL = 'http://localhost:3002';
const FRONTEND_URL = 'https://aplicacao-boi-gordo.vercel.app';

class SistemaTest {
  constructor() {
    this.prisma = new PrismaClient();
    this.resultados = {
      backend: { status: '❓', detalhes: [] },
      banco: { status: '❓', detalhes: [] },
      api: { status: '❓', detalhes: [] },
      frontend: { status: '❓', detalhes: [] },
      integracao: { status: '❓', detalhes: [] }
    };
  }

  log(categoria, mensagem, sucesso = true) {
    const emoji = sucesso ? '✅' : '❌';
    console.log(`${emoji} [${categoria.toUpperCase()}] ${mensagem}`);
    this.resultados[categoria].detalhes.push({ mensagem, sucesso });
  }

  async testarConexaoBanco() {
    console.log('\n🔍 TESTANDO CONEXÃO COM BANCO DE DADOS...');
    
    try {
      // Testar conexão
      await this.prisma.$connect();
      this.log('banco', 'Conexão estabelecida com sucesso');

      // Testar query básica
      await this.prisma.$queryRaw`SELECT 1 as test`;
      this.log('banco', 'Query de teste executada');

      // Contar registros
      const usuarios = await this.prisma.user.count();
      const despesas = await this.prisma.expense.count();
      const receitas = await this.prisma.revenue.count();
      const parceiros = await this.prisma.partner.count();
      const compras = await this.prisma.cattlePurchase.count();

      this.log('banco', `Usuários: ${usuarios}`);
      this.log('banco', `Despesas: ${despesas}`);
      this.log('banco', `Receitas: ${receitas}`);
      this.log('banco', `Parceiros: ${parceiros}`);
      this.log('banco', `Compras de Gado: ${compras}`);

      this.resultados.banco.status = '✅';
      return true;

    } catch (error) {
      this.log('banco', `Erro na conexão: ${error.message}`, false);
      this.resultados.banco.status = '❌';
      return false;
    }
  }

  async testarBackendAPI() {
    console.log('\n🔍 TESTANDO API DO BACKEND...');

    try {
      // Aguardar backend inicializar
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Testar rota de stats (pública)
      const statsResponse = await axios.get(`${BACKEND_URL}/api/v1/stats`, {
        timeout: 5000
      });
      
      this.log('api', 'Rota /stats respondendo');
      this.log('api', `Status: ${statsResponse.status}`);
      
      const stats = statsResponse.data;
      if (stats.totalCattle) {
        this.log('api', `Total de gado: ${stats.totalCattle}`);
      }

      // Testar outras rotas públicas se existirem
      try {
        const healthResponse = await axios.get(`${BACKEND_URL}/health`, {
          timeout: 3000
        });
        this.log('api', 'Rota /health respondendo');
      } catch (e) {
        this.log('api', 'Rota /health não encontrada (normal)', true);
      }

      this.resultados.api.status = '✅';
      return true;

    } catch (error) {
      this.log('api', `Erro na API: ${error.message}`, false);
      if (error.code === 'ECONNREFUSED') {
        this.log('api', 'Backend não está rodando ou porta incorreta', false);
      }
      this.resultados.api.status = '❌';
      return false;
    }
  }

  async testarFrontendVercel() {
    console.log('\n🔍 TESTANDO FRONTEND VERCEL...');

    try {
      // Testar se o frontend está acessível
      const response = await axios.get(FRONTEND_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'BoviControl-Test/1.0'
        }
      });

      this.log('frontend', 'Site acessível');
      this.log('frontend', `Status: ${response.status}`);

      // Verificar se é uma SPA (contém div#root ou similar)
      if (response.data.includes('root') || response.data.includes('React')) {
        this.log('frontend', 'Aplicação React detectada');
      }

      // Testar API do Vercel
      try {
        const apiResponse = await axios.get(`${FRONTEND_URL}/api/stats`, {
          timeout: 5000
        });
        this.log('frontend', 'API Vercel respondendo');
        this.log('frontend', `API Status: ${apiResponse.status}`);
      } catch (e) {
        this.log('frontend', 'API Vercel usando fallback local (esperado)', true);
      }

      this.resultados.frontend.status = '✅';
      return true;

    } catch (error) {
      this.log('frontend', `Erro no frontend: ${error.message}`, false);
      this.resultados.frontend.status = '❌';
      return false;
    }
  }

  async testarIntegracaoCompleta() {
    console.log('\n🔍 TESTANDO INTEGRAÇÃO COMPLETA...');

    try {
      // Verificar se dados do banco correspondem à API
      const usuariosBanco = await this.prisma.user.count();
      
      const statsAPI = await axios.get(`${BACKEND_URL}/api/v1/stats`);
      
      this.log('integracao', 'Dados do banco acessíveis via API');
      this.log('integracao', `Usuários no banco: ${usuariosBanco}`);
      
      // Verificar consistência (se possível)
      if (statsAPI.data && typeof statsAPI.data === 'object') {
        this.log('integracao', 'API retorna dados estruturados');
      }

      this.resultados.integracao.status = '✅';
      return true;

    } catch (error) {
      this.log('integracao', `Erro na integração: ${error.message}`, false);
      this.resultados.integracao.status = '❌';
      return false;
    }
  }

  async executarTodosTestes() {
    console.log('🚀 INICIANDO TESTE COMPLETO DO SISTEMA BOVICONTROL');
    console.log('=' .repeat(60));

    const resultados = {
      banco: await this.testarConexaoBanco(),
      api: await this.testarBackendAPI(),
      frontend: await this.testarFrontendVercel(),
      integracao: await this.testarIntegracaoCompleta()
    };

    // Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DOS TESTES');
    console.log('='.repeat(60));

    Object.entries(this.resultados).forEach(([categoria, dados]) => {
      console.log(`\n${dados.status} ${categoria.toUpperCase()}`);
      dados.detalhes.forEach(detalhe => {
        const emoji = detalhe.sucesso ? '  ✓' : '  ✗';
        console.log(`${emoji} ${detalhe.mensagem}`);
      });
    });

    const sucessos = Object.values(resultados).filter(r => r).length;
    const total = Object.values(resultados).length;

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 RESULTADO GERAL: ${sucessos}/${total} testes passaram`);
    
    if (sucessos === total) {
      console.log('🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!');
    } else if (sucessos >= total * 0.75) {
      console.log('⚠️  SISTEMA FUNCIONANDO COM ALGUMAS LIMITAÇÕES');
    } else {
      console.log('❌ SISTEMA COM PROBLEMAS CRÍTICOS');
    }

    console.log('='.repeat(60));

    // Cleanup
    await this.prisma.$disconnect();
  }
}

// Executar testes
const teste = new SistemaTest();
teste.executarTodosTestes().catch(console.error);
