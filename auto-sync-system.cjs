#!/usr/bin/env node

/**
 * 🔄 AUTO-SYNC SYSTEM - Sistema de Sincronização Automática
 * 
 * Este script garante que todos os componentes do sistema estejam
 * sempre sincronizados e funcionando corretamente.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const net = require('net');

// Configurações do sistema
const CONFIG = {
  backend: {
    port: 3001,
    dir: path.join(__dirname, 'backend'),
    envFile: path.join(__dirname, 'backend', '.env'),
    startCommand: 'npm run dev',
    healthCheck: 'http://localhost:3001/api/v1/cattle-purchases'
  },
  frontend: {
    port: 5173,
    dir: __dirname,
    envFile: path.join(__dirname, '.env'),
    startCommand: 'npm run dev',
    healthCheck: 'http://localhost:5173'
  },
  database: {
    connections: [
      {
        name: 'Transaction Pooler (Recomendado)',
        url: 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
        priority: 1
      },
      {
        name: 'Session Pooler',
        url: 'postgresql://postgres.vffxtvuqhlhcbbyqmynz:368308450Ce*@aws-1-sa-east-1.pooler.supabase.com:5432/postgres',
        priority: 2
      },
      {
        name: 'Direct Connection',
        url: 'postgresql://postgres:368308450Ce*@db.vffxtvuqhlhcbbyqmynz.supabase.co:5432/postgres',
        priority: 3
      }
    ]
  }
};

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Verificar se uma porta está disponível
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

// Matar processo em uma porta
async function killPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`netstat -ano | findstr :${port} | findstr LISTENING | for /f "tokens=5" %a in ('more') do taskkill /PID %a /F`, { stdio: 'ignore' });
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' });
    }
    log(`✅ Porta ${port} liberada`, 'green');
  } catch (error) {
    // Porta já está livre
  }
}

// Testar conexão com banco de dados
async function testDatabaseConnection(connectionString) {
  const { PrismaClient } = require('./backend/node_modules/@prisma/client');
  const prisma = new PrismaClient({
    datasources: {
      db: { url: connectionString }
    },
    log: ['error']
  });

  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    return { success: true, userCount };
  } catch (error) {
    await prisma.$disconnect();
    return { success: false, error: error.message };
  }
}

// Encontrar melhor conexão de banco
async function findBestDatabaseConnection() {
  log('\n🔍 Testando conexões com banco de dados...', 'cyan');
  
  for (const conn of CONFIG.database.connections) {
    log(`Testando: ${conn.name}...`, 'yellow');
    const result = await testDatabaseConnection(conn.url);
    
    if (result.success) {
      log(`✅ ${conn.name} funcionando! (${result.userCount} usuários)`, 'green');
      return conn.url;
    } else {
      log(`❌ ${conn.name} falhou: ${result.error}`, 'red');
    }
  }
  
  throw new Error('Nenhuma conexão com banco de dados funcionou!');
}

// Atualizar arquivo .env
function updateEnvFile(filePath, updates) {
  let content = '';
  
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
  }
  
  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'gm');
    const newLine = `${key}="${value}"`;
    
    if (regex.test(content)) {
      content = content.replace(regex, newLine);
    } else {
      content += `\n${newLine}`;
    }
  }
  
  fs.writeFileSync(filePath, content.trim() + '\n');
  log(`✅ Atualizado: ${filePath}`, 'green');
}

// Sincronizar configurações
async function syncConfigurations() {
  log('\n🔄 SINCRONIZANDO CONFIGURAÇÕES...', 'bright');
  
  // 1. Encontrar melhor conexão de banco
  const databaseUrl = await findBestDatabaseConnection();
  
  // 2. Atualizar Backend .env
  updateEnvFile(CONFIG.backend.envFile, {
    DATABASE_URL: databaseUrl,
    PORT: CONFIG.backend.port,
    NODE_ENV: 'development',
    JWT_SECRET: 'your-super-secret-jwt-key-here-change-in-production',
    JWT_EXPIRES_IN: '7d',
    SUPABASE_URL: 'https://vffxtvuqhlhcbbyqmynz.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.Ys6Pu7uxCLVOKdOJKHKJJQFCJQ9rnQJJQFCJQ9rnQJ'
  });
  
  // 3. Atualizar Frontend .env
  updateEnvFile(CONFIG.frontend.envFile, {
    VITE_API_URL: `http://localhost:${CONFIG.backend.port}/api/v1`,
    VITE_BACKEND_URL: `http://localhost:${CONFIG.backend.port}`,
    VITE_SUPABASE_URL: 'https://vffxtvuqhlhcbbyqmynz.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI'
  });
  
  // 4. Criar arquivo de configuração compartilhada
  const sharedConfig = {
    backend: {
      port: CONFIG.backend.port,
      url: `http://localhost:${CONFIG.backend.port}`
    },
    frontend: {
      port: CONFIG.frontend.port,
      url: `http://localhost:${CONFIG.frontend.port}`
    },
    api: {
      url: `http://localhost:${CONFIG.backend.port}/api/v1`
    },
    database: {
      url: databaseUrl
    }
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'config.shared.json'),
    JSON.stringify(sharedConfig, null, 2)
  );
  
  log('✅ Configurações sincronizadas!', 'green');
  return sharedConfig;
}

// Verificar e limpar portas
async function checkAndCleanPorts() {
  log('\n🔍 Verificando portas...', 'cyan');
  
  // Verificar backend
  const backendAvailable = await isPortAvailable(CONFIG.backend.port);
  if (!backendAvailable) {
    log(`⚠️ Porta ${CONFIG.backend.port} ocupada, liberando...`, 'yellow');
    await killPort(CONFIG.backend.port);
  }
  
  // Verificar frontend
  const frontendAvailable = await isPortAvailable(CONFIG.frontend.port);
  if (!frontendAvailable) {
    log(`⚠️ Porta ${CONFIG.frontend.port} ocupada, liberando...`, 'yellow');
    await killPort(CONFIG.frontend.port);
  }
  
  log('✅ Todas as portas estão disponíveis!', 'green');
}

// Iniciar serviço
function startService(name, config) {
  return new Promise((resolve, reject) => {
    log(`\n🚀 Iniciando ${name}...`, 'cyan');
    
    const child = spawn('npm', ['run', 'dev'], {
      cwd: config.dir,
      env: { ...process.env, PORT: config.port },
      shell: true
    });
    
    let started = false;
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      if (!started && (output.includes('running on port') || output.includes('ready') || output.includes('Server running') || output.includes('Local:') || output.includes('Network:'))) {
        started = true;
        log(`✅ ${name} iniciado na porta ${config.port}`, 'green');
        resolve(child);
      }
      if (process.env.DEBUG) {
        console.log(`[${name}]`, output);
      }
    });
    
    child.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('warning') && !error.includes('Duplicate')) {
        log(`❌ [${name} Error]: ${error}`, 'red');
      }
    });
    
    child.on('error', (error) => {
      log(`❌ Erro ao iniciar ${name}: ${error.message}`, 'red');
      reject(error);
    });
    
    // Timeout de 30 segundos
    setTimeout(() => {
      if (!started) {
        child.kill();
        reject(new Error(`${name} não iniciou em 30 segundos`));
      }
    }, 30000);
  });
}

// Health check
async function performHealthCheck() {
  const fetch = require('node-fetch');
  
  log('\n🏥 Realizando health check...', 'cyan');
  
  const checks = [
    { name: 'Backend', url: CONFIG.backend.healthCheck },
    { name: 'Frontend', url: CONFIG.frontend.healthCheck }
  ];
  
  for (const check of checks) {
    let attempts = 0;
    const maxAttempts = 5;
    let success = false;
    
    while (attempts < maxAttempts && !success) {
      attempts++;
      try {
        const response = await fetch(check.url, { timeout: 5000 });
        if (response.ok || response.status < 500) {
          log(`✅ ${check.name} está saudável (tentativa ${attempts})`, 'green');
          success = true;
        } else {
          log(`⚠️ ${check.name} respondeu com status ${response.status} (tentativa ${attempts})`, 'yellow');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        log(`⏳ ${check.name} não respondeu na tentativa ${attempts}/${maxAttempts}`, 'yellow');
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    if (!success) {
      log(`❌ ${check.name} falhou após ${maxAttempts} tentativas`, 'red');
      return false;
    }
  }
  
  return true;
}

// Função principal
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('🔄 AUTO-SYNC SYSTEM - INICIANDO SINCRONIZAÇÃO', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  try {
    // 1. Sincronizar configurações
    const config = await syncConfigurations();
    
    // 2. Verificar e limpar portas
    await checkAndCleanPorts();
    
    // 3. Iniciar Backend
    const backendProcess = await startService('Backend', CONFIG.backend);
    
    // Aguardar backend estabilizar (mais tempo)
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // 4. Iniciar Frontend
    const frontendProcess = await startService('Frontend', CONFIG.frontend);
    
    // Aguardar frontend estabilizar
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Realizar health check
    const healthy = await performHealthCheck();
    
    if (healthy) {
      log('\n' + '='.repeat(60), 'bright');
      log('✅ SISTEMA TOTALMENTE SINCRONIZADO E OPERACIONAL!', 'green');
      log('='.repeat(60), 'bright');
      log('\n📌 URLs do Sistema:', 'cyan');
      log(`   Frontend: ${config.frontend.url}`, 'blue');
      log(`   Backend:  ${config.backend.url}`, 'blue');
      log(`   API:      ${config.api.url}`, 'blue');
      log('\n💡 Dica: Use Ctrl+C para parar todos os serviços\n', 'yellow');
      
      // Manter processos rodando
      process.on('SIGINT', () => {
        log('\n⏹️ Parando todos os serviços...', 'yellow');
        backendProcess.kill();
        frontendProcess.kill();
        process.exit(0);
      });
      
    } else {
      throw new Error('Health check falhou');
    }
    
  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { syncConfigurations, findBestDatabaseConnection };