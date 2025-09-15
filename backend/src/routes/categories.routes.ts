import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Listar todas as categorias
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, isActive } = req.query;
    
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    const categories = await prisma.category.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

// Buscar categoria por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cashFlows: true }
        }
      }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ error: 'Erro ao buscar categoria' });
  }
});

// Criar nova categoria
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, color, icon } = req.body;
    
    // Validação básica
    if (!name || !type) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }
    
    if (!['INCOME', 'EXPENSE'].includes(type)) {
      return res.status(400).json({ error: 'Tipo inválido. Use INCOME ou EXPENSE' });
    }
    
    // Verifica se já existe categoria com mesmo nome
    const existing = await prisma.category.findUnique({
      where: { name }
    });
    
    if (existing) {
      return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
    }
    
    const category = await prisma.category.create({
      data: {
        name,
        type,
        color,
        icon,
        isDefault: false
      }
    });
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Atualizar categoria
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color, icon, isActive } = req.body;
    
    // Verifica se a categoria existe
    const existing = await prisma.category.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Removida restrição de categorias padrão - todas podem ser editadas
    
    // Verifica duplicação de nome
    if (name && name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name }
      });
      
      if (duplicate) {
        return res.status(400).json({ error: 'Já existe uma categoria com este nome' });
      }
    }
    
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(icon && { icon }),
        ...(isActive !== undefined && { isActive })
      }
    });
    
    res.json(category);
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

// Deletar categoria
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verifica se a categoria existe
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cashFlows: true }
        }
      }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }
    
    // Removida restrição de categorias padrão - todas podem ser deletadas se não estiverem em uso
    
    // Não permite deletar categorias em uso
    if ((existing as any)._count.cashFlows > 0) {
      return res.status(400).json({ 
        error: `Esta categoria está sendo usada em ${(existing as any)._count.cashFlows} movimentações` 
      });
    }
    
    await prisma.category.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

// Estatísticas das categorias
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const stats = await prisma.cashFlow.groupBy({
      by: ['categoryId', 'type'],
      _sum: {
        amount: true
      },
      _count: true
    });
    
    // Busca informações das categorias
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.id, c]));
    
    const result = stats.map(stat => ({
      category: categoryMap.get(stat.categoryId),
      type: stat.type,
      totalAmount: stat._sum.amount || 0,
      count: stat._count
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

export default router;