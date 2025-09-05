import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { dataImportApi } from '@/services/api/dataImport';
import { useToast } from '@/components/ui/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  Eye,
  Database,
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Weight,
  Users,
  Loader2,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  ChevronRight
} from 'lucide-react';
import { formatSafeCurrency, formatSafeNumber } from '@/utils/dateUtils';
import { usePartnersApi } from '@/hooks/api/usePartnersApi';
import { usePayerAccountsApi } from '@/hooks/api/usePayerAccountsApi';
import { toast } from 'sonner';
import { apiClient } from '@/services/api/apiClient';

// Tipo para dados importados
interface ImportedPurchase {
  // Dados básicos
  lotCode: string;
  purchaseDate: string;
  state: string;
  city?: string;
  farm?: string;
  
  // Fornecedor
  vendorName: string;
  vendorCPF?: string;
  
  // Animais
  initialQuantity: number;
  purchaseWeight: number;
  averageWeight?: number;
  animalType?: 'MALE' | 'FEMALE';
  animalAge?: number;
  carcassYield?: number;
  
  // Valores
  pricePerArroba: number;
  purchaseValue: number;
  freightCost?: number;
  commission?: number;
  
  // Pagamento
  paymentType?: 'CASH' | 'INSTALLMENTS' | 'BOLETO';
  principalDueDate?: string;
  
  // Corretor (opcional)
  brokerName?: string;
  brokerCPF?: string;
  
  // Transportadora (opcional)
  transportCompanyName?: string;
  transportCompanyCNPJ?: string;
  freightDistance?: number;
  
  // Validação
  isValid?: boolean;
  errors?: string[];
}

// Template de exemplo
const TEMPLATE_DATA = [
  {
    'Data da Compra*': '01/01/2025',
    'Estado*': 'MS',
    'Cidade': 'Campo Grande',
    'Fazenda': 'Fazenda São João',
    'Nome do Fornecedor*': 'João Silva',
    'CPF/CNPJ Fornecedor': '123.456.789-00',
    'Quantidade de Animais*': 100,
    'Peso Total (kg)*': 45000,
    'Peso Médio (kg)': 450,
    'Rendimento de Carcaça (%)*': 50,
    'Tipo de Animal': 'MACHO',
    'Idade (meses)': 24,
    'Preço por Arroba (R$)*': 320,
    'Valor da Compra (R$)*': 480000,
    'Valor do Frete (R$)': 15000,
    'Comissão (R$)': 9600,
    'Tipo de Pagamento': 'À VISTA',
    'Data de Vencimento': '31/01/2025',
    'Nome do Corretor': 'Pedro Santos',
    'CPF Corretor': '987.654.321-00',
    'Transportadora': 'Transporte Rápido LTDA',
    'CNPJ Transportadora': '12.345.678/0001-00',
    'Distância do Frete (km)': 500
  },
  {
    'Data da Compra*': '05/01/2025',
    'Estado*': 'MT',
    'Cidade': 'Cuiabá',
    'Fazenda': 'Fazenda Esperança',
    'Nome do Fornecedor*': 'Maria Oliveira',
    'CPF/CNPJ Fornecedor': '234.567.890-00',
    'Quantidade de Animais*': 150,
    'Peso Total (kg)*': 67500,
    'Peso Médio (kg)': 450,
    'Rendimento de Carcaça (%)*': 50,
    'Tipo de Animal': 'MACHO',
    'Idade (meses)': 26,
    'Preço por Arroba (R$)*': 315,
    'Valor da Compra (R$)*': 708750,
    'Valor do Frete (R$)': 22500,
    'Comissão (R$)': 14175,
    'Tipo de Pagamento': 'PARCELADO',
    'Data de Vencimento': '05/02/2025',
    'Nome do Corretor': 'Carlos Mendes',
    'CPF Corretor': '876.543.210-00',
    'Transportadora': 'Logística Central',
    'CNPJ Transportadora': '98.765.432/0001-00',
    'Distância do Frete (km)': 750
  }
];

