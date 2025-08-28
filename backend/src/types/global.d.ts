// Tipos globais para o sistema
declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      file?: any;
      files?: any;
    }
  }
}

export {};
