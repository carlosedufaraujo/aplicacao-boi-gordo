#!/usr/bin/env node

/**
 * 🔍 SYSTEM MONITOR - Monitoramento e Auto-Recuperação
 * 
 * Este script monitora continuamente o sistema e reinicia
 * automaticamente componentes que falharem.
 */

const http = require('http');
const https = require('https');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurações
const CONFIG = {
  checkInterval: 10000, // 10 segundos
  maxRetries: 3,
  retryDelay: 5000,
  services: {
    backend: {
      name: 'Backend',
      url: 'http://localhost:3001/api/v1/cattle-purchases',
      port: 3001,
      dir: path.join(__dirname, 'backend'),
      startCommand: 'npm run dev',
      process: null,
      retries: 0,
      lastCheck: null,
      status: 'unknown'
    },
    frontend: {
      name: 'Frontend',
      url: 'http://localhost:5173',
      port: 5173,
      dir: __dirname,
      startCommand: 'npm run dev',
      process: null,
      retries: 0,
      lastCheck: null,
      status: 'unknown'
    },
    database: {
      name: 'Database',
      checkFunction: checkDatabase,
      retries: 0,
      lastCheck: null,
      status: 'unknown'
    }
  },
  alerts: {
    enabled: true,
    webhookUrl: null, // Configure se quiser notificações
    emailTo: null
  }
};

// Estado do sistema
const systemState = {
  isMonitoring: false,
  startTime: new Date(),
  totalRestarts: 0,
  lastIncident: null,
  incidents: []
};

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset', showTime = true) {
  const timestamp = showTime ? `[${new Date().toLocaleTimeString()}] ` : '';
  console.log(`${colors[color]}${timestamp}${message}${colors.reset}`);
}

// Verificar se URL está acessível
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, { timeout: 5000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    }).on('error', () => {
      resolve(false);
    }).on('timeout', () => {
      resolve(false);
    });
  });
}

// Verificar banco de dados
async function checkDatabase() {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient({ log: ['error'] });
    
    await prisma.$connect();
    const count = await prisma.user.count();
    await prisma.$disconnect();
    
    return count >= 0;
  } catch (error) {
    return false;
  }
}

