// Sistema de Backup Automático
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.maxBackups = 30; // Manter últimos 30 backups
    
    // Criar diretório de backups se não existir
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // Gerar nome do arquivo de backup
  generateBackupName() {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `backup_${timestamp}.sql`;
  }

  // Fazer backup do banco de dados
  async createBackup() {
    const backupFile = path.join(this.backupDir, this.generateBackupName());
    
    // Pegar URL do banco do .env
    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada');
    }

    console.log('🔄 Iniciando backup do banco de dados...');
    
    try {
      // Comando pg_dump para PostgreSQL
      const command = `pg_dump "${databaseUrl}" > "${backupFile}"`;
      
      await execAsync(command);
      
      // Verificar tamanho do arquivo
      const stats = fs.statSync(backupFile);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`✅ Backup criado com sucesso!`);
      console.log(`📁 Arquivo: ${path.basename(backupFile)}`);
      console.log(`📊 Tamanho: ${fileSizeInMB} MB`);
      
      // Limpar backups antigos
      await this.cleanOldBackups();
      
      return {
        success: true,
        file: backupFile,
        size: fileSizeInMB,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Erro ao criar backup:', error.message);
      
      // Remover arquivo parcial se existir
      if (fs.existsSync(backupFile)) {
        fs.unlinkSync(backupFile);
      }
      
      throw error;
    }
  }

  // Restaurar backup
  async restoreBackup(backupFile) {
    if (!fs.existsSync(backupFile)) {
      throw new Error('Arquivo de backup não encontrado');
    }

    require('dotenv').config();
    const databaseUrl = process.env.DATABASE_URL;
    
    console.log('🔄 Restaurando backup...');
    
    try {
      // Comando psql para PostgreSQL
      const command = `psql "${databaseUrl}" < "${backupFile}"`;
      
      await execAsync(command);
      
      console.log('✅ Backup restaurado com sucesso!');
      
      return {
        success: true,
        restoredFile: backupFile,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Erro ao restaurar backup:', error.message);
      throw error;
    }
  }

  // Limpar backups antigos
  async cleanOldBackups() {
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => ({
        name: file,
        path: path.join(this.backupDir, file),
        time: fs.statSync(path.join(this.backupDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time); // Mais recentes primeiro

    // Remover backups excedentes
    if (files.length > this.maxBackups) {
      const filesToDelete = files.slice(this.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Backup antigo removido: ${file.name}`);
      }
    }
  }

  // Listar backups disponíveis
  listBackups() {
    const files = fs.readdirSync(this.backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
      .map(file => {
        const stats = fs.statSync(path.join(this.backupDir, file));
        return {
          name: file,
          path: path.join(this.backupDir, file),
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    return files;
  }

  // Agendar backup automático
  scheduleAutoBackup(intervalHours = 24) {
    console.log(`⏰ Backup automático agendado a cada ${intervalHours} horas`);
    
    // Fazer backup inicial
    this.createBackup().catch(console.error);
    
    // Agendar próximos backups
    setInterval(() => {
      console.log('\n⏰ Executando backup automático agendado...');
      this.createBackup().catch(console.error);
    }, intervalHours * 60 * 60 * 1000);
  }
}

// Exportar para uso em outros módulos
module.exports = BackupSystem;

// Se executado diretamente, fazer backup manual
if (require.main === module) {
  const backup = new BackupSystem();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      backup.createBackup()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'restore':
      const file = args[1];
      if (!file) {
        console.error('❌ Especifique o arquivo de backup para restaurar');
        process.exit(1);
      }
      backup.restoreBackup(file)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'list':
      const backups = backup.listBackups();
      console.log('\n📋 BACKUPS DISPONÍVEIS:');
      console.log('=' .repeat(60));
      backups.forEach((b, i) => {
        console.log(`${i + 1}. ${b.name}`);
        console.log(`   Tamanho: ${b.size} | Criado: ${b.created.toLocaleString('pt-BR')}`);
      });
      break;
      
    case 'auto':
      const hours = parseInt(args[1]) || 24;
      backup.scheduleAutoBackup(hours);
      console.log('Pressione Ctrl+C para parar o backup automático');
      break;
      
    default:
      console.log(`
📦 SISTEMA DE BACKUP - CEAC Agropecuária

Uso:
  node backup-system.js create              - Criar backup manual
  node backup-system.js restore <arquivo>   - Restaurar backup
  node backup-system.js list                - Listar backups disponíveis
  node backup-system.js auto [horas]        - Iniciar backup automático (padrão: 24h)

Exemplos:
  node backup-system.js create
  node backup-system.js restore backups/backup_2024-01-20T10-30-00.sql
  node backup-system.js auto 6              - Backup a cada 6 horas
      `);
  }
}