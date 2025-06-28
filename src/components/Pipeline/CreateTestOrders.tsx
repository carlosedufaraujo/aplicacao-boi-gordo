import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { v4 as uuidv4 } from 'uuid';

export const CreateTestOrders: React.FC = () => {
  const { addPurchaseOrder, cycles, partners, generatePurchaseOrderCode, purchaseOrders } = useAppStore();
  const initialized = useRef(false);

  useEffect(() => {
    // Verificar se já existem ordens de compra ou se já inicializamos
    if (purchaseOrders.length > 0 || initialized.current) {
      return;
    }

    // Marcar como inicializado para evitar duplicação
    initialized.current = true;

    // Obter o ciclo ativo
    const activeCycle = cycles.find(c => c.status === 'active');
    if (!activeCycle) return;

    // Obter vendedores e corretores
    const vendors = partners.filter(p => p.type === 'vendor' && p.isActive);
    const brokers = partners.filter(p => p.type === 'broker' && p.isActive);

    if (vendors.length === 0) return;

    // Criar 3 ordens de compra distintas
    const createOrder = (index: number) => {
      const orderCode = generatePurchaseOrderCode();
      const vendor = vendors[index % vendors.length];
      const broker = brokers[index % brokers.length];
      
      const locations = [
        { city: 'Ribeirão Preto', state: 'SP' },
        { city: 'Uberaba', state: 'MG' },
        { city: 'Goiânia', state: 'GO' }
      ];
      
      const location = locations[index % locations.length];
      
      // Dados variados para cada ordem
      const quantities = [120, 150, 180];
      const weights = [45000, 60000, 72000];
      const prices = [290, 310, 330];
      
      addPurchaseOrder({
        id: uuidv4(),
        code: orderCode,
        cycleId: activeCycle.id,
        date: new Date(),
        vendorId: vendor.id,
        brokerId: broker?.id,
        city: location.city,
        state: location.state,
        quantity: quantities[index],
        animalType: index % 2 === 0 ? 'male' : 'female',
        estimatedAge: 24 + (index * 2),
        totalWeight: weights[index],
        pricePerArroba: prices[index],
        commission: 5000 + (index * 1000),
        commissionPaymentType: 'cash',
        taxes: 2000 + (index * 500),
        taxesPaymentType: 'cash',
        otherCosts: 1000 * (index + 1),
        otherCostsDescription: `Custos diversos: R$ ${1000 * (index + 1)}`,
        otherCostsPaymentType: 'cash',
        paymentType: 'cash',
        status: 'order',
        paymentValidated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    };

    // Criar 3 ordens
    for (let i = 0; i < 3; i++) {
      createOrder(i);
    }
  }, [addPurchaseOrder, cycles, partners, generatePurchaseOrderCode, purchaseOrders]);

  return null;
};