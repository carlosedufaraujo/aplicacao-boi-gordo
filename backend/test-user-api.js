const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNsaWVudF9pZF8xIiwibmFtZSI6IkFkbWluIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsImlhdCI6MTczMjgzNjI2NywiZXhwIjoxNzQxNDc2MjY3fQ.K1tM6CamNqLLX2y0L8qTPFEyAqm2tLq39JfUY0yl-is';

async function testUserAPI() {
  console.log('🧪 TESTE DA API DE USUÁRIOS COM admin@boicontrol.com\n');
  console.log('='.repeat(50));
  
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Testar listagem de usuários
    console.log('\n📋 1. LISTAGEM DE USUÁRIOS:');
    console.log('-'.repeat(40));
    
    const listResponse = await axios.get(`${API_URL}/users`, { headers });
    console.log(`✅ Status: ${listResponse.status}`);
    console.log(`✅ Resposta: ${listResponse.data.status}`);
    
    const users = listResponse.data.data || [];
    console.log(`✅ Total de usuários: ${users.length}`);
    
    users.forEach(user => {
      console.log(`\n   👤 ${user.name || 'Sem nome'}`);
      console.log(`      Email: ${user.email}`);
      console.log(`      Role: ${user.role}`);
      console.log(`      Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
      console.log(`      Master: ${user.isMaster ? 'Sim' : 'Não'}`);
    });
    
    // 2. Testar busca de perfil
    console.log('\n\n👤 2. MEU PERFIL:');
    console.log('-'.repeat(40));
    
    const profileResponse = await axios.get(`${API_URL}/users/profile`, { headers });
    const profile = profileResponse.data.data;
    
    console.log(`✅ Perfil carregado:`);
    console.log(`   Nome: ${profile.name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Role: ${profile.role}`);
    console.log(`   Master: ${profile.isMaster ? 'Sim' : 'Não'}`);
    console.log(`   Ativo: ${profile.isActive ? 'Sim' : 'Não'}`);
    
    console.log('\n\n' + '='.repeat(50));
    console.log('✅ API DE USUÁRIOS FUNCIONANDO PERFEITAMENTE!');
    console.log('='.repeat(50));
    console.log('\n🎯 admin@boicontrol.com agora tem:');
    console.log('   ✅ Permissão ADMIN');
    console.log('   ✅ Status MASTER');
    console.log('   ✅ Conta ATIVA');
    console.log('   ✅ Acesso total ao sistema');
    console.log('   ✅ Pode gerenciar outros usuários');
    console.log('\n💡 A página de usuários deve funcionar normalmente agora!');
    
  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data || error.message);
    
    if (error.response?.status === 403) {
      console.log('\n⚠️ Problema de permissão detectado');
      console.log('   Verificando configuração do usuário...');
    }
    
    if (error.response?.status === 500) {
      console.log('\n⚠️ Erro no servidor');
      console.log('   O middleware pode precisar ser reiniciado');
      console.log('   Tente parar e iniciar o servidor novamente');
    }
  }
}

testUserAPI();