const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Simular teste de autenticação
async function testAuth() {
  console.log('🔐 Testando sistema de autenticação...\n');

  // 1. Testar hash de senha
  console.log('1️⃣ Testando hash de senha...');
  const password = '368308450';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`   Senha original: ${password}`);
  console.log(`   Hash gerado: ${hashedPassword}`);
  
  // 2. Testar verificação de senha
  console.log('\n2️⃣ Testando verificação de senha...');
  const isPasswordValid = await bcrypt.compare(password, hashedPassword);
  console.log(`   Senha válida: ${isPasswordValid}`);

  // 3. Testar geração de JWT
  console.log('\n3️⃣ Testando geração de JWT...');
  const user = {
    id: 'test-user-id',
    email: 'carlosedufaraujo@outlook.com',
    role: 'ADMIN',
    isMaster: true
  };
  
  const token = jwt.sign(user, 'seu_jwt_secret_muito_seguro_aqui', { expiresIn: '24h' });
  console.log(`   Token gerado: ${token.substring(0, 50)}...`);

  // 4. Testar verificação de JWT
  console.log('\n4️⃣ Testando verificação de JWT...');
  try {
    const decoded = jwt.verify(token, 'seu_jwt_secret_muito_seguro_aqui');
    console.log(`   Token válido: ${decoded.email} (${decoded.role})`);
  } catch (error) {
    console.log(`   ❌ Erro na verificação: ${error.message}`);
  }

  // 5. Testar credenciais do usuário master
  console.log('\n5️⃣ Testando credenciais do usuário master...');
  console.log(`   Email: carlosedufaraujo@outlook.com`);
  console.log(`   Senha: 368308450`);
  console.log(`   Role: ADMIN`);
  console.log(`   isMaster: true`);

  console.log('\n✅ Testes de autenticação concluídos!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Iniciar o servidor backend');
  console.log('2. Testar endpoint de login');
  console.log('3. Verificar middleware de autenticação');
  console.log('4. Testar rotas protegidas');
}

testAuth().catch(console.error);
