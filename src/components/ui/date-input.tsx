/**
 * Componente de Input de Data Brasileiro
 * =======================================
 * 
 * Input customizado que aceita entrada no formato BR (dd/MM/yyyy)
 * mas converte internamente para o formato ISO que o HTML5 espera
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import { formatBrazilianDate, DATE_CONFIG } from '@/config/dateConfig';
import { format, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string | Date | null;
  onChange?: (date: string) => void;
  placeholder?: string;
  showIcon?: boolean;
}

export const DateInputBR: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa',
  showIcon = true,
  className,
  disabled,
  required,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isoValue, setIsoValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Converter valor inicial para exibição
  useEffect(() => {
    if (value) {
      try {
        const date = typeof value === 'string' ? new Date(value) : value;
        if (isValid(date)) {
          setIsoValue(format(date, 'yyyy-MM-dd'));
          setDisplayValue(formatBrazilianDate(date, 'DATE_FULL'));
        }
      } catch (error) {
        console.error('Erro ao processar data inicial:', error);
      }
    } else {
      setDisplayValue('');
      setIsoValue('');
    }
  }, [value]);

  // Formatar entrada do usuário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Remove caracteres não numéricos
    input = input.replace(/\D/g, '');
    
    // Aplica máscara dd/mm/aaaa
    if (input.length <= 2) {
      setDisplayValue(input);
    } else if (input.length <= 4) {
      setDisplayValue(`${input.slice(0, 2)}/${input.slice(2)}`);
    } else if (input.length <= 8) {
      setDisplayValue(`${input.slice(0, 2)}/${input.slice(2, 4)}/${input.slice(4, 8)}`);
    }
    
    // Se tiver data completa, valida e converte
    if (input.length === 8) {
      const day = input.slice(0, 2);
      const month = input.slice(2, 4);
      const year = input.slice(4, 8);
      const dateStr = `${day}/${month}/${year}`;
      
      try {
        const parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date(), { locale: ptBR });
        if (isValid(parsedDate)) {
          const isoDate = format(parsedDate, 'yyyy-MM-dd');
          setIsoValue(isoDate);
          if (onChange) {
            onChange(isoDate);
          }
        }
      } catch (error) {
        console.error('Data inválida:', error);
      }
    }
  };

  // Lidar com input nativo de data (calendário do navegador)
  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value;
    setIsoValue(isoDate);
    
    if (isoDate) {
      try {
        const date = new Date(isoDate + 'T12:00:00'); // Adiciona horário meio-dia para evitar problemas de timezone
        setDisplayValue(formatBrazilianDate(date, 'DATE_FULL'));
        if (onChange) {
          onChange(isoDate);
        }
      } catch (error) {
        console.error('Erro ao processar data:', error);
      }
    } else {
      setDisplayValue('');
      if (onChange) {
        onChange('');
      }
    }
  };

  return (
    <div className="relative">
      {/* Input visível com formato brasileiro */}
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={10}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          showIcon && "pr-10",
          className
        )}
        {...props}
      />
      
      {/* Input nativo oculto para suporte ao calendário */}
      <input
        type="date"
        value={isoValue}
        onChange={handleNativeDateChange}
        disabled={disabled}
        required={required}
        className="absolute inset-0 opacity-0 cursor-pointer"
        style={{ 
          width: showIcon ? '40px' : '100%',
          left: showIcon ? 'auto' : '0',
          right: showIcon ? '0' : 'auto'
        }}
      />
      
      {/* Ícone de calendário */}
      {showIcon && (
        <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      )}
    </div>
  );
};

/**
 * Componente de Input de Data e Hora Brasileiro
 */
export const DateTimeInputBR: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder = 'dd/mm/aaaa hh:mm',
  className,
  disabled,
  required,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isoValue, setIsoValue] = useState('');

  useEffect(() => {
    if (value) {
      try {
        const date = typeof value === 'string' ? new Date(value) : value;
        if (isValid(date)) {
          setIsoValue(format(date, "yyyy-MM-dd'T'HH:mm"));
          setDisplayValue(formatBrazilianDate(date, 'DATETIME_DISPLAY'));
        }
      } catch (error) {
        console.error('Erro ao processar data/hora inicial:', error);
      }
    } else {
      setDisplayValue('');
      setIsoValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDateTime = e.target.value;
    setIsoValue(isoDateTime);
    
    if (isoDateTime) {
      try {
        const date = new Date(isoDateTime);
        setDisplayValue(formatBrazilianDate(date, 'DATETIME_DISPLAY'));
        if (onChange) {
          onChange(isoDateTime);
        }
      } catch (error) {
        console.error('Erro ao processar data/hora:', error);
      }
    } else {
      setDisplayValue('');
      if (onChange) {
        onChange('');
      }
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      
      <input
        type="datetime-local"
        value={isoValue}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className="absolute inset-0 opacity-0 cursor-pointer"
      />
    </div>
  );
};

export default DateInputBR;