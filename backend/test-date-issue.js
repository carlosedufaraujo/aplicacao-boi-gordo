// Teste para verificar problema de datas

console.log('=== TESTE DE DATAS ===\n');

// Simular data vinda do frontend (02/09/2025)
const dateFromFrontend = '2025-09-02';
console.log('1. Data do frontend (string):', dateFromFrontend);

// Como estava sendo processado antes
const date1 = new Date(dateFromFrontend);
console.log('2. new Date(string):', date1.toISOString());
console.log('   Local:', date1.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
console.log('   Mês (getMonth):', date1.getMonth());

// Com T12:00:00 (correção do frontend)
const date2 = new Date(dateFromFrontend + 'T12:00:00');
console.log('\n3. new Date(string + T12:00:00):', date2.toISOString());
console.log('   Local:', date2.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
console.log('   Mês (getMonth):', date2.getMonth());

// Como estava sendo criado o referenceMonth (ANTIGO)
console.log('\n=== CRIAÇÃO DO REFERENCE MONTH (ANTIGO) ===');
const oldReferenceMonth = new Date(date2);
oldReferenceMonth.setDate(1);
oldReferenceMonth.setHours(0, 0, 0, 0);
console.log('4. setDate(1) + setHours(0,0,0,0):', oldReferenceMonth.toISOString());
console.log('   Local:', oldReferenceMonth.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
console.log('   Mês:', oldReferenceMonth.getMonth());

// Como está sendo criado agora (NOVO)
console.log('\n=== CRIAÇÃO DO REFERENCE MONTH (NOVO) ===');
const year = date2.getFullYear();
const month = date2.getMonth();
const newReferenceMonth = new Date(year, month, 1, 0, 0, 0, 0);
console.log('5. new Date(year, month, 1, 0, 0, 0, 0):', newReferenceMonth.toISOString());
console.log('   Local:', newReferenceMonth.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
console.log('   Mês:', newReferenceMonth.getMonth());

// Teste adicional: o que acontece se manipularmos a data
console.log('\n=== TESTE DE MANIPULAÇÃO ===');
const testDate = new Date('2025-09-30T23:00:00'); // 30 de setembro, 23h
console.log('6. Data inicial (30/09 23h):', testDate.toISOString());
testDate.setDate(1); // Mudar para dia 1
console.log('7. Após setDate(1):', testDate.toISOString());
console.log('   Local:', testDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
console.log('   Mês:', testDate.getMonth());

// Solução definitiva
console.log('\n=== SOLUÇÃO DEFINITIVA ===');
function createReferenceMonth(dateInput) {
  const date = new Date(dateInput);
  // Usar UTC para evitar problemas de timezone
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  
  // Criar data UTC do primeiro dia do mês
  const referenceMonth = new Date(Date.UTC(utcYear, utcMonth, 1, 0, 0, 0, 0));
  return referenceMonth;
}

const correctMonth = createReferenceMonth(dateFromFrontend + 'T12:00:00');
console.log('8. Solução UTC:', correctMonth.toISOString());
console.log('   Mês UTC:', correctMonth.getUTCMonth());
console.log('   Data formatada:', correctMonth.toISOString().substring(0, 7));