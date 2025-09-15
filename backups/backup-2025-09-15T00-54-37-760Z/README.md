# BACKUP COMPLETO - BOVICONTROL

## 📋 Informações do Backup

- **Data de Criação:** 14/09/2025, 21:54:37
- **Timestamp:** 2025-09-15T00:54:37.770Z
- **Total de Registros:** 422

## 📊 Tabelas Incluídas

- **users:** 2 registros
- **partners:** 23 registros
- **pens:** 44 registros
- **payerAccounts:** 2 registros
- **cattlePurchases:** 22 registros
- **expenses:** 44 registros
- **revenues:** 0 registros
- **saleRecords:** 0 registros
- **healthInterventions:** 0 registros
- **cashFlows:** 76 registros
- **penMovements:** 0 registros
- **calendarEvents:** 62 registros
- **costCenters:** 0 registros
- **categories:** 37 registros
- **mortalityRecords:** 0 registros
- **deathRecords:** 70 registros
- **financialTransactions:** 40 registros

## 📁 Arquivos de Backup

- `users.json` - Dados da tabela users
- `partners.json` - Dados da tabela partners
- `pens.json` - Dados da tabela pens
- `payerAccounts.json` - Dados da tabela payerAccounts
- `cattlePurchases.json` - Dados da tabela cattlePurchases
- `expenses.json` - Dados da tabela expenses
- `revenues.json` - Dados da tabela revenues
- `saleRecords.json` - Dados da tabela saleRecords
- `healthInterventions.json` - Dados da tabela healthInterventions
- `cashFlows.json` - Dados da tabela cashFlows
- `penMovements.json` - Dados da tabela penMovements
- `calendarEvents.json` - Dados da tabela calendarEvents
- `costCenters.json` - Dados da tabela costCenters
- `categories.json` - Dados da tabela categories
- `mortalityRecords.json` - Dados da tabela mortalityRecords
- `deathRecords.json` - Dados da tabela deathRecords
- `financialTransactions.json` - Dados da tabela financialTransactions
- `backup-summary.json` - Resumo do backup
- `README.md` - Este arquivo

## 🔄 Como Restaurar

Para restaurar os dados, use o script de restauração:

```bash
node scripts/restore-backup.js backup-2025-09-15T00-54-37-760Z
```

## ⚠️ Observações

- Este backup contém todos os dados do sistema na data especificada
- Os dados estão em formato JSON para fácil leitura e restauração
- Mantenha este backup em local seguro
- Para backups automáticos, configure um cron job

---
*Backup gerado automaticamente pelo sistema BoviControl*
