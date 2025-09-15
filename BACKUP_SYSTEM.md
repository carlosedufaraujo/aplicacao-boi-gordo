# 🗄️ SISTEMA DE BACKUP COMPLETO - BOVICONTROL

## 📋 Visão Geral

O sistema de backup do BoviControl foi projetado para garantir a segurança e integridade de todos os dados críticos do sistema. Este documento descreve como usar o sistema de backup e restauração.

## 🎯 Dados Incluídos no Backup

### 📊 Tabelas Principais
- **👥 Usuários** - Contas de usuário e permissões
- **🤝 Parceiros** - Fornecedores, compradores, transportadores
- **🏠 Currais** - Estrutura de currais e piquetes
- **💳 Contas Pagadoras** - Contas financeiras do sistema
- **🐄 Compras de Gado** - Registros de aquisição de animais
- **💸 Despesas** - Gastos operacionais
- **💰 Receitas** - Entradas financeiras
- **💹 Fluxo de Caixa** - Movimentações financeiras
- **🏷️ Categorias** - Classificações do sistema
- **📅 Eventos de Calendário** - Agendamentos e lembretes

### 📈 Dados Complementares
- **💳 Transações Financeiras** - Histórico financeiro detalhado
- **⚰️ Registros de Morte** - Controle de mortalidade
- **💀 Registros de Mortalidade** - Análises de mortalidade
- **💉 Intervenções de Saúde** - Tratamentos veterinários
- **🏡 Movimentações de Currais** - Histórico de movimentações
- **🏢 Centros de Custo** - Estrutura de custos

## 🚀 Como Fazer Backup

### Backup Manual
```bash
# Navegar para o diretório do projeto
cd /Users/carloseduardo/App/aplicacao-boi-gordo

# Executar backup completo
node scripts/backup-complete.js
```

### Backup Automático (Recomendado)
```bash
# Adicionar ao crontab para backup diário às 2:00 AM
0 2 * * * cd /Users/carloseduardo/App/aplicacao-boi-gordo && node scripts/backup-complete.js
```

## 📁 Estrutura do Backup

Cada backup é salvo em um diretório com timestamp:
```
backups/
└── backup-2025-09-15T00-54-37-760Z/
    ├── README.md                    # Documentação do backup
    ├── backup-summary.json          # Resumo estatístico
    ├── users.json                   # Dados de usuários
    ├── partners.json                # Dados de parceiros
    ├── cattle-purchases.json        # Compras de gado
    ├── expenses.json                # Despesas
    ├── cash-flows.json              # Fluxo de caixa
    └── ... (outros arquivos)
```

## 🔄 Como Restaurar Backup

### Listar Backups Disponíveis
```bash
node scripts/restore-backup.js
```

### Restaurar Backup Específico
```bash
# Substituir pelo nome do diretório do backup desejado
node scripts/restore-backup.js backup-2025-09-15T00-54-37-760Z
```

## ⚠️ Considerações Importantes

### 🔒 Segurança
- **Mantenha os backups em local seguro**
- **Considere criptografar backups sensíveis**
- **Teste a restauração regularmente**
- **Mantenha múltiplas cópias em locais diferentes**

### 📊 Performance
- **Backups são executados em lotes para otimizar performance**
- **Processo pode levar alguns minutos dependendo do volume de dados**
- **Recomenda-se executar durante horários de menor uso**

### 🔄 Restauração
- **A restauração SUBSTITUI todos os dados existentes**
- **Sempre faça backup antes de restaurar**
- **A ordem de restauração é importante devido às dependências**
- **Registros duplicados são automaticamente ignorados**

## 📈 Monitoramento

### Verificar Último Backup
```bash
# Listar backups por data (mais recente primeiro)
ls -lt backups/

# Ver resumo do último backup
cat backups/$(ls -1t backups/ | head -1)/backup-summary.json
```

### Estatísticas do Backup
Cada backup inclui:
- **Data e hora de criação**
- **Número total de registros**
- **Contagem por tabela**
- **Tempo de execução**
- **Status de sucesso/erro**

## 🛠️ Manutenção

### Limpeza de Backups Antigos
```bash
# Manter apenas os últimos 30 backups (exemplo)
cd backups/
ls -1t | tail -n +31 | xargs rm -rf
```

### Verificação de Integridade
```bash
# Verificar se todos os arquivos JSON são válidos
for file in backups/*/backup-summary.json; do
  echo "Verificando: $file"
  jq empty "$file" && echo "✅ OK" || echo "❌ ERRO"
done
```

## 🆘 Recuperação de Emergência

### Em Caso de Perda Total de Dados
1. **Pare todos os serviços**
2. **Identifique o backup mais recente**
3. **Execute a restauração completa**
4. **Verifique a integridade dos dados**
5. **Reinicie os serviços**

### Restauração Parcial
Para restaurar apenas tabelas específicas, edite o script `restore-backup.js` comentando as tabelas não desejadas.

## 📞 Suporte

Em caso de problemas com backup/restauração:
1. **Verifique os logs de erro**
2. **Confirme conectividade com banco de dados**
3. **Verifique permissões de arquivo**
4. **Consulte a documentação técnica**

---

## 📊 Exemplo de Saída do Backup

```
🗄️ INICIANDO BACKUP COMPLETO DO BOVICONTROL
📁 Diretório: /path/to/backup-2025-09-15T00-54-37-760Z
📅 Data: 14/09/2025, 21:54:37

👥 Fazendo backup de usuários...
   ✅ 2 usuários salvos
🤝 Fazendo backup de parceiros...
   ✅ 23 parceiros salvos
🐄 Fazendo backup de compras de gado...
   ✅ 22 compras de gado salvas
💸 Fazendo backup de despesas...
   ✅ 44 despesas salvas

🎉 BACKUP COMPLETO FINALIZADO!
📊 Total de registros: 422
```

## 🔧 Personalização

O sistema de backup pode ser personalizado editando:
- `scripts/backup-complete.js` - Adicionar/remover tabelas
- `scripts/restore-backup.js` - Modificar ordem de restauração
- Configurações de cron para automação

---

*Sistema de backup criado em 14/09/2025 - BoviControl v1.0*
