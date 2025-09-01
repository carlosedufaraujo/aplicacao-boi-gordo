import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAppStore } from '../../stores/useAppStore';

interface CostAllocationChartProps {
  selectedCostCenter: string;
}

const COLORS = ['#a6e60d', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const CostAllocationChart: React.FC<CostAllocationChartProps> = ({ selectedCostCenter }) => {
  const { costCenters, costAllocations, expenses, cattlePurchases } = useAppStore();

  const data = React.useMemo(() => {
    if (selectedCostCenter) {
      // Show allocation breakdown for selected cost center
      const allocations = costAllocations.filter(allocation => 
        allocation.costCenterId === selectedCostCenter || 
        (allocation.targetType === 'cost_center' && allocation.targetId === selectedCostCenter)
      );
      
      // Agrupar por categoria de despesa
      const expenseCategories = new Map<string, number>();

      allocations.forEach(allocation => {
        const expense = expenses.find(exp => exp.id === allocation.expenseId);
        if (expense) {
          const current = expenseCategories.get(expense.category) || 0;
          expenseCategories.set(expense.category, current + allocation.amount);
        }
      });

      return Array.from(expenseCategories.entries()).map(([category, amount]) => {
        // Converter categoria para nome legível
        let categoryName = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        // Mapeamento específico para categorias
        const categoryMap: Record<string, string> = {
          'animal_purchase': 'Compra de Animais',
          'commission': 'Comissão',
          'freight': 'Frete',
          'acquisition_other': 'Outros (Aquisição)',
          'feed': 'Alimentação',
          'health_costs': 'Custos Sanitários',
          'operational_costs': 'Custos Operacionais',
          'fattening_other': 'Outros (Engorda)',
          'general_admin': 'Administrativo Geral',
          'marketing': 'Marketing',
          'accounting': 'Contabilidade',
          'personnel': 'Pessoal',
          'office': 'Escritório',
          'services': 'Prestação de Serviço',
          'technology': 'Tecnologia',
          'admin_other': 'Outros (Administrativo)',
          'taxes': 'Impostos',
          'interest': 'Juros',
          'fees': 'Taxas & Emolumentos',
          'insurance': 'Seguros',
          'capital_cost': 'Custo de Capital',
          'financial_management': 'Gestão Financeira',
          'deaths': 'Mortes',
          'default': 'Inadimplência',
          'financial_other': 'Outros (Financeiro)'
        };
        
        if (categoryMap[category]) {
          categoryName = categoryMap[category];
        }
        
        return {
          name: categoryName,
          value: amount
        };
      });
    } else {
      // Show overall cost center distribution
      const costCenterTotals = new Map<string, number>();

      // Considerar alocações diretas para centros de custo
      costAllocations.filter(a => a.targetType === 'cost_center').forEach(allocation => {
        const costCenter = costCenters.find(cc => cc.id === allocation.targetId);
        if (costCenter) {
          const current = costCenterTotals.get(costCenter.name) || 0;
          costCenterTotals.set(costCenter.name, current + allocation.amount);
        }
      });

      // Considerar alocações para centros de custo
      costAllocations.forEach(allocation => {
        const costCenter = costCenters.find(cc => cc.id === allocation.costCenterId);
        if (costCenter) {
          const current = costCenterTotals.get(costCenter.name) || 0;
          costCenterTotals.set(costCenter.name, current + allocation.amount);
        }
      });

      return Array.from(costCenterTotals.entries()).map(([name, amount]) => ({
        name,
        value: amount
      }));
    }
  }, [selectedCostCenter, costCenters, costAllocations, expenses, cattlePurchases]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-neutral-200 rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-b3x-lime-600 font-bold">
            R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6">
        <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
          {selectedCostCenter ? 'Distribuição por Categoria' : 'Distribuição por Centro de Custo'}
        </h3>
        <div className="flex items-center justify-center h-64 text-neutral-500">
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p>Nenhuma alocação de custo encontrada</p>
          </div>
        </div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 p-6">
      <h3 className="text-lg font-semibold text-b3x-navy-900 mb-4">
        {selectedCostCenter ? 'Distribuição por Categoria' : 'Distribuição por Centro de Custo'}
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 text-center">
        <div className="text-lg font-bold text-b3x-navy-900">
          Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-neutral-600">
          {data.length} {selectedCostCenter ? 'categorias' : 'centros de custo'}
        </div>
      </div>
    </div>
  );
};