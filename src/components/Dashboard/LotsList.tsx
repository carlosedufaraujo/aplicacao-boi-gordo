import React, { useState } from 'react';
import { Eye, Edit, Calculator, Trash2, DollarSign } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { format } from 'date-fns';
import { LotDetailModal } from '../Lots/LotDetailModal';
import { LotEditModal } from '../Lots/LotEditModal';
import { SaleSimulationModal } from '../Lots/SaleSimulationModal';
import { SaleRecordForm } from '../Forms/SaleRecordForm';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Portal } from '../Common/Portal';
import { TableWithPagination } from '../Common/TableWithPagination';
import { CattlePurchase } from '../../types';

export const LotsList: React.FC = () => {
  const { cattlePurchases, cattlePurchases, partners, penAllocations, deleteCattlePurchase } = useAppStore();
  const [selectedLot, setSelectedLot] = useState<CattlePurchase | null>(null);
  const [editLot, setEditLot] = useState<CattlePurchase | null>(null);
  const [simulationLot, setSimulationLot] = useState<CattlePurchase | null>(null);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleLotId, setSaleLotId] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLotId, setDeleteLotId] = useState<string>('');

  const getOrderData = (purchaseId: string) => {
    const order = cattlePurchases.find(o => o.id === purchaseId);
    const vendor = order ? partners.find(p => p.id === order.vendorId) : null;
    return { order, vendor };
  };

  const getLotStatus = (lot: CattlePurchase) => {
    const order = cattlePurchases.find(o => o.id === lot.purchaseId);
    if (!order) return 'Desconhecido';
    
    switch (order.status) {
      case 'order':
      case 'payment_validation':
        return 'Em Trânsito';
      case 'reception':
        return 'Aguardando Protocolo';
      case 'confined':
        return 'Confinado';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em Trânsito':
        return 'bg-warning-100 text-warning-800';
      case 'Aguardando Protocolo':
        return 'bg-info-100 text-info-800';
      case 'Confinado':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const getPenNumber = (lotId: string) => {
    const allocation = penAllocations.find(alloc => alloc.lotId === lotId);
    return allocation ? allocation.penNumber : '-';
  };

  const handleViewLot = (lot: CattlePurchase) => {
    setSelectedLot(lot);
  };

  const handleEditLot = (lot: CattlePurchase) => {
    setEditLot(lot);
  };

  const handleCalculateLot = (lot: CattlePurchase) => {
    setSimulationLot(lot);
  };

  const handleSaleLot = (lotId: string) => {
    setSaleLotId(lotId);
    setShowSaleForm(true);
  };

  const handleDeleteLot = (lotId: string) => {
    setDeleteLotId(lotId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLot = () => {
    deleteCattlePurchase(deleteLotId);
    setDeleteLotId('');
    setShowDeleteConfirm(false);
  };

  const columns = [
    {
      key: 'lotNumber',
      label: 'Lote',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-b3x-navy-900 text-sm">{value}</div>
      )
    },
    {
      key: 'purchaseDate',
      label: 'Data Compra',
      sortable: true,
      render: (value: any, row: CattlePurchase) => {
        const { order } = getOrderData(row.purchaseId);
        return order ? format(order.date, 'dd/MM/yyyy') : '-';
      }
    },
    {
      key: 'city',
      label: 'Cidade',
      sortable: true,
      render: (value: any, row: CattlePurchase) => {
        const { order } = getOrderData(row.purchaseId);
        return order?.city || '-';
      }
    },
    {
      key: 'penNumber',
      label: 'Curral',
      sortable: true,
      render: (value: any, row: CattlePurchase) => {
        const penNumber = getPenNumber(row.id);
        return penNumber !== '-' ? (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-100 text-info-800">
            Curral {penNumber}
          </span>
        ) : (
          <span className="text-neutral-500 text-xs">Não alocado</span>
        );
      }
    },
    {
      key: 'entryQuantity',
      label: 'Qtd. Animais',
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-b3x-navy-900 font-medium">{value}</span>
      )
    },
    {
      key: 'entryWeight',
      label: 'Peso Entrada',
      sortable: true,
      render: (value: number) => (
        <span className="text-sm text-neutral-600">{value.toLocaleString('pt-BR')} kg</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: any, row: CattlePurchase) => {
        const status = getLotStatus(row);
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Ações',
      render: (value: any, row: CattlePurchase) => (
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => handleViewLot(row)}
            className="text-info-600 hover:text-info-800 transition-colors p-1.5 rounded hover:bg-info-50"
            title="Ver Ficha Completa"
          >
            <Eye className="w-3 h-3" />
          </button>
          <button 
            onClick={() => handleEditLot(row)}
            className="text-neutral-600 hover:text-neutral-800 transition-colors p-1.5 rounded hover:bg-neutral-50"
            title="Editar Lote"
          >
            <Edit className="w-3 h-3" />
          </button>
          <button 
            onClick={() => handleCalculateLot(row)}
            className="text-b3x-lime-600 hover:text-b3x-lime-800 transition-colors p-1.5 rounded hover:bg-b3x-lime-50"
            title="Simular Venda"
          >
            <Calculator className="w-3 h-3" />
          </button>
          <button 
            onClick={() => handleSaleLot(row.id)}
            className="text-success-600 hover:text-success-800 transition-colors p-1.5 rounded hover:bg-success-50"
            title="Registrar Venda/Abate"
          >
            <DollarSign className="w-3 h-3" />
          </button>
          <button 
            onClick={() => handleDeleteLot(row.id)}
            className="text-error-600 hover:text-error-800 transition-colors p-1.5 rounded hover:bg-error-50"
            title="Excluir Lote"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )
    }
  ];

  if (cattlePurchases.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
          <span className="text-lg">🐄</span>
        </div>
        <h3 className="text-lg font-medium text-b3x-navy-900 mb-2">Nenhum lote ativo</h3>
        <p className="text-neutral-600 text-sm">Quando você tiver lotes em confinamento, eles aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <>
      <TableWithPagination
        data={cattlePurchases}
        columns={columns}
        itemsPerPage={10}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50"
      />

      {/* Modals */}
      {selectedLot && (
        <Portal>
          <LotDetailModal
            lot={selectedLot}
            isOpen={!!selectedLot}
            onClose={() => setSelectedLot(null)}
          />
        </Portal>
      )}

      {editLot && (
        <Portal>
          <LotEditModal
            lot={editLot}
            isOpen={!!editLot}
            onClose={() => setEditLot(null)}
          />
        </Portal>
      )}

      {simulationLot && (
        <Portal>
          <SaleSimulationModal
            lot={simulationLot}
            isOpen={!!simulationLot}
            onClose={() => setSimulationLot(null)}
          />
        </Portal>
      )}

      {showSaleForm && (
        <Portal>
          <SaleRecordForm
            isOpen={showSaleForm}
            onClose={() => setShowSaleForm(false)}
            lotId={saleLotId}
          />
        </Portal>
      )}

      {showDeleteConfirm && (
        <Portal>
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDeleteLot}
            title="Excluir Lote"
            message="Tem certeza que deseja excluir este lote? Esta ação não pode ser desfeita."
            confirmText="Excluir"
            type="danger"
          />
        </Portal>
      )}
    </>
  );
};