// Matar processo na porta
function killPort(port) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port} | findstr LISTENING | for /f "tokens=5" %a in ('more') do taskkill /PID %a /F`
      : `lsof -ti:${port} | xargs kill -9`;
    
    exec(command, { stdio: 'ignore' }, () => resolve());
  });
}

// Iniciar serviço
function startService(service) {
  return new Promise((resolve, reject) => {
    log(`🚀 Iniciando ${service.name}...`, 'cyan');
    
    // Matar processo antigo se existir
    if (service.process) {
      service.process.kill();
      service.process = null;
    }
    
    // Limpar porta se necessário
    if (service.port) {
      killPort(service.port).then(() => {
        const child = spawn('npm', ['run', 'dev'], {
          cwd: service.dir,
          env: { ...process.env, PORT: service.port },
          shell: true,
          detached: false
        });
        
        service.process = child;
        
        child.on('error', (error) => {
          log(`❌ Erro ao iniciar ${service.name}: ${error.message}`, 'red');
          reject(error);
        });
        
        // Aguardar inicialização
        setTimeout(() => {
          resolve(child);
        }, 5000);
      });
    } else {
      resolve();
    }
  });
}

// Verificar saúde do serviço
async function checkServiceHealth(service) {
  try {
    let isHealthy = false;
    
    if (service.url) {
      isHealthy = await checkUrl(service.url);
    } else if (service.checkFunction) {
      isHealthy = await service.checkFunction();
    }
    
    service.lastCheck = new Date();
    
    if (isHealthy) {
      service.status = 'healthy';
      service.retries = 0;
      return true;
    } else {
      service.status = 'unhealthy';
      return false;
    }
  } catch (error) {
    service.status = 'error';
    return false;
  }
}

// Recuperar serviço
async function recoverService(service) {
  if (service.retries >= CONFIG.maxRetries) {
    log(`⚠️ ${service.name} excedeu o máximo de tentativas (${CONFIG.maxRetries})`, 'red');
    recordIncident(service.name, 'Max retries exceeded');
    return false;
  }
  
  service.retries++;
  systemState.totalRestarts++;
  
  log(`🔧 Tentando recuperar ${service.name} (tentativa ${service.retries}/${CONFIG.maxRetries})...`, 'yellow');
  
  try {
    if (service.startCommand) {
      await startService(service);
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
      
      const isHealthy = await checkServiceHealth(service);
      if (isHealthy) {
        log(`✅ ${service.name} recuperado com sucesso!`, 'green');
        return true;
      }
    }
  } catch (error) {
    log(`❌ Falha ao recuperar ${service.name}: ${error.message}`, 'red');
  }
  
  return false;
}

// Registrar incidente
function recordIncident(serviceName, description) {
  const incident = {
    timestamp: new Date(),
    service: serviceName,
    description: description
  };
  
  systemState.incidents.push(incident);
  systemState.lastIncident = incident;
  
  // Manter apenas últimos 100 incidentes
  if (systemState.incidents.length > 100) {
    systemState.incidents.shift();
  }
  
  // Enviar alerta se configurado
  if (CONFIG.alerts.enabled && CONFIG.alerts.webhookUrl) {
    sendAlert(incident);
  }
}

// Enviar alerta (webhook)
function sendAlert(incident) {
  // Implementar envio de webhook se necessário
  log(`🚨 ALERTA: ${incident.service} - ${incident.description}`, 'magenta');
}

// Ciclo de monitoramento
async function monitoringCycle() {
  if (!systemState.isMonitoring) return;
  
  for (const [key, service] of Object.entries(CONFIG.services)) {
    const isHealthy = await checkServiceHealth(service);
    
    if (!isHealthy && service.status !== 'recovering') {
      log(`⚠️ ${service.name} não está respondendo!`, 'yellow');
      service.status = 'recovering';
      recordIncident(service.name, 'Service not responding');
      
      // Tentar recuperar
      const recovered = await recoverService(service);
      if (!recovered) {
        service.status = 'failed';
      }
    }
  }
  
  // Próximo ciclo
  setTimeout(monitoringCycle, CONFIG.checkInterval);
}

// Exibir dashboard
function showDashboard() {
  console.clear();
  log('=' .repeat(60), 'bright', false);
  log('🔍 SYSTEM MONITOR - DASHBOARD', 'bright', false);
  log('=' .repeat(60), 'bright', false);
  
  const uptime = Math.floor((new Date() - systemState.startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;
  
  log(`\n📊 Status Geral:`, 'cyan', false);
  log(`   Uptime: ${hours}h ${minutes}m ${seconds}s`, 'blue', false);
  log(`   Total de Restarts: ${systemState.totalRestarts}`, 'blue', false);
  log(`   Incidentes: ${systemState.incidents.length}`, 'blue', false);
  
  log(`\n🔧 Status dos Serviços:`, 'cyan', false);
  for (const [key, service] of Object.entries(CONFIG.services)) {
    const statusIcon = {
      healthy: '✅',
      unhealthy: '❌',
      recovering: '🔧',
      failed: '💀',
      unknown: '❓'
    }[service.status] || '❓';
    
    const statusColor = {
      healthy: 'green',
      unhealthy: 'red',
      recovering: 'yellow',
      failed: 'red',
      unknown: 'reset'
    }[service.status] || 'reset';
    
    log(`   ${statusIcon} ${service.name}: ${service.status}`, statusColor, false);
    if (service.lastCheck) {
      log(`      Última verificação: ${service.lastCheck.toLocaleTimeString()}`, 'reset', false);
    }
    if (service.retries > 0) {
      log(`      Tentativas de recuperação: ${service.retries}`, 'yellow', false);
    }
  }
  
  if (systemState.lastIncident) {
    log(`\n⚠️ Último Incidente:`, 'yellow', false);
    log(`   ${systemState.lastIncident.timestamp.toLocaleTimeString()} - ${systemState.lastIncident.service}`, 'reset', false);
    log(`   ${systemState.lastIncident.description}`, 'reset', false);
  }
  
  log('\n' + '=' .repeat(60), 'bright', false);
  log('Pressione Ctrl+C para parar o monitoramento\n', 'yellow', false);
}

// Iniciar monitoramento
async function startMonitoring() {
  log('\n🔍 INICIANDO SYSTEM MONITOR', 'bright');
  log('=' .repeat(60), 'bright');
  
  systemState.isMonitoring = true;
  systemState.startTime = new Date();
  
  // Verificação inicial
  log('Realizando verificação inicial...', 'cyan');
  for (const [key, service] of Object.entries(CONFIG.services)) {
    const isHealthy = await checkServiceHealth(service);
    log(`${service.name}: ${isHealthy ? '✅ OK' : '❌ FALHA'}`, isHealthy ? 'green' : 'red');
  }
  
  // Iniciar ciclo de monitoramento
  log('\n✅ Monitoramento iniciado!', 'green');
  log(`Verificando a cada ${CONFIG.checkInterval / 1000} segundos...`, 'blue');
  
  monitoringCycle();
  
  // Atualizar dashboard a cada 5 segundos
  setInterval(showDashboard, 5000);
  
  // Mostrar dashboard inicial
  setTimeout(showDashboard, 2000);
}

// Parar monitoramento
function stopMonitoring() {
  systemState.isMonitoring = false;
  
  log('\n⏹️ Parando monitoramento...', 'yellow');
  
  // Matar processos gerenciados
  for (const service of Object.values(CONFIG.services)) {
    if (service.process) {
      service.process.kill();
    }
  }
  
  // Salvar relatório
  const report = {
    startTime: systemState.startTime,
    endTime: new Date(),
    totalRestarts: systemState.totalRestarts,
    incidents: systemState.incidents
  };
  
  const reportPath = path.join(__dirname, `monitor-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`📄 Relatório salvo em: ${reportPath}`, 'green');
  log('👋 Monitor encerrado!', 'cyan');
  
  process.exit(0);
}

// Handlers de sinais
process.on('SIGINT', stopMonitoring);
process.on('SIGTERM', stopMonitoring);

// Modo de execução
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 SYSTEM MONITOR - Monitoramento e Auto-Recuperação

Uso:
  node system-monitor.js [opções]

Opções:
  --interval <ms>   Intervalo de verificação (padrão: 10000ms)
  --max-retries <n> Máximo de tentativas (padrão: 3)
  --dashboard       Mostrar apenas dashboard
  --help, -h        Mostrar esta ajuda

Exemplos:
  node system-monitor.js
  node system-monitor.js --interval 5000
  node system-monitor.js --max-retries 5
    `);
    process.exit(0);
  }
  
  // Processar argumentos
  const intervalIndex = args.indexOf('--interval');
  if (intervalIndex > -1 && args[intervalIndex + 1]) {
    CONFIG.checkInterval = parseInt(args[intervalIndex + 1]);
  }
  
  const retriesIndex = args.indexOf('--max-retries');
  if (retriesIndex > -1 && args[retriesIndex + 1]) {
    CONFIG.maxRetries = parseInt(args[retriesIndex + 1]);
  }
  
  // Iniciar monitoramento
  startMonitoring();
}

module.exports = { startMonitoring, stopMonitoring, checkServiceHealth };