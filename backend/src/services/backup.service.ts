import { prisma } from '@/config/database';
import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import cron from 'node-cron';
import notificationService from './notification.service';

interface BackupConfig {
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  retention: number; // dias para manter backups
  location: 'local' | 'cloud' | 'both';
  compress: boolean;
  encrypt: boolean;
  includeMedia: boolean;
}

class BackupService {
  private backupPath: string = path.join(process.cwd(), 'backups');
  private backupJobs: Map<string, cron.ScheduledTask> = new Map();
  private isBackupInProgress: boolean = false;

  async initialize(config?: BackupConfig) {
    // Criar diretório de backups se não existir
    await this.ensureBackupDirectory();

    // Configurar backup automático
    const defaultConfig: BackupConfig = {
      frequency: 'daily',
      retention: 30,
      location: 'local',
      compress: true,
      encrypt: false,
      includeMedia: false,
      ...config
    };

    this.scheduleAutomaticBackup(defaultConfig);

    console.log('✅ Backup service initialized');
  }

  /**
   * Criar backup completo do banco de dados
   */
  async createFullBackup(): Promise<string> {
    if (this.isBackupInProgress) {
      throw new Error('Backup já em andamento');
    }

    this.isBackupInProgress = true;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-full-${timestamp}`;

    try {
      console.log('🔄 Iniciando backup completo...');

      // Coletar todos os dados
      const data = await this.collectAllData();

      // Salvar como JSON
      const jsonPath = path.join(this.backupPath, `${backupName}.json`);
      await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));

      // Comprimir se configurado
      const finalPath = await this.compressBackup(jsonPath, backupName);

      // Gerar relatório
      const report = await this.generateBackupReport(data, finalPath);

      // Notificar sucesso
      await notificationService.broadcast({
        title: '✅ Backup Concluído',
        message: `Backup completo realizado: ${backupName}`,
        type: 'success',
        priority: 'low'
      });

      // Limpar backups antigos
      await this.cleanOldBackups();

      console.log('✅ Backup completo finalizado:', finalPath);
      return finalPath;
    } catch (error) {
      console.error('❌ Erro no backup:', error);

      await notificationService.broadcast({
        title: '❌ Erro no Backup',
        message: 'Falha ao realizar backup automático',
        type: 'error',
        priority: 'high'
      });

      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Criar backup incremental (apenas mudanças)
   */
  async createIncrementalBackup(since?: Date): Promise<string> {
    const lastBackup = since || (await this.getLastBackupDate());
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-incremental-${timestamp}`;

    try {
      console.log('🔄 Iniciando backup incremental...');

      // Coletar apenas dados modificados
      const data = await this.collectModifiedData(lastBackup);

      // Salvar
      const jsonPath = path.join(this.backupPath, `${backupName}.json`);
      await fs.writeFile(jsonPath, JSON.stringify({
        type: 'incremental',
        since: lastBackup,
        timestamp: new Date(),
        data
      }, null, 2));

      console.log('✅ Backup incremental finalizado:', jsonPath);
      return jsonPath;
    } catch (error) {
      console.error('❌ Erro no backup incremental:', error);
      throw error;
    }
  }

  /**
   * Restaurar backup
   */
  async restoreBackup(backupPath: string, options?: {
    tables?: string[];
    dryRun?: boolean;
    force?: boolean;
  }): Promise<void> {
    console.log('🔄 Iniciando restauração do backup:', backupPath);

    try {
      // Ler arquivo de backup
      const backupContent = await fs.readFile(backupPath, 'utf-8');
      const data = JSON.parse(backupContent);

      if (options?.dryRun) {
        console.log('🔍 Modo dry-run - nenhuma alteração será feita');
        console.log('Dados a serem restaurados:', Object.keys(data).map(table => ({
          table,
          records: data[table]?.length || 0
        })));
        return;
      }

      // Criar backup de segurança antes de restaurar
      if (!options?.force) {
        console.log('📸 Criando backup de segurança antes da restauração...');
        await this.createFullBackup();
      }

      // Restaurar dados
      await prisma.$transaction(async (tx) => {
        for (const [table, records] of Object.entries(data)) {
          if (options?.tables && !options.tables.includes(table)) {
            continue;
          }

          console.log(`Restaurando ${table}: ${(records as any[]).length} registros`);

          // Limpar tabela existente (cuidado!)
          if (options?.force) {
            await (tx as any)[table].deleteMany({});
          }

          // Inserir dados do backup
          if (Array.isArray(records) && records.length > 0) {
            await (tx as any)[table].createMany({
              data: records,
              skipDuplicates: !options?.force
            });
          }
        }
      });

      console.log('✅ Restauração concluída com sucesso');

      await notificationService.broadcast({
        title: '✅ Restauração Concluída',
        message: 'Backup restaurado com sucesso',
        type: 'success',
        priority: 'high'
      });
    } catch (error) {
      console.error('❌ Erro na restauração:', error);
      throw error;
    }
  }

