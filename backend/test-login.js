const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testando login com admin@boicontrol.com...\n');
    
    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    if (response.data.status === 'success') {
      console.log('✅ Login realizado com sucesso!');
      console.log('📦 Estrutura da resposta:', JSON.stringify(response.data, null, 2));
      
      const token = response.data.data?.token || response.data.token;
      const user = response.data.data?.user || response.data.user;
      
      console.log('🎫 Token:', token);
      console.log('👤 Usuário:', user?.name);
      console.log('📧 Email:', user?.email);
      console.log('🎭 Role:', user?.role);
      console.log('⭐ Master:', user?.isMaster);
      
      // Testar o token
      if (token) {
        console.log('\n🔍 Testando token com /auth/me...');
        const meResponse = await axios.get('http://localhost:3001/api/v1/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('✅ Token válido! Usuário autenticado:', meResponse.data.data.user.email);
      } else {
        console.log('⚠️  Token não foi retornado na resposta');
      }
      
    } else {
      console.log('❌ Falha no login:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Erro ao fazer login:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Credenciais inválidas. Verifique:');
      console.log('   - Email: admin@boicontrol.com');
      console.log('   - Senha: admin123');
    }
  }
}

testLogin();