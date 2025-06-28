import React, { useState } from 'react';
import { X, Upload, FileUp, Database, Check, AlertCircle, Info, Download, RefreshCw, FileText, Settings } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

interface BankStatementImportProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankStatementImport: React.FC<BankStatementImportProps> = ({
  isOpen,
  onClose
}) => {
  const { payerAccounts, addNotification } = useAppStore();
  
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<'csv' | 'ofx' | 'qif' | 'xlsx' | 'pdf'>('csv');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processingMessage, setProcessingMessage] = useState('');
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    duplicates: 0
  });
  
  // Lista de bancos suportados
  const supportedBanks = [
    { id: 'bb', name: 'Banco do Brasil' },
    { id: 'bradesco', name: 'Bradesco' },
    { id: 'itau', name: 'Itaú' },
    { id: 'santander', name: 'Santander' },
    { id: 'caixa', name: 'Caixa Econômica Federal' },
    { id: 'nubank', name: 'Nubank' },
    { id: 'inter', name: 'Banco Inter' },
    { id: 'other', name: 'Outro Banco' }
  ];

  // Filtrar contas do banco selecionado
  const bankAccounts = payerAccounts.filter(account => {
    if (!selectedBank) return false;
    if (selectedBank === 'other') return true;
    return account.bankName.toLowerCase().includes(selectedBank.toLowerCase());
  });

  // Manipular seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Determinar formato com base na extensão
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv') setFileFormat('csv');
      else if (extension === 'ofx') setFileFormat('ofx');
      else if (extension === 'qif') setFileFormat('qif');
      else if (extension === 'xlsx' || extension === 'xls') setFileFormat('xlsx');
      else if (extension === 'pdf') setFileFormat('pdf');
    }
  };

  // Processar importação
  const handleImport = () => {
    if (!selectedAccount || !selectedFile) {
      setProcessingStatus('error');
      setProcessingMessage('Selecione uma conta e um arquivo para importar');
      return;
    }
    
    setIsProcessing(true);
    setProcessingStatus('processing');
    setProcessingMessage('Processando arquivo...');
    
    // Simular processamento
    setTimeout(() => {
      // Simular sucesso
      setProcessingStatus('success');
      setProcessingMessage('Importação concluída com sucesso!');
      setImportStats({
        total: 42,
        success: 38,
        failed: 2,
        duplicates: 2
      });
      setIsProcessing(false);
      
      // Notificar o usuário
      addNotification({
        title: 'Extrato bancário importado',
        message: `38 transações importadas com sucesso de ${selectedFile.name}`,
        type: 'success',
        relatedEntityType: 'financial_account',
        actionUrl: '/financial-reconciliation'
      });
    }, 2000);
  };

  // Baixar modelo de CSV
  const handleDownloadTemplate = () => {
    // Criar conteúdo CSV
    const csvContent = `Data,Descrição,Valor,Tipo,Referência
01/05/2023,Pagamento Fornecedor XYZ,1500.00,debit,NF12345
05/05/2023,Recebimento Cliente ABC,2000.00,credit,Contrato789
10/05/2023,Transferência para Conta Principal,500.00,debit,
15/05/2023,Depósito em Dinheiro,1000.00,credit,`;
    
    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_extrato_bancario.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-b3x-navy-800 to-b3x-navy-900 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Importar Extrato Bancário</h2>
            <p className="text-b3x-navy-200 text-sm mt-1">
              Importe extratos bancários de diversos formatos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-b3x-navy-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Seleção de Banco e Conta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Banco
              </label>
              <select
                value={selectedBank}
                onChange={(e) => {
                  setSelectedBank(e.target.value);
                  setSelectedAccount(''); // Resetar conta ao mudar de banco
                }}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
              >
                <option value="">Selecione o banco</option>
                {supportedBanks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Conta Bancária
              </label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-b3x-navy-500 focus:border-transparent"
                disabled={!selectedBank}
              >
                <option value="">Selecione a conta</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.bankAccount}>
                    {account.name} - {account.bankAccount}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Formatos Suportados */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <h3 className="font-medium text-b3x-navy-900 mb-3 text-sm">Formatos Suportados</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <label className={`p-3 border-2 rounded-lg cursor-pointer text-center ${
                fileFormat === 'csv' 
                  ? 'border-b3x-navy-300 bg-b3x-navy-50' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="fileFormat"
                  value="csv"
                  checked={fileFormat === 'csv'}
                  onChange={() => setFileFormat('csv')}
                  className="sr-only"
                />
                <div className="font-medium text-b3x-navy-900 text-sm mb-1">CSV</div>
                <div className="text-xs text-neutral-600">Texto separado por vírgulas</div>
              </label>
              
              <label className={`p-3 border-2 rounded-lg cursor-pointer text-center ${
                fileFormat === 'ofx' 
                  ? 'border-b3x-navy-300 bg-b3x-navy-50' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="fileFormat"
                  value="ofx"
                  checked={fileFormat === 'ofx'}
                  onChange={() => setFileFormat('ofx')}
                  className="sr-only"
                />
                <div className="font-medium text-b3x-navy-900 text-sm mb-1">OFX</div>
                <div className="text-xs text-neutral-600">Open Financial Exchange</div>
              </label>
              
              <label className={`p-3 border-2 rounded-lg cursor-pointer text-center ${
                fileFormat === 'qif' 
                  ? 'border-b3x-navy-300 bg-b3x-navy-50' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="fileFormat"
                  value="qif"
                  checked={fileFormat === 'qif'}
                  onChange={() => setFileFormat('qif')}
                  className="sr-only"
                />
                <div className="font-medium text-b3x-navy-900 text-sm mb-1">QIF</div>
                <div className="text-xs text-neutral-600">Quicken Interchange Format</div>
              </label>
              
              <label className={`p-3 border-2 rounded-lg cursor-pointer text-center ${
                fileFormat === 'xlsx' 
                  ? 'border-b3x-navy-300 bg-b3x-navy-50' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="fileFormat"
                  value="xlsx"
                  checked={fileFormat === 'xlsx'}
                  onChange={() => setFileFormat('xlsx')}
                  className="sr-only"
                />
                <div className="font-medium text-b3x-navy-900 text-sm mb-1">Excel</div>
                <div className="text-xs text-neutral-600">XLSX/XLS</div>
              </label>
              
              <label className={`p-3 border-2 rounded-lg cursor-pointer text-center ${
                fileFormat === 'pdf' 
                  ? 'border-b3x-navy-300 bg-b3x-navy-50' 
                  : 'border-neutral-200 hover:border-neutral-300'
              }`}>
                <input
                  type="radio"
                  name="fileFormat"
                  value="pdf"
                  checked={fileFormat === 'pdf'}
                  onChange={() => setFileFormat('pdf')}
                  className="sr-only"
                />
                <div className="font-medium text-b3x-navy-900 text-sm mb-1">PDF</div>
                <div className="text-xs text-neutral-600">Extrato em PDF</div>
              </label>
            </div>
            
            {/* Informações do formato selecionado */}
            <div className="mt-3 p-3 bg-info-50 rounded-lg border border-info-200">
              <div className="flex items-center space-x-2 mb-1">
                <Info className="w-3 h-3 text-info-600" />
                <span className="font-medium text-info-700 text-xs">Informações do Formato</span>
              </div>
              
              {fileFormat === 'csv' && (
                <div className="text-xs text-info-600">
                  <p className="mb-1">
                    Formato CSV deve conter colunas para data, descrição, valor e tipo (crédito/débito).
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="text-info-700 hover:text-info-800 font-medium flex items-center"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Baixar modelo CSV
                  </button>
                </div>
              )}
              
              {fileFormat === 'ofx' && (
                <p className="text-xs text-info-600">
                  Formato OFX é o padrão para extratos bancários. Exporte diretamente do seu banco.
                </p>
              )}
              
              {fileFormat === 'qif' && (
                <p className="text-xs text-info-600">
                  Formato QIF é compatível com softwares financeiros como Quicken.
                </p>
              )}
              
              {fileFormat === 'xlsx' && (
                <p className="text-xs text-info-600">
                  Planilhas Excel devem seguir o mesmo formato do modelo CSV.
                </p>
              )}
              
              {fileFormat === 'pdf' && (
                <p className="text-xs text-info-600">
                  A extração de dados de PDFs pode variar dependendo do formato do banco.
                </p>
              )}
            </div>
          </div>

          {/* Upload de Arquivo */}
          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept={`.${fileFormat}${fileFormat === 'xlsx' ? ',.xls' : ''}`}
              onChange={handleFileChange}
            />
            
            {selectedFile ? (
              <div className="space-y-3">
                <div className="w-12 h-12 bg-b3x-navy-100 rounded-full mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6 text-b3x-navy-600" />
                </div>
                <div>
                  <p className="font-medium text-b3x-navy-900">{selectedFile.name}</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {fileFormat.toUpperCase()}
                  </p>
                </div>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-1.5 text-xs text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Remover
                  </button>
                  <label
                    htmlFor="file-upload"
                    className="px-3 py-1.5 text-xs text-info-600 border border-info-300 bg-info-50 rounded-lg hover:bg-info-100 cursor-pointer transition-colors"
                  >
                    Trocar Arquivo
                  </label>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-neutral-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-neutral-600 mb-2">
                  Arraste e solte seu arquivo {fileFormat.toUpperCase()} aqui
                </p>
                <p className="text-neutral-500 text-sm mb-4">
                  ou
                </p>
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-b3x-navy-800 text-white rounded-lg hover:bg-b3x-navy-900 cursor-pointer transition-colors inline-flex items-center space-x-2"
                >
                  <FileUp className="w-4 h-4" />
                  <span>Selecionar Arquivo</span>
                </label>
              </>
            )}
          </div>

          {/* Configurações Avançadas */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-b3x-navy-900 text-sm flex items-center">
                <Settings className="w-4 h-4 mr-2 text-neutral-600" />
                Configurações Avançadas
              </h3>
              <button
                type="button"
                className="text-xs text-neutral-600 hover:text-neutral-800"
              >
                Expandir
              </button>
            </div>
            
            <div className="text-xs text-neutral-600">
              <p>Configurações avançadas para mapeamento de campos, tratamento de duplicatas e regras de importação.</p>
            </div>
          </div>

          {/* Status de Processamento */}
          {processingStatus !== 'idle' && (
            <div className={`rounded-lg p-4 border ${
              processingStatus === 'processing' ? 'bg-info-50 border-info-200' :
              processingStatus === 'success' ? 'bg-success-50 border-success-200' :
              'bg-error-50 border-error-200'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {processingStatus === 'processing' ? (
                  <RefreshCw className="w-4 h-4 text-info-600 animate-spin" />
                ) : processingStatus === 'success' ? (
                  <Check className="w-4 h-4 text-success-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-error-600" />
                )}
                <h3 className={`font-medium text-sm ${
                  processingStatus === 'processing' ? 'text-info-700' :
                  processingStatus === 'success' ? 'text-success-700' :
                  'text-error-700'
                }`}>
                  {processingStatus === 'processing' ? 'Processando...' :
                   processingStatus === 'success' ? 'Importação Concluída' :
                   'Erro na Importação'}
                </h3>
              </div>
              
              <p className={`text-xs ${
                processingStatus === 'processing' ? 'text-info-600' :
                processingStatus === 'success' ? 'text-success-600' :
                'text-error-600'
              }`}>
                {processingMessage}
              </p>
              
              {processingStatus === 'success' && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded border border-success-200">
                    <div className="font-medium text-success-700">{importStats.total}</div>
                    <div className="text-xs text-neutral-600">Total</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-success-200">
                    <div className="font-medium text-success-700">{importStats.success}</div>
                    <div className="text-xs text-neutral-600">Importados</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-warning-200">
                    <div className="font-medium text-warning-700">{importStats.duplicates}</div>
                    <div className="text-xs text-neutral-600">Duplicados</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-error-200">
                    <div className="font-medium text-error-700">{importStats.failed}</div>
                    <div className="text-xs text-neutral-600">Falhas</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!selectedAccount || !selectedFile || isProcessing}
              className="px-4 py-1.5 bg-gradient-to-r from-b3x-navy-700 to-b3x-navy-800 text-white font-medium rounded-lg hover:from-b3x-navy-800 hover:to-b3x-navy-900 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3" />
                  <span>Importar Extrato</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};