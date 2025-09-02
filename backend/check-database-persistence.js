const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabasePersistence() {
  try {
    console.log('🔍 VERIFICANDO PERSISTÊNCIA DO BANCO DE DADOS\n');
    console.log('================================\n');
    
    // 1. Verificar conexão
    console.log('1️⃣ TESTANDO CONEXÃO:');
    await prisma.$connect();
    console.log('✅ Conectado ao banco de dados Supabase\n');
    
    // 2. Contar registros em todas as tabelas principais
    console.log('2️⃣ CONTAGEM DE REGISTROS:\n');
    
    const tables = [
      { name: 'users', model: prisma.user },
      { name: 'partners', model: prisma.partner },
      { name: 'cattlePurchases', model: prisma.cattlePurchase },
      { name: 'costCenters', model: prisma.costCenter },
      { name: 'expenses', model: prisma.expense },
      { name: 'revenues', model: prisma.revenue },
      { name: 'pens', model: prisma.pen },
      { name: 'saleRecords', model: prisma.saleRecord },
      { name: 'cycles', model: prisma.cycle }
    ];
    
    let totalRecords = 0;
    for (const table of tables) {
      const count = await table.model.count();
      console.log(`   ${table.name}: ${count} registros`);
      totalRecords += count;
    }
    
    console.log(`\n   TOTAL GERAL: ${totalRecords} registros\n`);
    
    // 3. Criar um registro de teste temporário
    console.log('3️⃣ TESTE DE PERSISTÊNCIA:\n');
    
    // Criar centro de custo de teste
    const testCenter = await prisma.costCenter.create({
      data: {
        code: `TEST-${Date.now()}`,
        name: `Teste Persistência ${new Date().toISOString()}`,
        type: 'ADMINISTRATIVE',
        isActive: true
      }
    });
    console.log(`   ✅ Centro de custo teste criado: ${testCenter.code}`);
    
    // Verificar se foi salvo
    const exists = await prisma.costCenter.findUnique({
      where: { id: testCenter.id }
    });
    
    if (exists) {
      console.log(`   ✅ Registro verificado no banco`);
      
      // Deletar registro de teste
      await prisma.costCenter.delete({
        where: { id: testCenter.id }
      });
      console.log(`   ✅ Registro de teste removido\n`);
    } else {
      console.log(`   ❌ ERRO: Registro não foi persistido!\n`);
    }
    
    // 4. Verificar dados importantes
    console.log('4️⃣ DADOS IMPORTANTES:\n');
    
    // Centros de custo administrativos
    const adminCenters = await prisma.costCenter.findMany({
      where: {
        type: 'ADMINISTRATIVE'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    if (adminCenters.length > 0) {
      console.log('   Últimos centros de custo administrativos:');
      adminCenters.forEach(cc => {
        const age = Math.floor((Date.now() - new Date(cc.createdAt).getTime()) / 1000 / 60);
        console.log(`   • [${cc.code}] ${cc.name} - Criado há ${age} minutos`);
      });
    } else {
      console.log('   ❌ Nenhum centro de custo administrativo encontrado');
    }
    
    // 5. Verificar configuração do Prisma
    console.log('\n5️⃣ CONFIGURAÇÃO DO PRISMA:\n');
    
    const databaseUrl = process.env.DATABASE_URL;
    if (databaseUrl) {
      const isSupabase = databaseUrl.includes('supabase.co');
      const schema = databaseUrl.includes('schema=') ? databaseUrl.split('schema=')[1].split('&')[0] : 'public';
      
      console.log(`   Banco: ${isSupabase ? 'Supabase' : 'PostgreSQL'}`);
      console.log(`   Schema: ${schema}`);
      console.log(`   Host: ${databaseUrl.split('@')[1].split(':')[0]}`);
    }
    
    // 6. Possíveis causas de perda de dados
    console.log('\n6️⃣ POSSÍVEIS CAUSAS DE PERDA DE DADOS:\n');
    
    const issues = [];
    
    // Verificar se há múltiplas instâncias do Prisma
    if (process.env.NODE_ENV === 'development') {
      issues.push('• Ambiente de desenvolvimento - verificar se não há reset automático');
    }
    
    // Verificar migrations
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 5
      `;
      
      if (migrations && migrations.length > 0) {
        console.log('   Últimas migrations aplicadas:');
        migrations.forEach(m => {
          console.log(`   • ${m.migration_name} - ${m.finished_at}`);
        });
      }
    } catch (error) {
      issues.push('• Tabela de migrations não encontrada - banco pode estar sendo recriado');
    }
    
    if (issues.length > 0) {
      console.log('\n   ⚠️ ALERTAS:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    // 7. Recomendações
    console.log('\n7️⃣ RECOMENDAÇÕES:\n');
    console.log('   1. Verificar se não há scripts que fazem reset do banco');
    console.log('   2. Confirmar que está usando o banco correto no Supabase');
    console.log('   3. Verificar logs do Supabase para atividade incomum');
    console.log('   4. Considerar fazer backup regular dos dados');
    console.log('   5. Verificar se não há múltiplas instâncias rodando');
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabasePersistence();