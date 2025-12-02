import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Exporta dados para Excel
 * @param data Array de objetos com os dados a serem exportados
 * @param filename Nome do arquivo (sem extensão)
 * @param sheetName Nome da planilha
 */
export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Dados') => {
  try {
    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gerar arquivo e fazer download
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss', { locale: ptBR });
    XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);

    return { success: true, message: 'Arquivo exportado com sucesso!' };
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return { success: false, message: 'Erro ao exportar arquivo' };
  }
};

/**
 * Exporta múltiplas planilhas para Excel
 * @param sheets Array de objetos com { data, sheetName }
 * @param filename Nome do arquivo (sem extensão)
 */
export const exportMultipleSheets = (
  sheets: Array<{ data: any[]; sheetName: string }>,
  filename: string
) => {
  try {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(({ data, sheetName }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss', { locale: ptBR });
    XLSX.writeFile(workbook, `${filename}_${timestamp}.xlsx`);

    return { success: true, message: 'Arquivo exportado com sucesso!' };
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    return { success: false, message: 'Erro ao exportar arquivo' };
  }
};

/**
 * Exporta dados para CSV
 * @param data Array de objetos com os dados a serem exportados
 * @param filename Nome do arquivo (sem extensão)
 */
export const exportToCSV = (data: any[], filename: string) => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss', { locale: ptBR });
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${timestamp}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'Arquivo CSV exportado com sucesso!' };
  } catch (error) {
    console.error('Erro ao exportar para CSV:', error);
    return { success: false, message: 'Erro ao exportar arquivo CSV' };
  }
};

/**
 * Formata data para exportação
 */
export const formatDateForExport = (date: any): string => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return '';
  }
};

/**
 * Formata valor monetário para exportação
 */
export const formatCurrencyForExport = (value: any): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  const numValue = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(numValue)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

/**
 * Formata peso para exportação
 */
export const formatWeightForExport = (weight: any): string => {
  if (weight === null || weight === undefined) return '0 kg';
  const numValue = typeof weight === 'number' ? weight : parseFloat(weight);
  if (isNaN(numValue)) return '0 kg';
  return `${numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
};
