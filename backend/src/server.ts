import { createServer } from 'http';
import { createApp } from './app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { initializeSocket } from '@/config/socket';
import { ensureAdminUser } from '@/utils/ensureAdminUser';

async function startServer(): Promise<void> {
  try {
    // Garante que existe um usuário administrador
    await ensureAdminUser();
    
    // Cria a aplicação Express
    const app = createApp();
    
    // Cria servidor HTTP
    const httpServer = createServer(app);
    
    // Inicializa Socket.io
    initializeSocket(httpServer);

    // Inicia o servidor
    const server = httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on port ${env.PORT}`);
      logger.info(`📝 API documentation: http://localhost:${env.PORT}${env.API_PREFIX}/api-docs`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Aguarda requisições em andamento
      await new Promise((resolve) => setTimeout(resolve, 10000));
      
      process.exit(0);
    };

    // Listeners para sinais de término
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer(); 