import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, CreditCard, Calendar, FileText, DollarSign, Tag, User, Briefcase, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { BankStatementFormData } from '../../types';

const batchSchema = z.object({
  bankAccount: z.string().min(1, 'Selecione uma conta bancária'),
  type: z.enum(['debit', 'credit']),
  date: z.date({
    required_error: "Data é obrigatória",
    invalid_type_error: "Data inválida"
  }),
  totalAmount: z.number().min(0.01, 'Valor total deve ser maior que 0'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0').max(100, 'Máximo 100 lançamentos por vez'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional()
});

interface BankStatementBatchFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BatchEntry {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  reference?: string;
}

export const BankStatementBatchForm: React.FC<BankStatementBatchFormProps> = ({
  isOpen,
  onClose
}) => {
  const { addBankStatement, payerAccounts, addNotification } = useAppStore();
  const [entries, setEntries] = useState<BatchEntry[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [csvContent, setCsvContent] = useState('');
  const [csvDelimiter, setCsvDelimiter] = useState(',');
  const [csvHasHeader, setCsvHasHeader] = useState(true);
  const [csvMapping, setCsvMapping] = useState({
    date: 0,
    description: 1,
    amount: 2,
    type: 3,
    reference: 4
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<any>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      date: new Date(),
      type: 'debit'
    }
  });

  const watchedType = watch('type');

  // Adicionar uma nova entrada
  const handleAddEntry = (data: any) => {
    const newEntry: BatchEntry = {
      id: Date.now().toString(),
      date: data.date,
      description: data.description,
      amount: data.amount,
      type: data.type,
      reference: data.reference
    };
    
    setEntries([...entries, newEntry]);
    reset({
      date: new Date(),
      type: 'debit'
    });
  };

  // Remover uma entrada
  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  // Processar o CSV
  const handleProcessCsv = () => {
    if (!csvContent.trim()) {
      setValidationErrors(['O conteúdo CSV está vazio']);
      return;
    }

    try {
      // Dividir o conteúdo em linhas
      const lines = csvContent.trim().split('\n');
      
      // Remover o cabeçalho se necessário
      const dataLines = csvHasHeader ? lines.slice(1) : lines;
      
      // Processar cada linha
      const newEntries: BatchEntry[] = [];
      const errors: string[] = [];
      
      dataLines.forEach((line, index) => {
        const rowNumber = csvHasHeader ? index + 2 : index + 1;
        const columns = line.split(csvDelimiter);
        
        // Verificar se a linha tem colunas suficientes
        if (columns.length < 3) {
          errors.push(`Linha ${rowNumber}: Número insuficiente de colunas`);
          return;
        }
        
        try {
          // Extrair dados com base no mapeamento
          const dateStr = columns[csvMapping.date].trim();
          const description = columns[csvMapping.description].trim();
          const amountStr = columns[csvMapping.amount].trim().replace(',', '.');
          const typeStr = columns[csvMapping.type]?.trim().toLowerCase() || '';
          const reference = columns[csvMapping.reference]?.trim() || '';
          
          // Converter data
          let date: Date;
          try {
            // Tentar diferentes formatos de data
            if (dateStr.includes('/')) {
              const [day, month, year] = dateStr.split('/');
              date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else if (dateStr.includes('-')) {
              date = new Date(dateStr);
            } else {
              throw new Error('Formato de data inválido');
            }
            
            if (isNaN(date.getTime())) {
              throw new Error('Data inválida');
            }
          } catch (e) {
            errors.push(`Linha ${rowNumber}: Data inválida "${dateStr}"`);
            return;
          }
          
          // Converter valor
          let amount: number;
          try {
            amount = parseFloat(amountStr);
            if (isNaN(amount) || amount <= 0) {
              throw new Error('Valor inválido');
            }
          } catch (e) {
            errors.push(`Linha ${rowNumber}: Valor inválido "${amountStr}"`);
            return;
          }
          
          // Determinar tipo
          let type: 'debit' | 'credit';
          if (typeStr === 'debit' || typeStr === 'débito' || typeStr === 'd') {
            type = 'debit';
          } else if (typeStr === 'credit' || typeStr === 'crédito' || typeStr === 'c') {
            type = 'credit';
          } else {
            // Se o tipo não for especificado, usar o sinal do valor
            type = amountStr.startsWith('-') ? 'debit' : 'credit';
          }
          
          // Adicionar entrada
          newEntries.push({
            id: `csv-${rowNumber}`,
            date,
            description,
            amount: Math.abs(amount), // Garantir que o valor seja positivo
            type,
            reference
          });
        } catch (e) {
          errors.push(`Linha ${rowNumber}: Erro ao processar - ${e}`);
        }
      });
      
      // Atualizar estado
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setEntries([...entries, ...newEntries]);
        setCsvContent('');
        setValidationErrors([]);
      }
    } catch (e) {
      setValidationErrors([`Erro ao processar CSV: ${e}`]);
    }
  };

  // Validar e salvar todas as entradas
  const handleSaveAll = () => {
    if (!selectedBankAccount) {
      setValidationErrors(['Selecione uma conta bancária']);
      return;
    }
    
    if (entries.length === 0) {
      setValidationErrors(['Adicione pelo menos uma entrada']);
      return;
    }
    
    setIsValidating(true);
    setValidationErrors([]);
    
    // Simular validação
    setTimeout(() => {
      // Adicionar cada entrada como um extrato bancário
      entries.forEach(entry => {
        // Ajustar o valor com base no tipo (débito deve ser negativo)
        const adjustedAmount = entry.type === 'debit' ? -Math.abs(entry.amount) : Math.abs(entry.amount);
        
        addBankStatement({
          bankAccount: selectedBankAccount,
          date: entry.date,
          description: entry.description,
          amount: adjustedAmount,
          type: entry.type,
          reference: entry.reference,
          balance: 0, // Seria calculado em uma implementação real
          reconciled: false
        });
      });
      
      // Notificar o usuário
      addNotification({
        title: 'Lançamentos em lote registrados',
        message: `${entries.length} lançamentos bancários foram registrados com sucesso.`,
        type: 'success',
        relatedEntityType: 'financial_account',
        actionUrl: '/financial-reconciliation'
      });
      
      setIsValidating(false);
      setEntries([]);
      setSelectedBankAccount('');
      onClose();
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-soft-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-gradient-to-r from-info-500 to-info-600 text-white rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold">Lançamentos Bancários em Lote</h2>
            <p className="text-info-100 text-sm mt-1">
              Adicione múltiplas movimentações bancárias de uma vez
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-info-400 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Seleção de Conta Bancária */}
          <div className="bg-info-50 rounded-xl p-4 border border-info-200">
            <label className="block text-sm font-medium text-info-800 mb-2 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-info-600" />
              Conta Bancária *
            </label>
            <select
              value={selectedBankAccount}
              onChange={(e) => setSelectedBankAccount(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-info-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-info-500 bg-white"
            >
              <option value="">Selecione a conta bancária</option>
              {payerAccounts.map(account => (
                <option key={account.id} value={account.bankAccount}>
                  {account.name} - {account.bankName} ({account.bankAccount})
                </option>
              ))}
            </select>
          </div>

          {/* Tabs: Manual ou CSV */}
          <div className="border-b border-neutral-200">
            <div className="flex">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium border-b-2 border-info-500 text-info-600"
              >
                Entrada Manual
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
              >
                Importar CSV
              </button>
            </div>
          </div>

          {/* Formulário de Entrada Manual */}
          <form onSubmit={handleSubmit(handleAddEntry)} className="space-y-4">
            {/* Date and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                  <Calendar className="w-3 h-3 mr-1 text-neutral-500" />
                  Data da Movimentação *
                </label>
                <input
                  type="date"
                  {...register('date', { valueAsDate: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                />
                {errors.date && (
                  <p className="text-error-500 text-xs mt-1">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                  <DollarSign className="w-3 h-3 mr-1 text-neutral-500" />
                  Tipo de Movimentação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center justify-center space-x-2 p-2 border rounded-lg cursor-pointer ${
                    watchedType === 'credit' 
                      ? 'border-success-300 bg-success-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}>
                    <input
                      type="radio"
                      {...register('type')}
                      value="credit"
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border ${
                      watchedType === 'credit' 
                        ? 'border-success-500 bg-success-500' 
                        : 'border-neutral-300'
                    }`}>
                      {watchedType === 'credit' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <span className="text-sm">Entrada</span>
                  </label>
                  
                  <label className={`flex items-center justify-center space-x-2 p-2 border rounded-lg cursor-pointer ${
                    watchedType === 'debit' 
                      ? 'border-error-300 bg-error-50' 
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}>
                    <input
                      type="radio"
                      {...register('type')}
                      value="debit"
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border ${
                      watchedType === 'debit' 
                        ? 'border-error-500 bg-error-500' 
                        : 'border-neutral-300'
                    }`}>
                      {watchedType === 'debit' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <span className="text-sm">Saída</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Description and Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                  <FileText className="w-3 h-3 mr-1 text-neutral-500" />
                  Descrição *
                </label>
                <input
                  type="text"
                  {...register('description')}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  placeholder="Ex: Pagamento Fornecedor XYZ"
                />
                {errors.description && (
                  <p className="text-error-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                  <DollarSign className="w-3 h-3 mr-1 text-neutral-500" />
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  placeholder="Ex: 1500.00"
                />
                {errors.amount && (
                  <p className="text-error-500 text-xs mt-1">{errors.amount.message}</p>
                )}
              </div>
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center">
                <FileText className="w-3 h-3 mr-1 text-neutral-500" />
                Referência/Documento
              </label>
              <input
                type="text"
                {...register('reference')}
                className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                placeholder="Ex: NF 12345, Contrato 789"
              />
            </div>

            {/* Botão Adicionar */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 bg-info-500 text-white font-medium rounded-lg hover:bg-info-600 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar à Lista</span>
              </button>
            </div>
          </form>

          {/* Alternativa: Importação CSV */}
          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <h3 className="font-medium text-b3x-navy-900 mb-3 text-sm flex items-center">
              <Upload className="w-4 h-4 mr-2 text-neutral-600" />
              Importação em Lote via CSV
            </h3>
            
            <div className="space-y-3">
              {/* Configurações de Importação */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Delimitador
                  </label>
                  <select
                    value={csvDelimiter}
                    onChange={(e) => setCsvDelimiter(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  >
                    <option value=",">Vírgula (,)</option>
                    <option value=";">Ponto e vírgula (;)</option>
                    <option value="\t">Tab</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Primeira Linha
                  </label>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={csvHasHeader}
                        onChange={() => setCsvHasHeader(true)}
                        className="rounded border-neutral-300 text-info-600 focus:ring-info-500"
                      />
                      <span className="text-xs">Cabeçalho</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={!csvHasHeader}
                        onChange={() => setCsvHasHeader(false)}
                        className="rounded border-neutral-300 text-info-600 focus:ring-info-500"
                      />
                      <span className="text-xs">Dados</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Processar
                  </label>
                  <button
                    type="button"
                    onClick={handleProcessCsv}
                    className="w-full px-3 py-2 bg-info-500 text-white text-xs rounded-lg hover:bg-info-600 transition-colors"
                  >
                    Processar CSV
                  </button>
                </div>
              </div>
              
              {/* Mapeamento de Colunas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Data
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={csvMapping.date}
                    onChange={(e) => setCsvMapping({...csvMapping, date: parseInt(e.target.value)})}
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={csvMapping.description}
                    onChange={(e) => setCsvMapping({...csvMapping, description: parseInt(e.target.value)})}
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={csvMapping.amount}
                    onChange={(e) => setCsvMapping({...csvMapping, amount: parseInt(e.target.value)})}
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Tipo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={csvMapping.type}
                    onChange={(e) => setCsvMapping({...csvMapping, type: parseInt(e.target.value)})}
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Referência
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={csvMapping.reference}
                    onChange={(e) => setCsvMapping({...csvMapping, reference: parseInt(e.target.value)})}
                    className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Área de texto para colar CSV */}
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={5}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-info-500 focus:border-transparent font-mono"
                placeholder="Cole o conteúdo CSV aqui..."
              />
              
              {/* Exemplo de formato */}
              <div className="text-xs text-neutral-500">
                <p className="font-medium mb-1">Exemplo de formato:</p>
                <code className="bg-neutral-100 p-1 rounded">
                  Data,Descrição,Valor,Tipo,Referência<br />
                  01/05/2023,Pagamento Fornecedor,1500.00,debit,NF12345<br />
                  05/05/2023,Recebimento Cliente,2000.00,credit,Contrato789
                </code>
              </div>
            </div>
          </div>

          {/* Lista de Entradas */}
          {entries.length > 0 && (
            <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              <div className="p-3 bg-neutral-50 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-medium text-b3x-navy-900 text-sm">Lançamentos a Processar ({entries.length})</h3>
                <button
                  type="button"
                  onClick={() => setEntries([])}
                  className="text-xs text-error-600 hover:text-error-800"
                >
                  Limpar Lista
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Data</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Descrição</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Valor</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Tipo</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Referência</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-600">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          {format(entry.date, 'dd/MM/yyyy')}
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700 max-w-xs truncate">
                          {entry.description}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-neutral-700">
                          R$ {entry.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            entry.type === 'credit' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
                          }`}>
                            {entry.type === 'credit' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          {entry.reference || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          <button
                            type="button"
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="p-1 text-error-600 hover:text-error-800 hover:bg-error-50 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Resumo */}
              <div className="p-3 bg-neutral-50 border-t border-neutral-200">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-neutral-600">
                    <span className="font-medium">Total:</span> {entries.length} lançamentos
                  </div>
                  <div className="text-xs">
                    <span className="text-success-600 font-medium">
                      Entradas: R$ {entries
                        .filter(e => e.type === 'credit')
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="mx-2">|</span>
                    <span className="text-error-600 font-medium">
                      Saídas: R$ {entries
                        .filter(e => e.type === 'debit')
                        .reduce((sum, e) => sum + e.amount, 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Erros de Validação */}
          {validationErrors.length > 0 && (
            <div className="bg-error-50 rounded-lg p-3 border border-error-200">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-error-600" />
                <h3 className="font-medium text-error-700 text-sm">Erros de Validação</h3>
              </div>
              <ul className="space-y-1 text-xs text-error-600 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
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
              onClick={handleSaveAll}
              disabled={entries.length === 0 || !selectedBankAccount || isValidating}
              className="px-4 py-1.5 bg-gradient-to-r from-info-500 to-info-600 text-white font-medium rounded-lg hover:from-info-600 hover:to-info-700 transition-all duration-200 shadow-soft flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isValidating ? (
                <>
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3" />
                  <span>Salvar {entries.length} Lançamentos</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};