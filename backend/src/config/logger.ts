import winston from 'winston';
import path from 'path';
import { env } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato customizado para logs
const logFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let msg = `${timestamp} [${level}]: `;
  
  // Trata objetos de erro adequadamente
  if (typeof message === 'object') {
    if (message instanceof Error) {
      msg += `${message.message}`;
      if (message.stack && !stack) {
        stack = message.stack;
      }
    } else {
      msg += JSON.stringify(message, null, 2);
    }
  } else {
    msg += message;
  }
  
  if (stack) {
    msg += `\n${stack}`;
  }
  
  if (Object.keys(metadata).length > 0) {
    // Filtra propriedades vazias e serializa adequadamente
    const cleanMetadata = Object.fromEntries(
      Object.entries(metadata).filter(([_, value]) => value !== undefined && value !== null)
    );
    if (Object.keys(cleanMetadata).length > 0) {
      msg += ` ${JSON.stringify(cleanMetadata, null, 2)}`;
    }
  }
  
  return msg;
});

// Configuração para desenvolvimento
const developmentLogger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
    }),
  ],
});

// Configuração para produção
const productionLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Exporta o logger apropriado baseado no ambiente
export const logger = env.NODE_ENV === 'production' ? productionLogger : developmentLogger;

// Cria um logger child para requisições HTTP
export const httpLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/http.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
}); 