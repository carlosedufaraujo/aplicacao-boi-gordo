const axios = require('axios');

const API_URL = 'http://localhost:3001/api/v1';

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

async function testRegistration() {
  console.log(colors.cyan + '\n📝 Testando Registro de Novo Usuário' + colors.reset);
  console.log('─'.repeat(50));
  
  const newUser = {
    email: `test_${Date.now()}@boicontrol.com`,
    password: 'Test123!@#',
    name: 'Usuário Teste',
    role: 'USER'
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, newUser);
    
    if (response.data.status === 'success') {
      console.log(colors.green + '✅ Registro realizado com sucesso!' + colors.reset);
      console.log('👤 Usuário:', response.data.data.user.name);
      console.log('📧 Email:', response.data.data.user.email);
      console.log('🎭 Role:', response.data.data.user.role);
      console.log('🎫 Token recebido:', response.data.data.token ? '✅' : '❌');
      
      return {
        success: true,
        user: response.data.data.user,
        token: response.data.data.token
      };
    }
  } catch (error) {
    console.log(colors.red + '❌ Erro no registro:' + colors.reset);
    console.log('   ', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testLogin() {
  console.log(colors.cyan + '\n🔐 Testando Login' + colors.reset);
  console.log('─'.repeat(50));
  
  const credentials = {
    email: 'admin@boicontrol.com',
    password: 'admin123'
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    
    if (response.data.status === 'success') {
      console.log(colors.green + '✅ Login realizado com sucesso!' + colors.reset);
      console.log('👤 Usuário:', response.data.data.user.name);
      console.log('📧 Email:', response.data.data.user.email);
      console.log('🎭 Role:', response.data.data.user.role);
      console.log('⭐ Master:', response.data.data.user.isMaster ? 'Sim' : 'Não');
      console.log('🎫 Token recebido:', response.data.data.token ? '✅' : '❌');
      
      return {
        success: true,
        token: response.data.data.token
      };
    }
  } catch (error) {
    console.log(colors.red + '❌ Erro no login:' + colors.reset);
    console.log('   ', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testAuthenticatedRoute(token) {
  console.log(colors.cyan + '\n🔍 Testando Rota Autenticada (/auth/me)' + colors.reset);
  console.log('─'.repeat(50));
  
  try {
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.status === 'success') {
      console.log(colors.green + '✅ Token válido! Usuário autenticado:' + colors.reset);
      console.log('👤 Nome:', response.data.data.user.name);
      console.log('📧 Email:', response.data.data.user.email);
      console.log('🎭 Role:', response.data.data.user.role);
      return { success: true };
    }
  } catch (error) {
    console.log(colors.red + '❌ Erro na autenticação:' + colors.reset);
    console.log('   ', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testChangePassword(token) {
  console.log(colors.cyan + '\n🔒 Testando Alteração de Senha' + colors.reset);
  console.log('─'.repeat(50));
  
  const passwordData = {
    currentPassword: 'admin123',
    newPassword: 'NewAdmin123!'
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/change-password`, passwordData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.status === 'success') {
      console.log(colors.green + '✅ Senha alterada com sucesso!' + colors.reset);
      
      // Tentar fazer login com a nova senha
      console.log('\n🔐 Testando login com nova senha...');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: 'admin@boicontrol.com',
        password: 'NewAdmin123!'
      });
      
      if (loginResponse.data.status === 'success') {
        console.log(colors.green + '✅ Login com nova senha funcionou!' + colors.reset);
        
        // Reverter para senha original
        console.log('\n🔄 Revertendo para senha original...');
        await axios.post(`${API_URL}/auth/change-password`, {
          currentPassword: 'NewAdmin123!',
          newPassword: 'admin123'
        }, {
          headers: {
            Authorization: `Bearer ${loginResponse.data.data.token}`
          }
        });
        console.log(colors.green + '✅ Senha revertida!' + colors.reset);
      }
      
      return { success: true };
    }
  } catch (error) {
    console.log(colors.red + '❌ Erro na alteração de senha:' + colors.reset);
    console.log('   ', error.response?.data?.message || error.message);
    return { success: false };
  }
}

async function testInvalidLogin() {
  console.log(colors.cyan + '\n🚫 Testando Login com Credenciais Inválidas' + colors.reset);
  console.log('─'.repeat(50));
  
  const invalidCredentials = {
    email: 'admin@boicontrol.com',
    password: 'senhaerrada'
  };
  
  try {
    await axios.post(`${API_URL}/auth/login`, invalidCredentials);
    console.log(colors.red + '❌ ERRO: Login com senha errada foi aceito!' + colors.reset);
    return { success: false };
  } catch (error) {
    if (error.response?.status === 401) {
      console.log(colors.green + '✅ Credenciais inválidas rejeitadas corretamente' + colors.reset);
      console.log('   Mensagem:', error.response.data.message);
      return { success: true };
    } else {
      console.log(colors.red + '❌ Erro inesperado:' + colors.reset);
      console.log('   ', error.message);
      return { success: false };
    }
  }
}

async function runAllTests() {
  console.log(colors.bold + colors.blue + '\n🧪 TESTE COMPLETO DO SISTEMA DE AUTENTICAÇÃO' + colors.reset);
  console.log('═'.repeat(50));
  
  const results = {
    registration: false,
    login: false,
    authenticated: false,
    changePassword: false,
    invalidLogin: false
  };
  
  // 1. Testar Registro
  const registrationResult = await testRegistration();
  results.registration = registrationResult.success;
  
  // 2. Testar Login
  const loginResult = await testLogin();
  results.login = loginResult.success;
  
  if (loginResult.success && loginResult.token) {
    // 3. Testar Rota Autenticada
    const authResult = await testAuthenticatedRoute(loginResult.token);
    results.authenticated = authResult.success;
    
    // 4. Testar Alteração de Senha
    // Comentado para não alterar a senha do admin em produção
    // const passwordResult = await testChangePassword(loginResult.token);
    // results.changePassword = passwordResult.success;
  }
  
  // 5. Testar Login Inválido
  const invalidResult = await testInvalidLogin();
  results.invalidLogin = invalidResult.success;
  
  // Resumo Final
  console.log(colors.bold + colors.blue + '\n📊 RESUMO DOS TESTES' + colors.reset);
  console.log('═'.repeat(50));
  
  const totalTests = Object.keys(results).length;
  const successfulTests = Object.values(results).filter(r => r).length;
  
  for (const [test, result] of Object.entries(results)) {
    const testName = test.charAt(0).toUpperCase() + test.slice(1).replace(/([A-Z])/g, ' $1');
    const status = result ? colors.green + '✅ PASSOU' : colors.red + '❌ FALHOU';
    console.log(`${testName}: ${status}${colors.reset}`);
  }
  
  console.log('\n' + '─'.repeat(50));
  const allPassed = successfulTests === totalTests;
  const finalColor = allPassed ? colors.green : colors.yellow;
  console.log(finalColor + colors.bold + 
    `Resultado Final: ${successfulTests}/${totalTests} testes passaram` + 
    colors.reset);
  
  if (allPassed) {
    console.log(colors.green + colors.bold + '\n🎉 TODOS OS TESTES PASSARAM!' + colors.reset);
  } else {
    console.log(colors.yellow + '\n⚠️  Alguns testes falharam. Verifique os logs acima.' + colors.reset);
  }
}

// Executar todos os testes
runAllTests().catch(console.error);