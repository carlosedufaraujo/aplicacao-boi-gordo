const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

async function testUserAPI() {
  console.log('🧪 TESTE DIRETO DA API DE USUÁRIOS (desenvolvimento)\n');
  console.log('='.repeat(50));
  
  try {
    // Em desenvolvimento, o middleware autentica automaticamente
    console.log('\n📋 1. LISTAGEM DE USUÁRIOS (sem token):');
    console.log('-'.repeat(40));
    
    try {
      const listResponse = await axios.get(`${API_URL}/users`);
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
    } catch (error) {
      console.log('❌ Erro ao listar usuários:', error.response?.status || error.message);
      if (error.response?.data) {
        console.log('   Detalhes:', error.response.data);
      }
    }
    
    // 2. Testar busca de perfil
    console.log('\n\n👤 2. MEU PERFIL (sem token):');
    console.log('-'.repeat(40));
    
    try {
      const profileResponse = await axios.get(`${API_URL}/users/profile`);
      const profile = profileResponse.data.data;
      
      console.log(`✅ Perfil carregado:`);
      console.log(`   Nome: ${profile.name}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role}`);
      console.log(`   Master: ${profile.isMaster ? 'Sim' : 'Não'}`);
      console.log(`   Ativo: ${profile.isActive ? 'Sim' : 'Não'}`);
    } catch (error) {
      console.log('❌ Erro ao buscar perfil:', error.response?.status || error.message);
      if (error.response?.data) {
        console.log('   Detalhes:', error.response.data);
      }
    }
    
    console.log('\n\n' + '='.repeat(50));
    console.log('💡 ANÁLISE:');
    console.log('='.repeat(50));
    console.log('\nO middleware de autenticação está configurado para:');
    console.log('1. Em desenvolvimento, buscar admin@boicontrol.com no banco');
    console.log('2. Se não encontrar, buscar admin@boigordo.com');
    console.log('3. Se não encontrar nenhum, criar usuário temporário');
    console.log('\n⚠️ Se o erro 500 persistir, é porque:');
    console.log('   - O usuário temporário tem ID "dev-user" (não existe no banco)');
    console.log('   - A API tenta buscar este ID no banco e falha');
    console.log('\n✅ SOLUÇÃO:');
    console.log('   - O usuário admin@boicontrol.com já foi criado no banco');
    console.log('   - Ele tem role ADMIN e isMaster = true');
    console.log('   - O middleware deve encontrá-lo e usar o usuário real');
    
  } catch (error) {
    console.error('\n❌ Erro geral:', error.message);
  }
}

testUserAPI();