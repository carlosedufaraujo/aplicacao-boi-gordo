import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Activity, History, Syringe, Skull, ArrowRightLeft, Weight } from 'lucide-react';
import InterventionHistory from './InterventionHistory';
import { IntegratedInterventionForm } from './IntegratedInterventionForm';
import { useInterventionsApi } from '@/hooks/api/useInterventionsApi';
import { useCattlePurchasesApi } from '@/hooks/api/useCattlePurchasesApi';
import { usePensApi } from '@/hooks/api/usePensApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';

export const InterventionsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'create'>('history');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [interventionFormType, setInterventionFormType] = useState<'health' | 'mortality' | 'movement' | 'weight'>('health');

  const { createHealthIntervention, createMortalityRecord, createPenMovement, createWeightReading } = useInterventionsApi();
  const { cattlePurchases, fetchCattlePurchases } = useCattlePurchasesApi();
  const { pens, fetchPens } = usePensApi();
  const { payerAccounts, fetchPayerAccounts } = usePayerAccountsApi();

  React.useEffect(() => {
    fetchCattlePurchases();
    fetchPens();
    fetchPayerAccounts();
  }, []);

  const handleCreateIntervention = async (data: any) => {
    try {
      switch (interventionFormType) {
        case 'health':
          await createHealthIntervention(data);
          break;
        case 'mortality':
          await createMortalityRecord(data);
          break;
        case 'movement':
          await createPenMovement(data);
          break;
        case 'weight':
          await createWeightReading(data);
          break;
      }
      setShowCreateForm(false);
      setActiveTab('history');
    } catch (error) {
      console.error('Erro ao criar intervenção:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Intervenções Veterinárias</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie protocolos sanitários, mortalidade, movimentações e pesagens
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setInterventionFormType('health');
              setShowCreateForm(true);
              setActiveTab('create');
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Intervenção
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'history' | 'create')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Criar Intervenção
          </TabsTrigger>
        </TabsList>

        {/* Tab: Histórico */}
        <TabsContent value="history" className="space-y-4">
          <InterventionHistory />
        </TabsContent>

        {/* Tab: Criar Intervenção */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selecione o tipo de intervenção</CardTitle>
              <CardDescription>
                Escolha o tipo de intervenção que deseja registrar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant={interventionFormType === 'health' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setInterventionFormType('health');
                    setShowCreateForm(true);
                  }}
                >
                  <Syringe className="h-6 w-6" />
                  <span>Protocolo Sanitário</span>
                </Button>

                <Button
                  variant={interventionFormType === 'mortality' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setInterventionFormType('mortality');
                    setShowCreateForm(true);
                  }}
                >
                  <Skull className="h-6 w-6" />
                  <span>Mortalidade</span>
                </Button>

                <Button
                  variant={interventionFormType === 'movement' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setInterventionFormType('movement');
                    setShowCreateForm(true);
                  }}
                >
                  <ArrowRightLeft className="h-6 w-6" />
                  <span>Movimentação</span>
                </Button>

                <Button
                  variant={interventionFormType === 'weight' ? 'default' : 'outline'}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => {
                    setInterventionFormType('weight');
                    setShowCreateForm(true);
                  }}
                >
                  <Weight className="h-6 w-6" />
                  <span>Pesagem</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formulário será exibido via modal quando showCreateForm for true */}
        </TabsContent>
      </Tabs>

      {/* Modal de criação de intervenção */}
      {showCreateForm && (
        <IntegratedInterventionForm
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setActiveTab('history');
          }}
          pens={pens}
          lots={cattlePurchases}
          accounts={payerAccounts}
          onSubmit={handleCreateIntervention}
        />
      )}
    </div>
  );
};

