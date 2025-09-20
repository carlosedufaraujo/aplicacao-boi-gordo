import React from 'react';
import { CategoryCostCenterManager } from '@/components/Financial/CategoryCostCenterManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Building2,
  Tag,
  CreditCard,
  FileText,
  Users,
  TrendingUp
} from 'lucide-react';

export const FinancialSettings: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Settings className="w-8 h-8 mr-3 text-blue-600" />
            Configurações Financeiras
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie categorias, centros de custo e outras configurações financeiras do sistema
          </p>
        </div>
      </div>

      {/* Tabs de Configuração */}
      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">
            <Tag className="w-4 h-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <CreditCard className="w-4 h-4 mr-2" />
            Contas
          </TabsTrigger>
          <TabsTrigger value="partners">
            <Users className="w-4 h-4 mr-2" />
            Parceiros
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Categorias e Centros de Custo */}
        <TabsContent value="categories">
          <CategoryCostCenterManager />
        </TabsContent>

        {/* Contas Bancárias */}
        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <CardTitle>Contas Bancárias</CardTitle>
              <CardDescription>
                Gerencie as contas bancárias utilizadas para pagamentos e recebimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Módulo de contas bancárias em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parceiros Financeiros */}
        <TabsContent value="partners">
          <Card>
            <CardHeader>
              <CardTitle>Parceiros Financeiros</CardTitle>
              <CardDescription>
                Configure fornecedores, clientes e outros parceiros comerciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Módulo de parceiros em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Relatórios */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Relatórios</CardTitle>
              <CardDescription>
                Personalize relatórios financeiros e exportações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Configurações de relatórios em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Categorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">0</div>
              <Tag className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Ativas no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Centros de Custo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">0</div>
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Configurados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Integrações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">100%</div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Sistema sincronizado</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};