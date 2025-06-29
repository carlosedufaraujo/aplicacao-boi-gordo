import React, { useState } from 'react';
import { Database, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { v4 as uuidv4 } from 'uuid';
import { 
  Partner, 
  PurchaseOrder, 
  Transporter, 
  PayerAccount, 
  FinancialInstitution 
} from '../../types';

export const TestDataManager: React.FC = () => {
  const { 
    partners,
    purchaseOrders,
    transporters,
    payerAccounts,
    financialInstitutions,
    addPartner,
    addPurchaseOrder,
    addTransporter,
    addPayerAccount,
    addFinancialInstitution,
    addCycle,
    clearAllTestData,
    addNotification
  } = useAppStore();

  const [isCreating, setIsCreating] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const createTestData = async () => {
    setIsCreating(true);

    try {
      // 0. Criar Ciclo Ativo
      const cycleId = uuidv4();
      addCycle({
        name: 'Ciclo 2024/01',
        startDate: new Date('2024-01-01'),
        status: 'active',
        description: 'Ciclo de engorda do primeiro semestre de 2024',
        budget: 5000000,
        targetAnimals: 1000
      });

      // 1. Criar Vendedores
      const vendors: Partner[] = [
        {
          id: uuidv4(),
          name: 'Fazenda São João',
          type: 'vendor',
          cpfCnpj: '12.345.678/0001-90',
          phone: '(65) 99123-4567',
          email: 'contato@fazendasaojoao.com.br',
          address: 'Rod. BR-163, km 120',
          city: 'Sorriso',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Agropecuária Bela Vista',
          type: 'vendor',
          cpfCnpj: '23.456.789/0001-01',
          phone: '(65) 99234-5678',
          email: 'vendas@belavista.agro.br',
          address: 'Estrada Municipal, km 45',
          city: 'Lucas do Rio Verde',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Rancho Três Irmãos',
          type: 'vendor',
          cpfCnpj: '34.567.890/0001-12',
          phone: '(65) 99345-6789',
          email: 'rancho3irmaos@gmail.com',
          address: 'Fazenda Três Irmãos, s/n',
          city: 'Nova Mutum',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Pecuária Santa Rita',
          type: 'vendor',
          cpfCnpj: '45.678.901/0001-23',
          phone: '(65) 99456-7890',
          email: 'santarita@pecuaria.com.br',
          address: 'Rod. MT-242, km 80',
          city: 'Sinop',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Fazenda Nova Esperança',
          type: 'vendor',
          cpfCnpj: '56.789.012/0001-34',
          phone: '(65) 99567-8901',
          email: 'novaesperanca@fazenda.com',
          address: 'Distrito Industrial',
          city: 'Tangará da Serra',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        }
      ];

      vendors.forEach(vendor => addPartner(vendor));

      // 2. Criar Corretores
      const brokers: Partner[] = [
        {
          id: uuidv4(),
          name: 'José Carlos Corretagens',
          type: 'broker',
          cpfCnpj: '123.456.789-00',
          phone: '(65) 99876-5432',
          email: 'josecarlos@corretagens.com',
          address: 'Av. dos Tarumãs, 1500',
          city: 'Cuiabá',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Maria Silva Negócios Rurais',
          type: 'broker',
          cpfCnpj: '234.567.890-11',
          phone: '(65) 99765-4321',
          email: 'maria.silva@rural.com.br',
          address: 'Rua das Palmeiras, 200',
          city: 'Rondonópolis',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Pedro Oliveira Intermediações',
          type: 'broker',
          cpfCnpj: '345.678.901-22',
          phone: '(65) 99654-3210',
          email: 'pedro@intermediacoes.com',
          address: 'Av. Mato Grosso, 3000',
          city: 'Várzea Grande',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        }
      ];

      brokers.forEach(broker => addPartner(broker));

      // 3. Criar Frigoríficos
      const slaughterhouses: Partner[] = [
        {
          id: uuidv4(),
          name: 'JBS Unidade Sorriso',
          type: 'slaughterhouse',
          cpfCnpj: '02.916.265/0001-60',
          phone: '(65) 3544-3000',
          email: 'compras.sorriso@jbs.com.br',
          address: 'Rod. BR-163, km 768',
          city: 'Sorriso',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Marfrig Tangará',
          type: 'slaughterhouse',
          cpfCnpj: '03.853.896/0001-40',
          phone: '(65) 3326-1000',
          email: 'tangara@marfrig.com.br',
          address: 'Distrito Industrial',
          city: 'Tangará da Serra',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          name: 'Minerva Foods Nova Mutum',
          type: 'slaughterhouse',
          cpfCnpj: '67.620.377/0001-14',
          phone: '(65) 3308-3000',
          email: 'novamutum@minervafoods.com',
          address: 'Rod. MT-235, km 15',
          city: 'Nova Mutum',
          state: 'MT',
          isActive: true,
          createdAt: new Date()
        }
      ];

      slaughterhouses.forEach(sh => addPartner(sh));

      // 4. Criar Transportadoras
      const transportersData: Transporter[] = [
        {
          id: uuidv4(),
          name: 'Rodo Gado Transportes',
          document: '78.901.234/0001-56',
          phone: '(65) 99123-7777',
          email: 'contato@rodogado.com.br',
          address: 'Rod. BR-070, km 15',
          city: 'Cuiabá',
          state: 'MT',
          zipCode: '78090-000',
          pricePerKm: 3.50,
          minDistance: 50,
          isActive: true
        },
        {
          id: uuidv4(),
          name: 'Trans Boi Logística',
          document: '89.012.345/0001-67',
          phone: '(65) 99234-8888',
          email: 'operacao@transboi.com',
          address: 'Av. Industrial, 2000',
          city: 'Rondonópolis',
          state: 'MT',
          zipCode: '78700-000',
          pricePerKm: 3.20,
          minDistance: 30,
          isActive: true
        },
        {
          id: uuidv4(),
          name: 'Boiadeiro Express',
          document: '90.123.456/0001-78',
          phone: '(65) 99345-9999',
          email: 'frete@boiadeiroexpress.com',
          address: 'Distrito Rodoviário',
          city: 'Sinop',
          state: 'MT',
          zipCode: '78550-000',
          pricePerKm: 3.80,
          minDistance: 100,
          isActive: true
        }
      ];

      transportersData.forEach(transporter => addTransporter(transporter));

      // 5. Criar Instituições Financeiras
      const banks: FinancialInstitution[] = [
        {
          id: uuidv4(),
          name: 'Banco do Brasil',
          code: '001',
          type: 'bank',
          isActive: true
        },
        {
          id: uuidv4(),
          name: 'Bradesco',
          code: '237',
          type: 'bank',
          isActive: true
        },
        {
          id: uuidv4(),
          name: 'Itaú Unibanco',
          code: '341',
          type: 'bank',
          isActive: true
        },
        {
          id: uuidv4(),
          name: 'Santander',
          code: '033',
          type: 'bank',
          isActive: true
        },
        {
          id: uuidv4(),
          name: 'Sicredi',
          code: '748',
          type: 'cooperative',
          isActive: true
        }
      ];

      banks.forEach(bank => addFinancialInstitution(bank));

      // 6. Criar Contas Pagadoras
      const payerAccountsData: PayerAccount[] = [
        {
          id: uuidv4(),
          institutionId: banks[0].id,
          accountName: 'CEAC Agropecuária - Conta Principal',
          name: 'CEAC Agropecuária - Conta Principal',
          bankName: banks[0].name,
          agency: '1234-5',
          bankAgency: '1234-5',
          accountNumber: '12345-6',
          bankAccount: '12345-6',
          accountType: 'checking',
          bankAccountType: 'checking',
          balance: 1500000,
          isActive: true,
          isDefault: true,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          institutionId: banks[1].id,
          accountName: 'CEAC Agropecuária - Conta Operacional',
          name: 'CEAC Agropecuária - Conta Operacional',
          bankName: banks[1].name,
          agency: '5678-9',
          bankAgency: '5678-9',
          accountNumber: '67890-1',
          bankAccount: '67890-1',
          accountType: 'checking',
          bankAccountType: 'checking',
          balance: 800000,
          isActive: true,
          isDefault: false,
          createdAt: new Date()
        },
        {
          id: uuidv4(),
          institutionId: banks[2].id,
          accountName: 'CEAC Agropecuária - Conta Investimento',
          name: 'CEAC Agropecuária - Conta Investimento',
          bankName: banks[2].name,
          agency: '9012-3',
          bankAgency: '9012-3',
          accountNumber: '34567-8',
          bankAccount: '34567-8',
          accountType: 'savings',
          bankAccountType: 'savings',
          balance: 2000000,
          isActive: true,
          isDefault: false,
          createdAt: new Date()
        }
      ];

      payerAccountsData.forEach(account => addPayerAccount(account));

      // 7. Criar Ordens de Compra
      const purchaseOrdersData: any[] = [
        {
          id: uuidv4(),
          code: 'OC-2024-001',
          cycleId: cycleId,
          date: new Date(),
          vendorId: vendors[0].id,
          brokerId: brokers[0].id,
          quantity: 150,
          animalType: 'male',
          estimatedAge: 24,
          totalWeight: 45000,
          rcPercentage: 52,
          pricePerArroba: 320,
          commission: 1500,
          taxes: 0,
          otherCosts: 0,
          city: 'Sorriso',
          state: 'MT',
          status: 'order',
          paymentValidated: false,
          paymentType: 'cash',
          createdAt: new Date(),
          updatedAt: new Date(),
          observations: 'Lote de alta qualidade, animais com boa genética'
        },
        {
          id: uuidv4(),
          code: 'OC-2024-002',
          cycleId: cycleId,
          date: new Date(),
          vendorId: vendors[1].id,
          brokerId: brokers[1].id,
          quantity: 200,
          animalType: 'male',
          estimatedAge: 20,
          totalWeight: 56000,
          rcPercentage: 53,
          pricePerArroba: 325,
          commission: 2000,
          taxes: 0,
          otherCosts: 0,
          city: 'Lucas do Rio Verde',
          state: 'MT',
          status: 'payment_validation',
          paymentValidated: false,
          paymentType: 'cash',
          createdAt: new Date(),
          updatedAt: new Date(),
          observations: 'Animais precoces, ideal para confinamento'
        },
        {
          id: uuidv4(),
          code: 'OC-2024-003',
          cycleId: cycleId,
          date: new Date(),
          vendorId: vendors[2].id,
          brokerId: brokers[2].id,
          quantity: 100,
          animalType: 'female',
          estimatedAge: 18,
          totalWeight: 25000,
          rcPercentage: 50,
          pricePerArroba: 310,
          commission: 1000,
          taxes: 0,
          otherCosts: 0,
          city: 'Nova Mutum',
          state: 'MT',
          status: 'reception',
          paymentValidated: true,
          paymentType: 'cash',
          createdAt: new Date(),
          updatedAt: new Date(),
          observations: 'Lote misto com boa média de peso'
        },
        {
          id: uuidv4(),
          code: 'OC-2024-004',
          cycleId: cycleId,
          date: new Date(),
          vendorId: vendors[3].id,
          brokerId: brokers[0].id,
          quantity: 180,
          animalType: 'male',
          estimatedAge: 22,
          totalWeight: 50400,
          rcPercentage: 51,
          pricePerArroba: 318,
          commission: 1800,
          taxes: 0,
          otherCosts: 0,
          city: 'Sinop',
          state: 'MT',
          status: 'order',
          paymentValidated: false,
          paymentType: 'cash',
          createdAt: new Date(),
          updatedAt: new Date(),
          observations: 'Animais de pasto, necessitam adaptação'
        },
        {
          id: uuidv4(),
          code: 'OC-2024-005',
          cycleId: cycleId,
          date: new Date(),
          vendorId: vendors[4].id,
          brokerId: brokers[1].id,
          quantity: 250,
          animalType: 'male',
          estimatedAge: 26,
          totalWeight: 75000,
          rcPercentage: 54,
          pricePerArroba: 330,
          commission: 2500,
          taxes: 0,
          otherCosts: 0,
          city: 'Tangará da Serra',
          state: 'MT',
          status: 'confined',
          paymentValidated: true,
          paymentType: 'cash',
          createdAt: new Date(),
          updatedAt: new Date(),
          observations: 'Excelente lote, animais já adaptados a confinamento'
        }
      ];

      purchaseOrdersData.forEach(order => addPurchaseOrder(order));

      // Adicionar notificação de sucesso
      addNotification({
        type: 'success',
        title: 'Dados de Teste Criados',
        message: `Foram criados: ${vendors.length} vendedores, ${brokers.length} corretores, ${slaughterhouses.length} frigoríficos, ${transportersData.length} transportadoras, ${banks.length} bancos, ${payerAccountsData.length} contas e ${purchaseOrdersData.length} ordens de compra.`
      });

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro ao Criar Dados',
        message: 'Ocorreu um erro ao criar os dados de teste. Tente novamente.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    clearAllTestData();
    setShowConfirmReset(false);
    
    addNotification({
      type: 'success',
      title: 'Dados Resetados',
      message: 'Todos os dados de teste foram removidos com sucesso.'
    });
  };

  const hasTestData = partners.length > 0 || purchaseOrders.length > 0 || 
    transporters.length > 0 || payerAccounts.length > 0 || 
    financialInstitutions.length > 0;

  return (
    <>
      {/* Botão Flutuante */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="flex flex-col space-y-2">
          {hasTestData && (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="bg-error-600 hover:bg-error-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
              title="Resetar Dados de Teste"
            >
              <Trash2 className="w-5 h-5" />
              <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Resetar Dados
              </span>
            </button>
          )}
          
          <button
            onClick={createTestData}
            disabled={isCreating}
            className="bg-b3x-lime-500 hover:bg-b3x-lime-600 text-b3x-navy-900 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Criar Dados de Teste"
          >
            <Database className={`w-5 h-5 ${isCreating ? 'animate-pulse' : ''}`} />
            <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Criar Dados de Teste
            </span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-error-100 dark:bg-error-900/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-error-600 dark:text-error-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Resetar Dados de Teste
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-neutral-700 dark:text-neutral-300">
                Tem certeza que deseja remover todos os dados de teste do sistema? Isso inclui:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
                <li>• Todos os cadastros (vendedores, corretores, etc.)</li>
                <li>• Todas as ordens de compra e vendas</li>
                <li>• Todos os lotes e movimentações</li>
                <li>• Todos os dados financeiros</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-error-600 hover:bg-error-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Resetar Tudo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}; 