export function DataImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedPurchase[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  
  // Buscar dados existentes
  const { partners } = usePartnersApi();
  const { payerAccounts } = usePayerAccountsApi();

  // Função para download do template
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(TEMPLATE_DATA);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    
    // Adicionar largura às colunas
    const colWidths = [
      { wch: 15 }, // Data da Compra
      { wch: 10 }, // Estado
      { wch: 20 }, // Cidade
      { wch: 25 }, // Fazenda
      { wch: 25 }, // Nome do Fornecedor
      { wch: 20 }, // CPF/CNPJ
      { wch: 20 }, // Quantidade
      { wch: 15 }, // Peso Total
      { wch: 15 }, // Peso Médio
      { wch: 20 }, // Rendimento de Carcaça
      { wch: 15 }, // Tipo Animal
      { wch: 15 }, // Idade
      { wch: 20 }, // Preço Arroba
      { wch: 20 }, // Valor Compra
      { wch: 15 }, // Frete
      { wch: 15 }, // Comissão
      { wch: 15 }, // Tipo Pagamento
      { wch: 15 }, // Vencimento
      { wch: 20 }, // Corretor
      { wch: 15 }, // CPF Corretor
      { wch: 25 }, // Transportadora
      { wch: 20 }, // CNPJ
      { wch: 15 }, // Distância
    ];
    ws['!cols'] = colWidths;
    
    XLSX.writeFile(wb, 'template_importacao_gado.xlsx');
    toast.success('Template baixado com sucesso!');
  };

  // Função para processar arquivo
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setValidationErrors([]);

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let jsonData: any[] = [];

        if (uploadedFile.name.endsWith('.csv')) {
          // Processar CSV
          Papa.parse(data as string, {
            header: true,
            complete: (results) => {
              jsonData = results.data;
              processImportedData(jsonData);
            },
            error: (error) => {
              toast.error(`Erro ao processar CSV: ${error.message}`);
              setIsProcessing(false);
            }
          });
        } else {
          // Processar Excel
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet);
          processImportedData(jsonData);
        }
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast.error('Erro ao processar arquivo');
        setIsProcessing(false);
      }
    };

    if (uploadedFile.name.endsWith('.csv')) {
      reader.readAsText(uploadedFile);
    } else {
      reader.readAsBinaryString(uploadedFile);
    }
  }, []);

  // Processar e validar dados importados
  const processImportedData = (rawData: any[]) => {
    const processed: ImportedPurchase[] = [];
    const errors: string[] = [];

    rawData.forEach((row, index) => {
      if (!row || Object.keys(row).length === 0) return;

      const purchase: ImportedPurchase = {
        // Dados básicos
        lotCode: '', // Será gerado automaticamente pelo sistema
        purchaseDate: parseDate(row['Data da Compra*'] || row['purchaseDate']),
        state: row['Estado*'] || row['state'] || '',
        city: row['Cidade'] || row['city'],
        farm: row['Fazenda'] || row['farm'],
        
        // Fornecedor
        vendorName: row['Nome do Fornecedor*'] || row['vendorName'] || '',
        vendorCPF: row['CPF/CNPJ Fornecedor'] || row['vendorCPF'],
        
        // Animais
        initialQuantity: parseInt(String(row['Quantidade de Animais*'] || row['initialQuantity'] || '0').replace(/\./g, '').replace(',', '.')),
        purchaseWeight: parseNumber(row['Peso Total (kg)*'] || row['purchaseWeight']),
        averageWeight: parseNumber(row['Peso Médio (kg)'] || row['averageWeight']),
        carcassYield: parseNumber(row['Rendimento de Carcaça (%)*'] || row['carcassYield']) || 50,
        animalType: normalizeAnimalType(row['Tipo de Animal'] || row['animalType']),
        animalAge: parseNumber(row['Idade (meses)'] || row['animalAge']),
        
        // Valores
        pricePerArroba: parseNumber(row['Preço por Arroba (R$)*'] || row['pricePerArroba']),
        purchaseValue: parseNumber(row['Valor da Compra (R$)*'] || row['purchaseValue']),
        freightCost: parseNumber(row['Valor do Frete (R$)'] || row['freightCost']),
        commission: parseNumber(row['Comissão (R$)'] || row['commission']),
        
        // Pagamento
        paymentType: normalizePaymentType(row['Tipo de Pagamento'] || row['paymentType']),
        principalDueDate: parseDate(row['Data de Vencimento'] || row['principalDueDate']),
        
        // Corretor
        brokerName: row['Nome do Corretor'] || row['brokerName'],
        brokerCPF: row['CPF Corretor'] || row['brokerCPF'],
        
        // Transportadora
        transportCompanyName: row['Transportadora'] || row['transportCompanyName'],
        transportCompanyCNPJ: row['CNPJ Transportadora'] || row['transportCompanyCNPJ'],
        freightDistance: parseNumber(row['Distância do Frete (km)'] || row['freightDistance']),
        
        isValid: true,
        errors: []
      };

      // Validações
      const rowErrors: string[] = [];
      
      // Código do lote será gerado automaticamente, não precisa validar
      
      // Validar data
      if (!purchase.purchaseDate) {
        const originalDate = row['Data da Compra*'] || row['purchaseDate'];
        if (originalDate) {
          rowErrors.push(`Data inválida: "${originalDate}" - Use formato DD/MM/AAAA`);
        } else {
          rowErrors.push('Data da compra é obrigatória');
        }
      } else {
        // Validar se a data não é futura
        const purchaseDate = new Date(purchase.purchaseDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (purchaseDate > today) {
          rowErrors.push('Data da compra não pode ser futura');
        }
      }
      
      // Validar estado
      if (!purchase.state) {
        rowErrors.push('Estado é obrigatório');
      } else if (purchase.state.length !== 2) {
        rowErrors.push(`Estado inválido: "${purchase.state}" - Use sigla com 2 letras (ex: MS, MT, GO)`);
      }
      
      // Validar fornecedor
      console.log('Debug vendorName:', { 
        raw: row['Nome do Fornecedor*'], 
        parsed: purchase.vendorName,
        type: typeof purchase.vendorName 
      });
      if (!purchase.vendorName) {
        rowErrors.push('Nome do fornecedor é obrigatório');
      } else if (purchase.vendorName.length < 3) {
        rowErrors.push('Nome do fornecedor deve ter pelo menos 3 caracteres');
      }
      
      // Validar quantidade
      if (purchase.initialQuantity <= 0) {
        rowErrors.push(`Quantidade inválida: ${purchase.initialQuantity} - Deve ser maior que zero`);
      } else if (purchase.initialQuantity > 10000) {
        rowErrors.push(`Quantidade suspeita: ${purchase.initialQuantity} - Verifique se está correto`);
      }
      
      // Validar peso
      if (purchase.purchaseWeight <= 0) {
        rowErrors.push(`Peso total inválido: ${purchase.purchaseWeight}kg - Deve ser maior que zero`);
      }
      
      // Validar rendimento de carcaça
      console.log('Debug carcassYield:', { 
        raw: row['Rendimento de Carcaça (%)*'], 
        parsed: purchase.carcassYield,
        type: typeof purchase.carcassYield 
      });
      if (!purchase.carcassYield || purchase.carcassYield <= 0 || purchase.carcassYield > 100) {
        rowErrors.push(`Rendimento de carcaça inválido: ${purchase.carcassYield}% - Deve estar entre 1% e 100%`);
      }
      
      if (purchase.averageWeight > 0) {
        // Validar coerência entre peso total e médio
        const calculatedAvg = purchase.purchaseWeight / purchase.initialQuantity;
        const diff = Math.abs(calculatedAvg - purchase.averageWeight);
        if (diff > 50) { // Diferença maior que 50kg
          rowErrors.push(`Peso médio inconsistente: total/${purchase.initialQuantity} = ${calculatedAvg.toFixed(1)}kg, informado = ${purchase.averageWeight}kg`);
        }
      }
      
      // Validar preço
      if (purchase.pricePerArroba <= 0) {
        rowErrors.push(`Preço por arroba inválido: R$ ${purchase.pricePerArroba} - Deve ser maior que zero`);
      } else if (purchase.pricePerArroba < 100 || purchase.pricePerArroba > 500) {
        rowErrors.push(`Preço por arroba suspeito: R$ ${purchase.pricePerArroba} - Verifique se está correto`);
      }
      
      // Validar valor total
      if (purchase.purchaseValue <= 0) {
        rowErrors.push(`Valor da compra inválido: R$ ${purchase.purchaseValue} - Deve ser maior que zero`);
      } else {
        // Validar coerência do valor total considerando rendimento de carcaça
        const pesoCarcaca = (purchase.purchaseWeight * (purchase.carcassYield || 50)) / 100;
        const pesoArrobas = pesoCarcaca / 15; // 1 arroba = 15kg
        const valorCalculado = pesoArrobas * purchase.pricePerArroba;
        const diff = Math.abs(valorCalculado - purchase.purchaseValue);
        const percentualDiff = (diff / valorCalculado) * 100;
        
        // Só mostra erro se a diferença for maior que 1% do valor calculado
        if (percentualDiff > 1) { 
          rowErrors.push(`Valor total inconsistente: ${pesoArrobas.toFixed(2)}@ x R$${purchase.pricePerArroba} = R$${valorCalculado.toFixed(2)}, informado = R$${purchase.purchaseValue.toFixed(2)} (diferença de ${percentualDiff.toFixed(1)}%)`);
        }
      }
      
      // Validar valores opcionais negativos
      if (purchase.freightCost && purchase.freightCost < 0) {
        rowErrors.push('Valor do frete não pode ser negativo');
      }
      
      if (purchase.commission && purchase.commission < 0) {
        rowErrors.push('Comissão não pode ser negativa');
      }

      if (rowErrors.length > 0) {
        purchase.isValid = false;
        purchase.errors = rowErrors;
        errors.push(`Linha ${index + 2}: ${rowErrors.join(', ')}`);
      }

      processed.push(purchase);
    });

    setImportedData(processed);
    setValidationErrors(errors);
    setIsProcessing(false);
    
    if (processed.length > 0) {
      setImportStep('preview');
      // Selecionar todas as linhas válidas por padrão
      const validIndexes = processed
        .map((item, index) => item.isValid ? index : null)
        .filter(index => index !== null) as number[];
      setSelectedRows(new Set(validIndexes));
    }
  };

  // Funções auxiliares
  const parseNumber = (value: any): number => {
    if (!value && value !== 0) return 0;
    
    // Se já for um número, retornar direto
    if (typeof value === 'number') return value;
    
    // Converter para string
    let str = String(value).trim();
    
    // Remover símbolo de moeda e espaços
    str = str.replace(/R\$/g, '').replace(/\s/g, '').trim();
    
    // Detectar formato: brasileiro (1.234,56) ou americano (1,234.56)
    const hasComma = str.includes(',');
    const hasDot = str.includes('.');
    
    if (hasComma && hasDot) {
      // Tem ambos - verificar qual é o separador decimal
      const lastComma = str.lastIndexOf(',');
      const lastDot = str.lastIndexOf('.');
      
      if (lastComma > lastDot) {
        // Formato brasileiro: 1.234,56
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato americano: 1,234.56
        str = str.replace(/,/g, '');
      }
    } else if (hasComma && !hasDot) {
      // Só tem vírgula - verificar se é decimal ou milhares
      const parts = str.split(',');
      if (parts.length === 2 && parts[1].length <= 2) {
        // Provavelmente decimal: 295,08
        str = str.replace(',', '.');
      } else {
        // Provavelmente milhares: 1,234
        str = str.replace(/,/g, '');
      }
    }
    // Se só tem ponto, deixa como está (formato americano)
    
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };
  
  const parseDate = (dateStr: any): string => {
    if (!dateStr) return '';
    
    // Verificar se é um número (data serial do Excel)
    if (typeof dateStr === 'number' || /^\d{5,6}$/.test(String(dateStr))) {
      const excelDate = parseInt(String(dateStr));
      // Excel conta dias desde 1/1/1900, mas tem um bug que conta 29/02/1900
      // JavaScript conta milissegundos desde 1/1/1970
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        // Validar se a data faz sentido
        if (year >= 2020 && year <= 2030) {
          return `${year}-${month}-${day}`;
        }
      }
    }
    
    // Converter para string se não for
    const dateString = String(dateStr).trim();
    
    // Tentar diferentes formatos
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY ou D/M/YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        let day, month, year;
        
        if (format === formats[0] || format === formats[2]) {
          // DD/MM/YYYY ou DD-MM-YYYY
          day = match[1].padStart(2, '0');
          month = match[2].padStart(2, '0');
          year = match[3];
        } else {
          // YYYY-MM-DD
          year = match[1];
          month = match[2].padStart(2, '0');
          day = match[3].padStart(2, '0');
        }
        
        // Validar valores
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        const yearNum = parseInt(year);
        
        if (monthNum < 1 || monthNum > 12) return '';
        if (dayNum < 1 || dayNum > 31) return '';
        if (yearNum < 2020 || yearNum > 2030) return '';
        
        return `${year}-${month}-${day}`;
      }
    }
    
    return '';
  };

  const normalizeAnimalType = (type: string | undefined): 'MALE' | 'FEMALE' => {
    if (!type) return 'MALE';
    const normalized = type.toUpperCase();
    if (normalized.includes('FEM') || normalized.includes('F')) return 'FEMALE';
    return 'MALE';
  };

  const normalizePaymentType = (type: string | undefined): 'CASH' | 'INSTALLMENTS' | 'BOLETO' => {
    if (!type) return 'CASH';
    const normalized = type.toUpperCase();
    if (normalized.includes('PARCEL')) return 'INSTALLMENTS';
    if (normalized.includes('BOLETO')) return 'BOLETO';
    return 'CASH';
  };

  // Função para importar dados selecionados
  const handleImport = async () => {
    const selectedData = importedData.filter((_, index) => selectedRows.has(index));
    
    if (selectedData.length === 0) {
      toast.error('Selecione pelo menos uma linha para importar');
      return;
    }

    setIsImporting(true);
    setImportStep('importing');
    setImportProgress(0);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Criar mapa de fornecedores únicos
    const uniqueVendors = [...new Set(selectedData.map(item => item.vendorName).filter(Boolean))];
    const vendorMap = new Map();

    console.log('Criando fornecedores únicos...', uniqueVendors);

    // Criar fornecedores primeiro
    for (let i = 0; i < uniqueVendors.length; i++) {
      const vendorName = uniqueVendors[i];
      try {
        const vendorResponse = await apiClient.post('/partners', {
          name: vendorName.toUpperCase(),
          type: 'VENDOR',
          cpfCnpj: `${12345678900 + i}`, // CPF único
          isActive: true
        });

        if (vendorResponse.id) {
          vendorMap.set(vendorName, vendorResponse.id);
          console.log(`Fornecedor criado: ${vendorName}`);
        }
      } catch (vendorError: any) {
        // Se já existir, tentar buscar
        if (vendorError.message?.includes('já cadastrado')) {
          try {
            const partnersResponse = await apiClient.get('/partners?search=' + encodeURIComponent(vendorName));
            if (partnersResponse.data && partnersResponse.data.length > 0) {
              const existingVendor = partnersResponse.data.find((p: any) => 
                p.name.toUpperCase() === vendorName.toUpperCase() && p.type === 'VENDOR'
              );
              if (existingVendor) {
                vendorMap.set(vendorName, existingVendor.id);
                console.log(`Fornecedor existente encontrado: ${vendorName}`);
              }
            }
          } catch (searchError) {
            console.log(`Erro ao buscar fornecedor ${vendorName}:`, searchError);
          }
        }
      }
    }

    console.log(`${vendorMap.size} fornecedores disponíveis para importação`);

    for (let i = 0; i < selectedData.length; i++) {
      const purchase = selectedData[i];
      
      try {
        // Preparar dados para API
        const payload = {
          lotCode: purchase.lotCode,
          vendorId: vendorMap.get(purchase.vendorName) || payerAccounts[0]?.id,
          vendorName: purchase.vendorName,
          vendorCPF: purchase.vendorCPF,
          location: `${purchase.city || ''}, ${purchase.state}`,
          city: purchase.city,
          state: purchase.state,
          farm: purchase.farm,
          purchaseDate: purchase.purchaseDate,
          animalType: purchase.animalType || 'MALE',
          animalAge: purchase.animalAge,
          initialQuantity: purchase.initialQuantity,
          currentQuantity: purchase.initialQuantity,
          purchaseWeight: purchase.purchaseWeight,
          averageWeight: purchase.averageWeight || (purchase.purchaseWeight / purchase.initialQuantity),
          carcassYield: purchase.carcassYield, // Usa o valor informado na importação
          pricePerArroba: purchase.pricePerArroba,
          purchaseValue: purchase.purchaseValue,
          freightCost: purchase.freightCost || 0,
          commission: purchase.commission || 0,
          paymentType: purchase.paymentType || 'CASH',
          principalDueDate: purchase.principalDueDate,
          brokerName: purchase.brokerName,
          brokerCPF: purchase.brokerCPF,
          transportCompanyName: purchase.transportCompanyName,
          transportCompanyCNPJ: purchase.transportCompanyCNPJ,
          freightDistance: purchase.freightDistance,
          // Usar primeira conta de pagamento disponível
          payerAccountId: payerAccounts[0]?.id || null
        };

        // Enviar para API
        await apiClient.post('/cattle-purchases', payload);
        successCount++;
      } catch (error: any) {
        errorCount++;
        errors.push(`${purchase.lotCode}: ${error.message || 'Erro ao importar'}`);
      }

      // Atualizar progresso
      setImportProgress(((i + 1) / selectedData.length) * 100);
    }

    setIsImporting(false);
    setImportStep('complete');

    // Mostrar resultado
    if (successCount > 0) {
      toast.success(`${successCount} compra(s) importada(s) com sucesso!`);
    }
    
    if (errorCount > 0) {
      toast.error(`${errorCount} erro(s) durante a importação`);
      setValidationErrors(errors);
    }
  };

  // Toggle seleção de linha
  const toggleRowSelection = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  // Selecionar/deselecionar todas
  const toggleSelectAll = () => {
    if (selectedRows.size === importedData.filter(d => d.isValid).length) {
      setSelectedRows(new Set());
    } else {
      const validIndexes = importedData
        .map((item, index) => item.isValid ? index : null)
        .filter(index => index !== null) as number[];
      setSelectedRows(new Set(validIndexes));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Importação de Dados</h2>
          <p className="text-muted-foreground">
            Importe compras de gado em massa através de arquivos Excel ou CSV
          </p>
        </div>
        
        <Button onClick={downloadTemplate} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Baixar Template
        </Button>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${importStep === 'upload' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            importStep === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            1
          </div>
          <span className="font-medium">Upload</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${importStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            importStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            2
          </div>
          <span className="font-medium">Validação</span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
        <div className={`flex items-center gap-2 ${
          importStep === 'importing' || importStep === 'complete' ? 'text-primary' : 'text-muted-foreground'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            importStep === 'importing' || importStep === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            3
          </div>
          <span className="font-medium">Importação</span>
        </div>
      </div>

      {/* Content */}
      {importStep === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivo</CardTitle>
            <CardDescription>
              Selecione um arquivo Excel (.xlsx, .xls) ou CSV com os dados das compras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Formato do arquivo</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• O arquivo deve conter as colunas obrigatórias marcadas com asterisco (*)</li>
                  <li>• Datas devem estar no formato DD/MM/YYYY</li>
                  <li>• Valores monetários devem ser números (sem R$ ou pontos)</li>
                  <li>• Use o template de exemplo como referência</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="space-y-2">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm text-muted-foreground">
                    Arraste um arquivo aqui ou{' '}
                  </span>
                  <span className="text-sm text-primary hover:underline">
                    clique para selecionar
                  </span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {file && (
                <div className="mt-4 p-2 bg-muted rounded-md">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando arquivo...</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {importStep === 'preview' && (
        <div className="space-y-4">
          {/* Erros de validação */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erros de validação encontrados</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 space-y-1 text-sm max-h-40 overflow-y-auto">
                  {validationErrors.slice(0, 5).map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>... e mais {validationErrors.length - 5} erro(s)</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Resumo */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total de Linhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{importedData.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Linhas Válidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {importedData.filter(d => d.isValid).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Linhas com Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {importedData.filter(d => !d.isValid).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Selecionadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedRows.size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview dos Dados</CardTitle>
                  <CardDescription>
                    Revise e selecione as linhas que deseja importar
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedRows.size === importedData.filter(d => d.isValid).length 
                    ? 'Desmarcar Todas' 
                    : 'Selecionar Válidas'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox 
                          checked={selectedRows.size === importedData.filter(d => d.isValid).length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>UF</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Peso (kg)</TableHead>
                      <TableHead className="text-right">R$/@</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Erros</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.map((row, index) => (
                      <TableRow 
                        key={index}
                        className={!row.isValid ? 'bg-red-50 dark:bg-red-950/20' : ''}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={selectedRows.has(index)}
                            onCheckedChange={() => toggleRowSelection(index)}
                            disabled={!row.isValid}
                          />
                        </TableCell>
                        <TableCell>
                          {row.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.lotCode}</TableCell>
                        <TableCell>{row.purchaseDate}</TableCell>
                        <TableCell>{row.vendorName}</TableCell>
                        <TableCell>{row.state}</TableCell>
                        <TableCell className="text-right">{row.initialQuantity}</TableCell>
                        <TableCell className="text-right">
                          {formatSafeNumber(row.purchaseWeight)}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {row.pricePerArroba.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatSafeCurrency(row.purchaseValue)}
                        </TableCell>
                        <TableCell>
                          {row.errors && row.errors.length > 0 && (
                            <span className="text-xs text-red-600">
                              {row.errors[0]}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setImportStep('upload');
                  setFile(null);
                  setImportedData([]);
                  setSelectedRows(new Set());
                }}
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedRows.size === 0}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar {selectedRows.size} linha(s)
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {importStep === 'importing' && (
        <Card>
          <CardHeader>
            <CardTitle>Importando Dados</CardTitle>
            <CardDescription>
              Aguarde enquanto os dados são importados para o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Importando dados...</span>
            </div>
            <Progress value={importProgress} />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(importProgress)}% concluído
            </p>
          </CardContent>
        </Card>
      )}

      {importStep === 'complete' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Importação Concluída
            </CardTitle>
            <CardDescription>
              Os dados foram importados com sucesso para o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Sucesso!</AlertTitle>
              <AlertDescription>
                As compras foram importadas e já estão disponíveis no sistema.
                As despesas foram criadas automaticamente no Centro Financeiro.
              </AlertDescription>
            </Alert>

            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Alguns erros ocorreram</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => {
                setImportStep('upload');
                setFile(null);
                setImportedData([]);
                setSelectedRows(new Set());
                setValidationErrors([]);
                setImportProgress(0);
              }}
            >
              Nova Importação
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}