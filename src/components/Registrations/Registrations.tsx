import React, { useState } from 'react';
import { Users, Building, Truck, FileText, Plus, CreditCard, Home, Search, Filter, ArrowUpDown, Edit, Trash2, CheckCircle, X, Calendar } from 'lucide-react';
import { PartnerForm } from '../Forms/PartnerForm';
import { PayerAccountForm } from '../Forms/PayerAccountForm';
import { PenRegistrationForm } from '../Forms/PenRegistrationForm';
import { CycleForm } from '../Forms/CycleForm';
import { useAppStore } from '../../stores/useAppStore';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import { Portal } from '../Common/Portal';
import { TableWithPagination } from '../Common/TableWithPagination';

const registrationTypes = [
  {
    id: 'cycles',
    title: 'Ciclos',
    description: 'Ciclos de engorda e operação',
    icon: Calendar,
    color: 'primary',
    type: undefined
  },
  {
    id: 'vendors',
    title: 'Vendedores',
    description: 'Gerencie fornecedores de gado',
    icon: Users,
    color: 'secondary',
    type: 'vendor' as const
  },
  {
    id: 'brokers',
    title: 'Corretores',
    description: 'Cadastro de corretores parceiros',
    icon: Building,
    color: 'secondary',
    type: 'broker' as const
  },
  {
    id: 'slaughterhouses',
    title: 'Frigoríficos',
    description: 'Clientes compradores de gado',
    icon: Truck,
    color: 'accent',
    type: 'slaughterhouse' as const
  },
  {
    id: 'transporters',
    title: 'Transportadoras',
    description: 'Empresas de transporte de gado',
    icon: Truck,
    color: 'info',
    type: 'vendor' as const
  },
  {
    id: 'payer-accounts',
    title: 'Contas Pagadoras',
    description: 'Contas bancárias para pagamentos',
    icon: CreditCard,
    color: 'info',
    type: undefined
  },
  {
    id: 'pens',
    title: 'Currais',
    description: 'Cadastro de currais do confinamento',
    icon: Home,
    color: 'success',
    type: undefined
  },
  {
    id: 'financial-institutions',
    title: 'Inst. Financeiras',
    description: 'Bancos, fundos e instituições financeiras',
    icon: Building,
    color: 'warning',
    type: 'financial' as const
  }
];

const colorMap = {
  primary: 'bg-b3x-lime-50 border-b3x-lime-200 text-b3x-lime-700',
  secondary: 'bg-info-50 border-info-200 text-info-700',
  accent: 'bg-warning-50 border-warning-200 text-warning-700',
  info: 'bg-info-50 border-info-200 text-info-700',
  success: 'bg-success-50 border-success-200 text-success-700',
  error: 'bg-error-50 border-error-200 text-error-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
};

