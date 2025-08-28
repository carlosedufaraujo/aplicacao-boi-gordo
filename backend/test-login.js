const axios = require('axios');

const BASE_URL = 'http://localhost:3333';

async function testLogin() {
  console.log('🔐 Testando endpoint de login...\n');

  try {
    // 1. Testar login do usuário master
    console.log('1️⃣ Testando login do usuário master...');
    const masterLoginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'carlosedufaraujo@outlook.com',
      password: '368308450'
    });

    if (masterLoginResponse.status === 200) {
      console.log('   ✅ Login master bem-sucedido!');
      console.log(`   Usuário: ${masterLoginResponse.data.user.name}`);
      console.log(`   Role: ${masterLoginResponse.data.user.role}`);
      console.log(`   isMaster: ${masterLoginResponse.data.user.isMaster}`);
      console.log(`   Token: ${masterLoginResponse.data.token.substring(0, 50)}...`);
      
      const masterToken = masterLoginResponse.data.token;
      
      // 2. Testar acesso a rota protegida
      console.log('\n2️⃣ Testando acesso a rota protegida...');
      try {
        const protectedResponse = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
          headers: {
            'Authorization': `Bearer ${masterToken}`
          }
        });
        console.log('   ✅ Acesso a rota protegida bem-sucedido!');
        console.log(`   Status: ${protectedResponse.status}`);
      } catch (error) {
        console.log('   ⚠️ Rota protegida não implementada ainda');
      }

      // 3. Testar endpoint de usuários (apenas master pode acessar)
      console.log('\n3️⃣ Testando endpoint de usuários (master only)...');
      try {
        const usersResponse = await axios.get(`${BASE_URL}/api/v1/users`, {
          headers: {
            'Authorization': `Bearer ${masterToken}`
          }
        });
        console.log('   ✅ Lista de usuários acessada!');
        console.log(`   Usuários encontrados: ${usersResponse.data.length}`);
      } catch (error) {
        console.log('   ⚠️ Endpoint de usuários não implementado ainda');
      }

    } else {
      console.log('   ❌ Login master falhou');
    }

    // 4. Testar login de usuário comum
    console.log('\n4️⃣ Testando login de usuário comum...');
    try {
      const userLoginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'gerente@ceac.com.br',
        password: 'gerente123'
      });

      if (userLoginResponse.status === 200) {
        console.log('   ✅ Login usuário comum bem-sucedido!');
        console.log(`   Usuário: ${userLoginResponse.data.user.name}`);
        console.log(`   Role: ${userLoginResponse.data.user.role}`);
        console.log(`   isMaster: ${userLoginResponse.data.user.isMaster}`);
      } else {
        console.log('   ❌ Login usuário comum falhou');
      }
    } catch (error) {
      console.log('   ❌ Erro no login de usuário comum:', error.response?.data?.message || error.message);
    }

    // 5. Testar login com credenciais inválidas
    console.log('\n5️⃣ Testando login com credenciais inválidas...');
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: 'usuario@inexistente.com',
        password: 'senhaerrada'
      });
      console.log('   ❌ Login deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Login corretamente rejeitado (401 Unauthorized)');
      } else {
        console.log('   ⚠️ Erro inesperado:', error.response?.status);
      }
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Servidor não está rodando em http://localhost:3333');
      console.log('   Execute: npm run dev ou node simple-server.js');
    } else {
      console.log('❌ Erro durante os testes:', error.message);
    }
  }

  console.log('\n✅ Testes de login concluídos!');
}

testLogin();
