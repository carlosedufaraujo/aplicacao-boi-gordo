import { z } from 'zod';

// Validação customizada para campos de data obrigatórios
export const requiredDateSchema = z.date({
  required_error: "Data é obrigatória",
  invalid_type_error: "Data inválida",
}).refine((date) => {
  // Verificar se a data é válida
  return date instanceof Date && !isNaN(date.getTime());
}, {
  message: "Por favor, selecione uma data válida"
});

// Validação para data opcional
export const optionalDateSchema = z.date().optional().nullable();

// Função helper para adicionar required em campos de data HTML
export const getDateInputProps = (isRequired: boolean = true) => ({
  required: isRequired,
  onInvalid: (e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.currentTarget.setCustomValidity('Por favor, selecione uma data');
  },
  onInput: (e: React.FormEvent<HTMLInputElement>) => {
    e.currentTarget.setCustomValidity('');
  }
}); 