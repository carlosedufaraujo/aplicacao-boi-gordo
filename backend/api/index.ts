/**
 * Vercel Serverless Function Handler
 * Este arquivo é o ponto de entrada para o Vercel
 */

import { createApp } from '../src/app';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Cria a aplicação Express
const app = createApp();

// Handler para Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura headers CORS para produção
  const allowedOrigins = [
    'https://b3xcompany.com',
    'https://aplicacao-boi-gordo.vercel.app',
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
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization,Accept');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Passa a requisição para o Express
  return new Promise((resolve, reject) => {
    app(req as any, res as any, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}