  /**
   * Coletar todos os dados do banco
   */
  private async collectAllData() {
    const tables = [
      'user',
      'partner',
      'payerAccount',
      'cattlePurchase',
      'saleRecord',
      'expense',
      'revenue',
      'cashFlow',
      'financialTransaction',
      'deathRecord',
      'pen',
      'category',
      'calendarEvent',
      'notification',
      'auditLog'
    ];

    const data: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        data[table] = await (prisma as any)[table].findMany();
        console.log(`✅ ${table}: ${data[table].length} registros`);
      } catch (error) {
        console.error(`❌ Erro ao coletar ${table}:`, error);
        data[table] = [];
      }
    }

    return data;
  }

  /**
   * Coletar apenas dados modificados
   */
  private async collectModifiedData(since: Date) {
    const tables = ['cattlePurchase', 'saleRecord', 'expense', 'revenue', 'cashFlow'];
    const data: Record<string, any[]> = {};

    for (const table of tables) {
      try {
        data[table] = await (prisma as any)[table].findMany({
          where: {
            OR: [
              { createdAt: { gte: since } },
              { updatedAt: { gte: since } }
            ]
          }
        });
      } catch (error) {
        console.error(`Erro ao coletar ${table}:`, error);
        data[table] = [];
      }
    }

    return data;
  }

  /**
   * Comprimir backup
   */
  private async compressBackup(filePath: string, backupName: string): Promise<string> {
    const output = createWriteStream(`${filePath}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        // Remover arquivo não comprimido
        fs.unlink(filePath).catch(console.error);
        resolve(`${filePath}.zip`);
      });

      archive.on('error', reject);
      archive.pipe(output);
      archive.file(filePath, { name: `${backupName}.json` });
      archive.finalize();
    });
  }

  /**
   * Agendar backup automático
   */
  private scheduleAutomaticBackup(config: BackupConfig) {
    const schedules: Record<string, string> = {
      hourly: '0 * * * *',      // Todo hora
      daily: '0 2 * * *',        // 2:00 AM todos os dias
      weekly: '0 2 * * 0',       // 2:00 AM aos domingos
      monthly: '0 2 1 * *'       // 2:00 AM no dia 1 de cada mês
    };

    const schedule = schedules[config.frequency];
    if (!schedule) return;

    // Cancelar job anterior se existir
    const existingJob = this.backupJobs.get('automatic');
    if (existingJob) {
      existingJob.stop();
    }

    // Criar novo job
    const job = cron.schedule(schedule, async () => {
      console.log(`⏰ Executando backup automático ${config.frequency}...`);
      try {
        await this.createFullBackup();
      } catch (error) {
        console.error('Erro no backup automático:', error);
      }
    });

    this.backupJobs.set('automatic', job);
    job.start();

    console.log(`📅 Backup automático agendado: ${config.frequency}`);
  }

  /**
   * Limpar backups antigos
   */
  private async cleanOldBackups(retentionDays: number = 30) {
    const files = await fs.readdir(this.backupPath);
    const now = Date.now();
    const maxAge = retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(this.backupPath, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filePath);
        console.log(`🗑️ Backup antigo removido: ${file}`);
      }
    }
  }

  /**
   * Garantir que o diretório de backup existe
   */
  private async ensureBackupDirectory() {
    try {
      await fs.access(this.backupPath);
    } catch {
      await fs.mkdir(this.backupPath, { recursive: true });
    }
  }

  /**
   * Obter data do último backup
   */
  private async getLastBackupDate(): Promise<Date> {
    const files = await fs.readdir(this.backupPath);
    let lastDate = new Date(0);

    for (const file of files) {
      const stats = await fs.stat(path.join(this.backupPath, file));
      if (stats.mtime > lastDate) {
        lastDate = stats.mtime;
      }
    }

    return lastDate;
  }

  /**
   * Gerar relatório do backup
   */
  private async generateBackupReport(data: any, backupPath: string) {
    const stats = await fs.stat(backupPath);

    const report = {
      timestamp: new Date(),
      path: backupPath,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      tables: Object.keys(data).map(table => ({
        name: table,
        records: data[table]?.length || 0
      })),
      totalRecords: Object.values(data).reduce((sum: number, records: any) =>
        sum + (Array.isArray(records) ? records.length : 0), 0)
    };

    // Salvar relatório
    const reportPath = backupPath.replace(/\.(json|zip)$/, '-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Listar backups disponíveis
   */
  async listBackups(): Promise<Array<{
    name: string;
    path: string;
    size: string;
    date: Date;
    type: 'full' | 'incremental';
  }>> {
    const files = await fs.readdir(this.backupPath);
    const backups = [];

    for (const file of files) {
      if (!file.includes('backup-') || file.includes('-report')) continue;

      const filePath = path.join(this.backupPath, file);
      const stats = await fs.stat(filePath);

      backups.push({
        name: file,
        path: filePath,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        date: stats.mtime,
        type: file.includes('incremental') ? 'incremental' as const : 'full' as const
      });
    }

    return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

export const backupService = new BackupService();
export default backupService;