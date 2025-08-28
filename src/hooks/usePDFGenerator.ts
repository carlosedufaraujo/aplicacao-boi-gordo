import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
}

export const usePDFGenerator = () => {
  const generatePDFFromElement = useCallback(async (
    elementId: string, 
    options: PDFOptions = {}
  ) => {
    const {
      filename = 'relatorio.pdf',
      format = 'a4',
      orientation = 'portrait',
      quality = 1
    } = options;

    try {
      // Encontrar o elemento
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Elemento com ID "${elementId}" não encontrado`);
      }

      // Configurar opções do canvas
      const canvas = await html2canvas(element, {
        scale: quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight
      });

      // Configurar dimensões do PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF(orientation, 'mm', format);
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // Adicionar imagem ao PDF
      pdf.addImage(
        imgData, 
        'PNG', 
        imgX, 
        imgY, 
        imgWidth * ratio, 
        imgHeight * ratio
      );

      // Salvar PDF
      pdf.save(filename);
      
      return { success: true, message: 'PDF gerado com sucesso!' };
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, []);

  const generatePDFFromData = useCallback(async (
    data: any[], 
    title: string,
    options: PDFOptions = {}
  ) => {
    const {
      filename = 'relatorio-dados.pdf',
      format = 'a4',
      orientation = 'portrait'
    } = options;

    try {
      const pdf = new jsPDF(orientation, 'mm', format);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let yPosition = 20;
      const lineHeight = 7;
      const margin = 20;

      // Título
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Data de geração
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Dados
      pdf.setFontSize(12);
      data.forEach((item, index) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        // Renderizar item
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            const text = `${key}: ${value}`;
            pdf.text(text, margin, yPosition);
            yPosition += lineHeight;
          });
          yPosition += lineHeight; // Espaço entre itens
        } else {
          pdf.text(String(item), margin, yPosition);
          yPosition += lineHeight;
        }
      });

      // Salvar PDF
      pdf.save(filename);
      
      return { success: true, message: 'PDF gerado com sucesso!' };
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, []);

  const generateReportPDF = useCallback(async (
    reportData: {
      title: string;
      subtitle?: string;
      data: any[];
      columns: { key: string; label: string; width?: number }[];
      summary?: { [key: string]: any };
    },
    options: PDFOptions = {}
  ) => {
    const {
      filename = 'relatorio.pdf',
      format = 'a4',
      orientation = 'landscape'
    } = options;

    try {
      const pdf = new jsPDF(orientation, 'mm', format);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let yPosition = 20;
      const lineHeight = 6;
      const margin = 15;

      // Cabeçalho
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(reportData.title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      if (reportData.subtitle) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(reportData.subtitle, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight * 2;
      }

      // Data de geração
      pdf.setFontSize(10);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, yPosition);
      yPosition += lineHeight * 2;

      // Cabeçalho da tabela
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      
      let xPosition = margin;
      const columnWidth = (pageWidth - margin * 2) / reportData.columns.length;
      
      reportData.columns.forEach((column) => {
        pdf.text(column.label, xPosition, yPosition);
        xPosition += column.width || columnWidth;
      });
      
      // Linha separadora
      yPosition += lineHeight;
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += lineHeight;

      // Dados da tabela
      pdf.setFont('helvetica', 'normal');
      
      reportData.data.forEach((row) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
          
          // Recriar cabeçalho da tabela na nova página
          pdf.setFont('helvetica', 'bold');
          xPosition = margin;
          reportData.columns.forEach((column) => {
            pdf.text(column.label, xPosition, yPosition);
            xPosition += column.width || columnWidth;
          });
          yPosition += lineHeight;
          pdf.line(margin, yPosition, pageWidth - margin, yPosition);
          yPosition += lineHeight;
          pdf.setFont('helvetica', 'normal');
        }

        xPosition = margin;
        reportData.columns.forEach((column) => {
          const value = row[column.key] || '';
          pdf.text(String(value), xPosition, yPosition);
          xPosition += column.width || columnWidth;
        });
        yPosition += lineHeight;
      });

      // Resumo (se fornecido)
      if (reportData.summary) {
        yPosition += lineHeight * 2;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Resumo:', margin, yPosition);
        yPosition += lineHeight;
        
        pdf.setFont('helvetica', 'normal');
        Object.entries(reportData.summary).forEach(([key, value]) => {
          pdf.text(`${key}: ${value}`, margin, yPosition);
          yPosition += lineHeight;
        });
      }

      // Salvar PDF
      pdf.save(filename);
      
      return { success: true, message: 'Relatório PDF gerado com sucesso!' };
    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }, []);

  return {
    generatePDFFromElement,
    generatePDFFromData,
    generateReportPDF
  };
};
