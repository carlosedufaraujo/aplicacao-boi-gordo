import { Request, Response, NextFunction } from 'express';
import { mapPartnerType } from '../utils/partnerTypeMapper';

/**
 * Middleware para mapear automaticamente tipos de parceiros
 * Resolve problema TC006 - aceita valores em português e converte para inglês
 */
export function partnerTypeMapperMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.body && req.body.type) {
    const originalType = req.body.type;
    const mappedType = mapPartnerType(originalType);
    
    // Log para debug
    if (originalType !== mappedType) {
      console.log(`🔄 Partner type mapped: "${originalType}" -> "${mappedType}"`);
    }
    
    req.body.type = mappedType;
  }
  
  next();
}
