const { PrismaClient } = require('@prisma/client');

async function testarConexao(nome, url) {
  console.log(`\n🔍 Testando: ${nome}`);
  console.log(`URL: ${url.substring(0, 50)}...`);
  
  // Salvar URL original
  const originalUrl = process.env.DATABASE_URL;
  
  // Testar nova URL
  process.env.DATABASE_URL = url;
  
  const prisma = new PrismaClient({
    log: ['error'],
  });
  
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`✅ SUCESSO! Conexão funcionando`);
    
    const counts = await prisma.user.count();
    console.log(`   Usuários no banco: ${counts}`);
    
    return true;
  } catch (error) {
    console.log(`❌ FALHOU: ${error.message.substring(0, 100)}`);
    return false;
  } finally {
    await prisma.$disconnect();
    process.env.DATABASE_URL = originalUrl;
  }
}

async function testarTodasConexoes() {
  console.log('🔍 TESTANDO TODAS AS STRINGS DE CONEXÃO POSSÍVEIS');
  console.log('==================================================');
  
  const conexoes = [
    {
      nome: "Pooler Session (atual)",
      url: "postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
    },
    {
      nome: "Conexão Direta",
      url: "postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:5432/postgres"
    },
    {
      nome: "Conexão Direta com SSL",
      url: "postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:5432/postgres?sslmode=require"
    },
    {
      nome: "Pooler Transaction",
      url: "postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
    },
    {
      nome: "Pooler Session com SSL",
      url: "postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
    }
  ];
  
  let funcionou = false;
  let urlFuncionando = null;
  
  for (const conexao of conexoes) {
    const sucesso = await testarConexao(conexao.nome, conexao.url);
    if (sucesso && !funcionou) {
      funcionou = true;
      urlFuncionando = conexao;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (funcionou) {
    console.log('\n✅ CONEXÃO ENCONTRADA!\n');
    console.log('Atualize o arquivo .env com:');
    console.log(`DATABASE_URL="${urlFuncionando.url}"`);
  } else {
    console.log('\n❌ NENHUMA CONEXÃO FUNCIONOU');
    console.log('\nPossíveis problemas:');
    console.log('1. Projeto Supabase pausado (acesse https://app.supabase.com)');
    console.log('2. Senha incorreta');
    console.log('3. Limite de conexões atingido');
    console.log('4. Manutenção no servidor');
  }
}

testarTodasConexoes().catch(console.error);