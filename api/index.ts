/**
 * Vercel Serverless Function Handler
 * Este arquivo é o ponto de entrada principal para todas as rotas da API
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Importações necessárias do backend
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import 'express-async-errors';

// Importação das rotas (simplificadas para Vercel)
import { createSimplifiedApp } from '../backend/src/app-vercel';
import { validateVercelEnv } from '../backend/src/config/env-vercel';

// Cache da aplicação para reutilização
let cachedApp: express.Application | null = null;

// Função para criar/obter a aplicação Express
function getApp(): express.Application {
  if (cachedApp) {
    return cachedApp;
  }

  // Valida variáveis de ambiente
  validateVercelEnv();

  // Cria aplicação simplificada para Vercel
  cachedApp = createSimplifiedApp();
  return cachedApp;
}

// Handler principal para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Configura headers CORS para produção
    const allowedOrigins = [
      'https://b3xcompany.com',
      'https://www.b3xcompany.com',
      'https://aplicacao-boi-gordo.vercel.app',
      'https://aplicacao-boi-gordo-git-main-carlos-eduardos-projects-7ba2d4db.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    const origin = req.headers.origin as string;

    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization,Accept,x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Obtém a aplicação Express
    const app = getApp();

    // Passa a requisição para o Express
    return new Promise((resolve, reject) => {
      app(req as any, res as any, (result: any) => {
        if (result instanceof Error) {
          console.error('Express error:', result);
          return reject(result);
        }
        return resolve(result);
      });
    });

  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}
