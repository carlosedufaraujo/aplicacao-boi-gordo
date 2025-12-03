import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  FileText,
  CheckCircle,
  Info,
} from 'lucide-react';
import { usersService } from '@/services/api/users';
import { toast } from 'sonner';
import { exportToExcel } from '@/utils/exportUtils';
import { useBackend } from '@/providers/BackendProvider';

export const LGPDCompliance: React.FC = () => {
  const { signOut } = useBackend();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await usersService.exportMyData();
      
      if (response.status === 'success' && response.data) {
        // Exportar dados para Excel
        const exportData = [
          {
            'Tipo': 'Perfil',
            'ID': response.data.perfil.id,
            'Email': response.data.perfil.email,
            'Nome': response.data.perfil.name,
            'Função': response.data.perfil.role,
            'Criado em': response.data.perfil.createdAt,
            'Último acesso': response.data.perfil.lastSignIn,
          },
          ...response.data.compras.map((c: any, idx: number) => ({
            'Tipo': 'Compra',
            'Índice': idx + 1,
            'ID': c.id,
            'Lote': c.lot_number || c.lot_code,
            'Data': c.purchase_date,
            'Quantidade': c.animal_count,
            'Valor': c.total_cost,
          })),
          ...response.data.vendas.map((v: any, idx: number) => ({
            'Tipo': 'Venda',
            'Índice': idx + 1,
            'ID': v.id,
            'Data': v.sale_date,
            'Quantidade': v.quantity,
            'Valor': v.total_amount,
          })),
        ];

        exportToExcel(exportData, 'meus-dados-lgpd', 'Meus Dados');
        
        toast.success('Dados exportados com sucesso!');
      } else {
        throw new Error('Erro ao exportar dados');
      }
    } catch (error: any) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    if (deleteConfirmation !== 'EXCLUIR') {
      toast.error('Digite "EXCLUIR" para confirmar');
      return;
    }

    setIsDeleting(true);
    try {
      await usersService.deleteMyData();
      toast.success('Dados excluídos com sucesso');
      
      // Fazer logout após exclusão
      setTimeout(() => {
        signOut();
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao excluir dados:', error);
      toast.error('Erro ao excluir dados. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Conformidade LGPD</CardTitle>
          </div>
          <CardDescription>
            Gerencie seus dados pessoais de acordo com a Lei Geral de Proteção de Dados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações sobre LGPD */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              De acordo com a LGPD, você tem direito de acessar, exportar e solicitar a exclusão dos seus dados pessoais.
            </AlertDescription>
          </Alert>

          {/* Exportação de Dados */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Exportar Meus Dados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Baixe uma cópia completa dos seus dados pessoais em formato Excel.
                Os dados incluem seu perfil, compras, vendas e outras informações associadas à sua conta.
              </p>
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {isExporting ? (
                  <>
                    <FileText className="h-4 w-4 mr-2 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" />
                Excluir Meus Dados
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong className="text-destructive">Atenção:</strong> Esta ação é irreversível.
                Todos os seus dados pessoais serão anonymizados ou excluídos permanentemente.
                Você será desconectado e precisará criar uma nova conta para usar o sistema novamente.
              </p>
              <Button
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Solicitar Exclusão de Dados
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão de Dados
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong>. Todos os seus dados pessoais serão excluídos ou anonymizados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>O que será excluído:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Seu perfil e informações pessoais</li>
                  <li>Histórico de compras e vendas (serão anonymizados)</li>
                  <li>Dados de acesso e autenticação</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Digite <strong className="text-destructive">EXCLUIR</strong> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Digite EXCLUIR"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmation('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteData}
              disabled={deleteConfirmation !== 'EXCLUIR' || isDeleting}
            >
              {isDeleting ? (
                <>
                  <FileText className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