export const Registrations: React.FC = () => {
  const { partners, debts, payerAccounts, penRegistrations, cycles, deletePartner, deletePayerAccount, deletePenRegistration, deleteCycle } = useAppStore();
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showPayerAccountForm, setShowPayerAccountForm] = useState(false);
  const [showPenForm, setShowPenForm] = useState(false);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [selectedPartnerType, setSelectedPartnerType] = useState<'vendor' | 'broker' | 'slaughterhouse' | 'financial'>('vendor');
  const [editPartner, setEditPartner] = useState<string | null>(null);
  const [editPayerAccount, setEditPayerAccount] = useState<string | null>(null);
  const [editPen, setEditPen] = useState<string | null>(null);
  const [editCycle, setEditCycle] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<string>('');
  const [deleteItemType, setDeleteItemType] = useState<'partner' | 'account' | 'pen' | 'cycle'>('partner');
  const [activeTab, setActiveTab] = useState<string>('cycles');
  const [searchTerm, setSearchTerm] = useState('');

  const getItemCount = (type: string) => {
    switch (type) {
      case 'cycles':
        return cycles.length;
      case 'vendors':
        return partners.filter(p => p.type === 'vendor' && p.isActive && !p.isTransporter).length;
      case 'transporters':
        return partners.filter(p => p.type === 'vendor' && p.isActive && p.isTransporter).length;
      case 'brokers':
        return partners.filter(p => p.type === 'broker' && p.isActive).length;
      case 'slaughterhouses':
        return partners.filter(p => p.type === 'slaughterhouse' && p.isActive).length;
      case 'payer-accounts':
        return payerAccounts.filter(acc => acc.isActive).length;
      case 'pens':
        return penRegistrations.filter(pen => pen.isActive).length;
      case 'financial-institutions':
        return partners.filter(p => p.type === 'financial' && p.isActive).length;
      default:
        return 0;
    }
  };

  const handleNewPartner = (type: 'vendor' | 'broker' | 'slaughterhouse' | 'financial') => {
    setSelectedPartnerType(type);
    setEditPartner(null);
    setShowPartnerForm(true);
  };

  const handleEditPartner = (id: string, type: 'vendor' | 'broker' | 'slaughterhouse' | 'financial') => {
    setSelectedPartnerType(type);
    setEditPartner(id);
    setShowPartnerForm(true);
  };

  const handleDeletePartner = (id: string) => {
    setDeleteItemId(id);
    setDeleteItemType('partner');
    setShowDeleteConfirm(true);
  };

  const handleNewPayerAccount = () => {
    setEditPayerAccount(null);
    setShowPayerAccountForm(true);
  };

  const handleEditPayerAccount = (id: string) => {
    setEditPayerAccount(id);
    setShowPayerAccountForm(true);
  };

  const handleDeletePayerAccount = (id: string) => {
    setDeleteItemId(id);
    setDeleteItemType('account');
    setShowDeleteConfirm(true);
  };

  const handleNewPen = () => {
    setEditPen(null);
    setShowPenForm(true);
  };

  const handleEditPen = (id: string) => {
    setEditPen(id);
    setShowPenForm(true);
  };

  const handleDeletePen = (id: string) => {
    setDeleteItemId(id);
    setDeleteItemType('pen');
    setShowDeleteConfirm(true);
  };

  const handleNewCycle = () => {
    setEditCycle(null);
    setShowCycleForm(true);
  };

  const handleEditCycle = (id: string) => {
    setEditCycle(id);
    setShowCycleForm(true);
  };

  const handleDeleteCycle = (id: string) => {
    setDeleteItemId(id);
    setDeleteItemType('cycle');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteItemType === 'partner') {
      deletePartner(deleteItemId);
    } else if (deleteItemType === 'account') {
      deletePayerAccount(deleteItemId);
    } else if (deleteItemType === 'pen') {
      deletePenRegistration(deleteItemId);
    } else if (deleteItemType === 'cycle') {
      deleteCycle(deleteItemId);
    }
    setShowDeleteConfirm(false);
  };

  // Filtrar dados com base na pesquisa
  const getFilteredData = () => {
    let data: any[] = [];
    
    if (activeTab === 'cycles') {
      data = cycles;
    } else if (activeTab === 'vendors') {
      data = partners.filter(p => p.type === 'vendor' && p.isActive && !p.isTransporter);
    } else if (activeTab === 'transporters') {
      data = partners.filter(p => p.type === 'vendor' && p.isActive && p.isTransporter);
    } else if (activeTab === 'brokers') {
      data = partners.filter(p => p.type === 'broker' && p.isActive);
    } else if (activeTab === 'slaughterhouses') {
      data = partners.filter(p => p.type === 'slaughterhouse' && p.isActive);
    } else if (activeTab === 'payer-accounts') {
      data = payerAccounts.filter(acc => acc.isActive);
    } else if (activeTab === 'pens') {
      data = penRegistrations.filter(pen => pen.isActive);
    } else if (activeTab === 'financial-institutions') {
      data = partners.filter(p => p.type === 'financial' && p.isActive);
    }
    
    // Aplicar filtro de pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item => {
        if ('name' in item && typeof item.name === 'string') {
          return item.name.toLowerCase().includes(term);
        }
        if ('penNumber' in item && typeof item.penNumber === 'string') {
          return item.penNumber.toLowerCase().includes(term);
        }
        if ('description' in item && typeof item.description === 'string') {
          return item.description.toLowerCase().includes(term);
        }
        return false;
      });
    }
    
    return data;
  };

  const filteredData = getFilteredData();

  // Definir colunas para cada tipo de tabela
  const getColumns = () => {
    if (activeTab === 'cycles') {
      return [
        {
          key: 'name',
          label: 'Nome do Ciclo',
          sortable: true,
          render: (value: string, row: any) => (
            <div>
              <div className="font-medium text-b3x-navy-900 text-sm">{value}</div>
              {row.description && (
                <div className="text-xs text-neutral-500 mt-0.5">{row.description}</div>
              )}
            </div>
          )
        },
        {
          key: 'startDate',
          label: 'Período',
          sortable: true,
          render: (value: Date, row: any) => (
            <div className="text-sm">
              <div>{new Date(value).toLocaleDateString('pt-BR')}</div>
              {row.endDate && (
                <div className="text-xs text-neutral-500">
                  até {new Date(row.endDate).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          )
        },
        {
          key: 'status',
          label: 'Status',
          sortable: true,
          render: (value: string) => {
            const statusMap = {
              planned: { label: 'Planejado', color: 'bg-info-100 text-info-800' },
              active: { label: 'Ativo', color: 'bg-success-100 text-success-800' },
              completed: { label: 'Concluído', color: 'bg-neutral-100 text-neutral-800' }
            };
            const status = statusMap[value as keyof typeof statusMap];
            return (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                {status.label}
              </span>
            );
          }
        },
        {
          key: 'budget',
          label: 'Orçamento',
          sortable: true,
          render: (value: number) => (
            <div className="text-sm font-medium">
              {value ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
            </div>
          )
        },
        {
          key: 'targetAnimals',
          label: 'Meta de Animais',
          sortable: true,
          render: (value: number) => (
            <div className="text-sm">
              {value ? `${value.toLocaleString('pt-BR')} animais` : '-'}
            </div>
          )
        },
        {
          key: 'actions',
          label: 'Ações',
          render: (value: any, row: any) => (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => handleEditCycle(row.id)}
                className="p-1.5 text-info-600 hover:bg-info-50 rounded"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteCycle(row.id)}
                className="p-1.5 text-error-600 hover:bg-error-50 rounded"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        }
      ];
    } else if (activeTab === 'vendors' || activeTab === 'brokers' || activeTab === 'slaughterhouses' || activeTab === 'transporters' || activeTab === 'financial-institutions') {
      return [
        {
          key: 'name',
          label: 'Nome',
          sortable: true,
          render: (value: string, row: any) => (
            <div>
              <div className="font-medium text-b3x-navy-900 text-sm">{value}</div>
              <div className="text-xs text-neutral-500">{row.cpfCnpj || 'Sem CPF/CNPJ'}</div>
            </div>
          )
        },
        {
          key: 'city',
          label: 'Cidade/UF',
          sortable: true,
          render: (value: string, row: any) => `${value}, ${row.state}`
        },
        {
          key: 'phone',
          label: 'Contato',
          sortable: true,
          render: (value: string, row: any) => (
            <div>
              {value || 'Não informado'}
              {row.email && <div className="text-xs">{row.email}</div>}
            </div>
          )
        },
        {
          key: 'actions',
          label: 'Ações',
          render: (value: any, row: any) => (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => handleEditPartner(row.id, row.type)}
                className="p-1.5 text-info-600 hover:bg-info-50 rounded"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeletePartner(row.id)}
                className="p-1.5 text-error-600 hover:bg-error-50 rounded"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        }
      ];
    } else if (activeTab === 'payer-accounts') {
      return [
        {
          key: 'name',
          label: 'Nome da Conta',
          sortable: true
        },
        {
          key: 'bankName',
          label: 'Banco',
          sortable: true
        },
        {
          key: 'bankAgency',
          label: 'Agência/Conta',
          render: (value: string, row: any) => (
            <div>
              {value} / {row.bankAccount}
              <div className="text-xs text-neutral-500">
                {row.bankAccountType === 'checking' ? 'Conta Corrente' : 'Poupança'}
              </div>
            </div>
          )
        },
        {
          key: 'isDefault',
          label: 'Status',
          sortable: true,
          render: (value: boolean) => (
            value ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-b3x-lime-100 text-b3x-lime-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Padrão
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                Ativa
              </span>
            )
          )
        },
        {
          key: 'actions',
          label: 'Ações',
          render: (value: any, row: any) => (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => handleEditPayerAccount(row.id)}
                className="p-1.5 text-info-600 hover:bg-info-50 rounded"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeletePayerAccount(row.id)}
                className="p-1.5 text-error-600 hover:bg-error-50 rounded"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        }
      ];
    } else if (activeTab === 'pens') {
      return [
        {
          key: 'penNumber',
          label: 'Número',
          sortable: true,
          render: (value: string) => (
            <div className="font-medium text-b3x-navy-900 text-sm">Curral {value}</div>
          )
        },
        {
          key: 'location',
          label: 'Localização',
          sortable: true,
          render: (value: string) => (
            <div className="text-sm text-neutral-700">
              {value || 'Não especificada'}
            </div>
          )
        },
        {
          key: 'description',
          label: 'Descrição',
          sortable: false,
          render: (value: string) => (
            <div className="text-sm text-neutral-600">
              {value || '-'}
            </div>
          )
        },
        {
          key: 'isActive',
          label: 'Status',
          sortable: true,
          render: (value: boolean) => (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativo
            </span>
          )
        },
        {
          key: 'actions',
          label: 'Ações',
          render: (value: any, row: any) => (
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => {
                  const pen = penRegistrations.find(p => p.penNumber === row.penNumber);
                  if (pen) handleEditPen(pen.penNumber);
                }}
                className="p-1.5 text-info-600 hover:bg-info-50 rounded"
                title="Editar"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeletePen(row.id)}
                className="p-1.5 text-error-600 hover:bg-error-50 rounded"
                title="Excluir"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        }
      ];
    }
    
    return [];
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-b3x-navy-900 mb-1">Cadastros</h2>
        <p className="text-sm text-neutral-600">Gerencie ciclos, vendedores, corretores, frigoríficos, transportadoras, contas pagadoras, currais e instituições financeiras</p>
      </div>

      {/* Cards de Resumo - Mais compactos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 mb-4">
        {registrationTypes.map((type) => {
          const Icon = type.icon;
          const count = getItemCount(type.id);
          const isActive = activeTab === type.id;
          
          return (
            <div
              key={type.id}
              className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border ${
                isActive ? 'border-b3x-lime-300 ring-2 ring-b3x-lime-200' : 'border-neutral-200/50'
              } p-3 hover:shadow-soft-lg hover:border-b3x-lime-200/50 transition-all duration-200 cursor-pointer`}
              onClick={() => setActiveTab(type.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg border-2 ${colorMap[type.color as keyof typeof colorMap]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-lg font-bold text-b3x-navy-900">{count}</span>
              </div>
              
              <h3 className="font-semibold text-b3x-navy-900 mb-1 text-sm">{type.title}</h3>
              <p className="text-xs text-neutral-600 mb-2 line-clamp-1">{type.description}</p>
            </div>
          );
        })}
      </div>

      {/* Barra de Ferramentas */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-soft border border-neutral-200/50 mb-4">
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/50">
          <div className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={`Buscar ${
                  activeTab === 'cycles' ? 'ciclos' :
                  activeTab === 'vendors' ? 'vendedores' : 
                  activeTab === 'transporters' ? 'transportadoras' :
                  activeTab === 'brokers' ? 'corretores' : 
                  activeTab === 'slaughterhouses' ? 'frigoríficos' : 
                  activeTab === 'payer-accounts' ? 'contas' : 
                  activeTab === 'pens' ? 'currais' : 
                  activeTab === 'financial-institutions' ? 'instituições financeiras' : ''
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-b3x-lime-500 focus:border-transparent text-sm"
              />
            </div>
            
            <button className="p-2 text-neutral-600 hover:text-b3x-navy-900 hover:bg-neutral-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          
          <div>
            <button 
              onClick={() => {
                if (activeTab === 'cycles') handleNewCycle();
                else if (activeTab === 'vendors') handleNewPartner('vendor');
                else if (activeTab === 'transporters') {
                  setSelectedPartnerType('vendor');
                  setEditPartner(null);
                  setShowPartnerForm(true);
                }
                else if (activeTab === 'brokers') handleNewPartner('broker');
                else if (activeTab === 'slaughterhouses') handleNewPartner('slaughterhouse');
                else if (activeTab === 'financial-institutions') handleNewPartner('financial');
                else if (activeTab === 'payer-accounts') handleNewPayerAccount();
                else if (activeTab === 'pens') handleNewPen();
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-b3x-lime-500 to-b3x-lime-600 text-b3x-navy-900 font-medium rounded-lg hover:from-b3x-lime-600 hover:to-b3x-lime-700 transition-all duration-200 shadow-soft text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo {
                activeTab === 'cycles' ? 'Ciclo' :
                activeTab === 'vendors' ? 'Vendedor' : 
                activeTab === 'transporters' ? 'Transportadora' :
                activeTab === 'brokers' ? 'Corretor' : 
                activeTab === 'slaughterhouses' ? 'Frigorífico' : 
                activeTab === 'payer-accounts' ? 'Conta' : 
                activeTab === 'pens' ? 'Curral' : 
                activeTab === 'financial-institutions' ? 'Instituição' : 'Registro'
              }</span>
            </button>
          </div>
        </div>
        
        {/* Tabela de Dados com Paginação */}
        <div className="p-0">
          {filteredData.length > 0 ? (
            <TableWithPagination
              data={filteredData}
              columns={getColumns()}
              itemsPerPage={10}
            />
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-neutral-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                {activeTab === 'cycles' ? (
                  <Calendar className="w-6 h-6 text-neutral-400" />
                ) : activeTab === 'vendors' || activeTab === 'brokers' || activeTab === 'transporters' ? (
                  <Users className="w-6 h-6 text-neutral-400" />
                ) : activeTab === 'slaughterhouses' ? (
                  <Building className="w-6 h-6 text-neutral-400" />
                ) : activeTab === 'payer-accounts' ? (
                  <CreditCard className="w-6 h-6 text-neutral-400" />
                ) : activeTab === 'pens' ? (
                  <Home className="w-6 h-6 text-neutral-400" />
                ) : (
                  <FileText className="w-6 h-6 text-neutral-400" />
                )}
              </div>
              <p className="text-neutral-500 text-sm">Nenhum registro encontrado</p>
              <button
                onClick={() => {
                  if (activeTab === 'cycles') handleNewCycle();
                  else if (activeTab === 'vendors') handleNewPartner('vendor');
                  else if (activeTab === 'transporters') {
                    setSelectedPartnerType('vendor');
                    setEditPartner(null);
                    setShowPartnerForm(true);
                  }
                  else if (activeTab === 'brokers') handleNewPartner('broker');
                  else if (activeTab === 'slaughterhouses') handleNewPartner('slaughterhouse');
                  else if (activeTab === 'financial-institutions') handleNewPartner('financial');
                  else if (activeTab === 'payer-accounts') handleNewPayerAccount();
                  else if (activeTab === 'pens') handleNewPen();
                }}
                className="mt-2 text-b3x-lime-600 hover:text-b3x-lime-700 text-sm underline"
              >
                Adicionar novo registro
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Forms */}
      {showPartnerForm && (
        <Portal>
          <PartnerForm
            isOpen={showPartnerForm}
            onClose={() => setShowPartnerForm(false)}
            type={selectedPartnerType}
            isTransporter={activeTab === 'transporters'}
          />
        </Portal>
      )}

      {showPayerAccountForm && (
        <Portal>
          <PayerAccountForm
            isOpen={showPayerAccountForm}
            onClose={() => setShowPayerAccountForm(false)}
          />
        </Portal>
      )}

      {showPenForm && (
        <Portal>
          <PenRegistrationForm
            isOpen={showPenForm}
            onClose={() => setShowPenForm(false)}
            penNumber={editPen || undefined}
          />
        </Portal>
      )}

      {showCycleForm && (
        <Portal>
          <CycleForm
            isOpen={showCycleForm}
            onClose={() => setShowCycleForm(false)}
            initialData={editCycle ? cycles.find(c => c.id === editCycle) : undefined}
          />
        </Portal>
      )}

      {/* Confirmação de exclusão */}
      {showDeleteConfirm && (
        <Portal>
          <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            onConfirm={confirmDelete}
            title={`Excluir ${
              deleteItemType === 'partner' ? 'Parceiro' : 
              deleteItemType === 'account' ? 'Conta Pagadora' : 
              deleteItemType === 'pen' ? 'Curral' :
              deleteItemType === 'cycle' ? 'Ciclo' : ''
            }`}
            message={`Tem certeza que deseja excluir este ${
              deleteItemType === 'partner' ? 'parceiro' : 
              deleteItemType === 'account' ? 'conta pagadora' : 
              deleteItemType === 'pen' ? 'curral' :
              deleteItemType === 'cycle' ? 'ciclo' : ''
            }? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            type="danger"
          />
        </Portal>
      )}
    </div>
  );
};