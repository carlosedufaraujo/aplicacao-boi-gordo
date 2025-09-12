import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Função auxiliar para calcular ocupação do curral
async function calculatePenOccupancy(penId: string): Promise<number> {
  const allocations = await prisma.lotPenLink.findMany({
    where: {
      penId,
      status: 'ACTIVE'
    }
  });
  return allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
}

// GET /api/v1/pen-allocations - Listar todas as alocações
router.get('/', async (req, res) => {
  try {
    const allocations = await prisma.lotPenLink.findMany({
      include: {
        pen: true,
        purchase: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar para o formato esperado pelo frontend
    const formattedAllocations = allocations.map(alloc => ({
      id: alloc.id,
      penId: alloc.penId,
      lotId: alloc.purchaseId,
      quantity: alloc.quantity,
      entryDate: alloc.allocationDate,
      exitDate: alloc.removalDate,
      status: alloc.status,
      createdAt: alloc.createdAt,
      updatedAt: alloc.updatedAt,
      pen: alloc.pen,
      cattlePurchase: alloc.purchase
    }));

    res.json(formattedAllocations);
  } catch (error) {
    console.error('Erro ao buscar alocações:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar alocações',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/v1/pen-allocations/:id - Buscar alocação específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const allocation = await prisma.lotPenLink.findUnique({
      where: { id },
      include: {
        pen: true,
        purchase: true
      }
    });

    if (!allocation) {
      return res.status(404).json({ message: 'Alocação não encontrada' });
    }

    // Transformar para o formato esperado pelo frontend
    const formattedAllocation = {
      id: allocation.id,
      penId: allocation.penId,
      lotId: allocation.purchaseId,
      quantity: allocation.quantity,
      entryDate: allocation.allocationDate,
      exitDate: allocation.removalDate,
      status: allocation.status,
      createdAt: allocation.createdAt,
      updatedAt: allocation.updatedAt,
      pen: allocation.pen,
      cattlePurchase: allocation.purchase
    };

    res.json(formattedAllocation);
  } catch (error) {
    console.error('Erro ao buscar alocação:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar alocação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// POST /api/v1/pen-allocations - Criar nova alocação
router.post('/', async (req, res) => {
  try {
    const { penId, lotId, quantity, entryDate } = req.body;

    // Validar dados obrigatórios
    if (!penId || !lotId || !quantity) {
      return res.status(400).json({ 
        message: 'Dados obrigatórios faltando: penId, lotId e quantity são necessários' 
      });
    }

    // Verificar se o curral existe
    const pen = await prisma.pen.findUnique({
      where: { id: penId }
    });

    if (!pen) {
      return res.status(404).json({ message: 'Curral não encontrado' });
    }

    // Verificar se o lote existe
    const lot = await prisma.cattlePurchase.findUnique({
      where: { id: lotId }
    });

    if (!lot) {
      return res.status(404).json({ message: 'Lote não encontrado' });
    }

    // Calcular ocupação atual do curral
    const currentOccupancy = await calculatePenOccupancy(penId);
    const newOccupancy = currentOccupancy + quantity;

    // Verificar se não excede a capacidade
    if (newOccupancy > pen.capacity) {
      return res.status(400).json({ 
        message: `Capacidade do curral será excedida. Capacidade: ${pen.capacity}, Ocupação atual: ${currentOccupancy}, Tentando adicionar: ${quantity}` 
      });
    }

    // Verificar animais disponíveis no lote
    const lotAllocations = await prisma.lotPenLink.findMany({
      where: {
        purchaseId: lotId,
        status: 'ACTIVE'
      }
    });

    const totalAllocated = lotAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
    const availableInLot = lot.currentQuantity - totalAllocated;

    if (quantity > availableInLot) {
      return res.status(400).json({ 
        message: `Quantidade excede o disponível no lote. Disponível: ${availableInLot}, Tentando alocar: ${quantity}` 
      });
    }

    // Calcular porcentagens
    const percentageOfLot = (quantity / lot.currentQuantity) * 100;
    const percentageOfPen = (quantity / pen.capacity) * 100;

    // Criar a alocação
    const allocation = await prisma.lotPenLink.create({
      data: {
        penId,
        purchaseId: lotId,
        quantity,
        percentageOfLot,
        percentageOfPen,
        allocationDate: entryDate ? new Date(entryDate) : new Date(),
        status: 'ACTIVE'
      },
      include: {
        pen: true,
        purchase: true
      }
    });

    // Atualizar status do curral
    await prisma.pen.update({
      where: { id: penId },
      data: {
        status: newOccupancy > 0 ? 'OCCUPIED' : 'AVAILABLE'
      }
    });

    // Atualizar status do lote se necessário
    if (lot.status === 'CONFIRMED') {
      await prisma.cattlePurchase.update({
        where: { id: lotId },
        data: {
          status: 'CONFINED'
        }
      });
    }

    // Adicionar ocupação atual calculada ao pen para resposta
    const penWithOccupancy = {
      ...allocation.pen,
      currentOccupancy: newOccupancy
    };

    // Transformar para o formato esperado pelo frontend
    const formattedAllocation = {
      id: allocation.id,
      penId: allocation.penId,
      lotId: allocation.purchaseId,
      quantity: allocation.quantity,
      entryDate: allocation.allocationDate,
      exitDate: allocation.removalDate,
      status: allocation.status,
      createdAt: allocation.createdAt,
      updatedAt: allocation.updatedAt,
      pen: penWithOccupancy,
      cattlePurchase: allocation.purchase
    };

    res.status(201).json(formattedAllocation);
  } catch (error) {
    console.error('Erro ao criar alocação:', error);
    res.status(500).json({ 
      message: 'Erro ao criar alocação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// PUT /api/v1/pen-allocations/:id - Atualizar alocação
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, exitDate, status } = req.body;

    const existingAllocation = await prisma.lotPenLink.findUnique({
      where: { id },
      include: {
        pen: true,
        purchase: true
      }
    });

    if (!existingAllocation) {
      return res.status(404).json({ message: 'Alocação não encontrada' });
    }

    // Se estiver alterando a quantidade, verificar capacidades
    if (quantity && quantity !== existingAllocation.quantity) {
      const difference = quantity - existingAllocation.quantity;
      
      if (difference > 0) {
        // Verificar capacidade do curral
        const currentOccupancy = await calculatePenOccupancy(existingAllocation.penId);
        const newOccupancy = currentOccupancy - existingAllocation.quantity + quantity;

        if (newOccupancy > existingAllocation.pen.capacity) {
          return res.status(400).json({ 
            message: `Capacidade do curral será excedida. Capacidade: ${existingAllocation.pen.capacity}, Nova ocupação seria: ${newOccupancy}` 
          });
        }
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    if (quantity) {
      updateData.quantity = quantity;
      if (existingAllocation.purchase) {
        updateData.percentageOfLot = (quantity / existingAllocation.purchase.currentQuantity) * 100;
        updateData.percentageOfPen = (quantity / existingAllocation.pen.capacity) * 100;
      }
    }
    if (exitDate) {
      updateData.removalDate = new Date(exitDate);
    }
    if (status) {
      updateData.status = status;
    }

    // Atualizar a alocação
    const updatedAllocation = await prisma.lotPenLink.update({
      where: { id },
      data: updateData,
      include: {
        pen: true,
        purchase: true
      }
    });

    // Recalcular ocupação do curral e atualizar status
    const totalOccupancy = await calculatePenOccupancy(existingAllocation.penId);
    
    await prisma.pen.update({
      where: { id: existingAllocation.penId },
      data: {
        status: totalOccupancy > 0 ? 'OCCUPIED' : 'AVAILABLE'
      }
    });

    // Adicionar ocupação atual ao pen para resposta
    const penWithOccupancy = {
      ...updatedAllocation.pen,
      currentOccupancy: totalOccupancy
    };

    // Transformar para o formato esperado pelo frontend
    const formattedAllocation = {
      id: updatedAllocation.id,
      penId: updatedAllocation.penId,
      lotId: updatedAllocation.purchaseId,
      quantity: updatedAllocation.quantity,
      entryDate: updatedAllocation.allocationDate,
      exitDate: updatedAllocation.removalDate,
      status: updatedAllocation.status,
      createdAt: updatedAllocation.createdAt,
      updatedAt: updatedAllocation.updatedAt,
      pen: penWithOccupancy,
      cattlePurchase: updatedAllocation.purchase
    };

    res.json(formattedAllocation);
  } catch (error) {
    console.error('Erro ao atualizar alocação:', error);
    res.status(500).json({ 
      message: 'Erro ao atualizar alocação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// DELETE /api/v1/pen-allocations/:id - Remover alocação
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const allocation = await prisma.lotPenLink.findUnique({
      where: { id },
      include: {
        pen: true
      }
    });

    if (!allocation) {
      return res.status(404).json({ message: 'Alocação não encontrada' });
    }

    // Marcar como removida em vez de deletar (soft delete)
    await prisma.lotPenLink.update({
      where: { id },
      data: {
        status: 'REMOVED',
        removalDate: new Date()
      }
    });

    // Recalcular ocupação do curral
    const totalOccupancy = await calculatePenOccupancy(allocation.penId);

    await prisma.pen.update({
      where: { id: allocation.penId },
      data: {
        status: totalOccupancy > 0 ? 'OCCUPIED' : 'AVAILABLE'
      }
    });

    res.json({ message: 'Alocação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover alocação:', error);
    res.status(500).json({ 
      message: 'Erro ao remover alocação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// GET /api/v1/pen-allocations/pen/:penId/occupancy - Obter ocupação do curral
router.get('/pen/:penId/occupancy', async (req, res) => {
  try {
    const { penId } = req.params;
    
    const pen = await prisma.pen.findUnique({
      where: { id: penId }
    });
    
    if (!pen) {
      return res.status(404).json({ message: 'Curral não encontrado' });
    }
    
    const currentOccupancy = await calculatePenOccupancy(penId);
    
    res.json({
      penId,
      penNumber: pen.penNumber,
      capacity: pen.capacity,
      currentOccupancy,
      availableSpace: pen.capacity - currentOccupancy,
      occupancyRate: (currentOccupancy / pen.capacity) * 100,
      status: pen.status
    });
  } catch (error) {
    console.error('Erro ao buscar ocupação:', error);
    res.status(500).json({ 
      message: 'Erro ao buscar ocupação',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

export default router;