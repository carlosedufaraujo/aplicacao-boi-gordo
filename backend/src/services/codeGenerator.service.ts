import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CodeGeneratorService {
  /**
   * Gera código interno único no formato X2501001
   * X + ano(25) + mês(01) + sequencial(001)
   */
  static async generateInternalCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear() % 100; // Pega os últimos 2 dígitos do ano
    const month = now.getMonth() + 1; // Mês (1-12)
    
    // Formata ano e mês com zero à esquerda
    const yearStr = year.toString().padStart(2, '0');
    const monthStr = month.toString().padStart(2, '0');
    
    // Busca ou cria a sequência para o ano/mês atual
    const sequence = await this.getNextSequence(now.getFullYear(), month);
    
    // Formata o código: X + ano(2 dígitos) + mês(2 dígitos) + sequencial(3 dígitos)
    const code = `X${yearStr}${monthStr}${sequence.toString().padStart(3, '0')}`;
    
    return code;
  }
  
  /**
   * Obtém o próximo número de sequência para o ano/mês
   */
  private static async getNextSequence(year: number, month: number): Promise<number> {
    try {
      // Tenta buscar a sequência existente
      const existingSequence = await prisma.$queryRaw<any[]>`
        SELECT * FROM code_sequences 
        WHERE year = ${year} AND month = ${month}
        FOR UPDATE
      `;
      
      if (existingSequence && existingSequence.length > 0) {
        // Atualiza a sequência existente
        const newSequence = existingSequence[0].last_sequence + 1;
        
        await prisma.$executeRaw`
          UPDATE code_sequences 
          SET last_sequence = ${newSequence}, updated_at = NOW()
          WHERE year = ${year} AND month = ${month}
        `;
        
        return newSequence;
      } else {
        // Cria nova sequência
        await prisma.$executeRaw`
          INSERT INTO code_sequences (id, year, month, last_sequence, created_at, updated_at)
          VALUES (gen_random_uuid(), ${year}, ${month}, 1, NOW(), NOW())
          ON CONFLICT (year, month) DO UPDATE 
          SET last_sequence = code_sequences.last_sequence + 1, updated_at = NOW()
        `;
        
        return 1;
      }
    } catch (error) {
      console.error('Erro ao gerar sequência:', error);
      
      // Fallback: usa timestamp se houver erro
      const timestamp = Date.now().toString().slice(-6);
      return parseInt(timestamp);
    }
  }
  
  /**
   * Gera código de lote no formato LOT-YYMMDD-XXX
   */
  static async generateLotCode(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear() % 100;
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    
    // Conta quantos lotes foram criados hoje
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    const todayCount = await prisma.cattlePurchase.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    const sequence = (todayCount + 1).toString().padStart(3, '0');
    return `LOT-${year}${month}${day}-${sequence}`;
  }
  
  /**
   * Valida se um código interno já existe
   */
  static async isCodeUnique(code: string): Promise<boolean> {
    const existing = await prisma.cattlePurchase.findUnique({
      where: { lotCode: code }
    });
    return !existing;
  }
  
  /**
   * Gera um código único, verificando duplicatas
   */
  static async generateUniqueInternalCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = await this.generateInternalCode();
      
      if (await this.isCodeUnique(code)) {
        return code;
      }
      
      attempts++;
    }
    
    // Se não conseguir gerar um código único após várias tentativas,
    // adiciona um sufixo aleatório
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${await this.generateInternalCode()}-${randomSuffix}`;
  }
}