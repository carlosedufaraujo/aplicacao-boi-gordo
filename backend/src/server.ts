import { createApp } from './app';
import { initializeSupabase } from '@/config/supabase-client';
import { env } from '@/config/env';
import { logger } from '@/config/logger';

async function startServer(): Promise<void> {
  try {
    // Inicializa conexão com Supabase (comentado temporariamente para permitir início)
    // await initializeSupabase();

    // Cria a aplicação Express
    const app = createApp();

    // Inicia o servidor
    const server = app.listen(env.port, () => {
      logger.info(`🚀 Server running on port ${env.port}`);
      logger.info(`📝 API documentation: http://localhost:${env.port}${env.apiPrefix}`);
      logger.info(`🌍 Environment: ${env.nodeEnv}`);
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