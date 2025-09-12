import { ptBR } from 'date-fns/locale';

export const dateConfig = {
  locale: ptBR,
  timezone: 'America/Sao_Paulo',
  formats: {
    date: 'dd/MM/yyyy',
    time: 'HH:mm',
    datetime: 'dd/MM/yyyy HH:mm',
    month: 'MMMM yyyy',
    year: 'yyyy'
  }
};

export default dateConfig;