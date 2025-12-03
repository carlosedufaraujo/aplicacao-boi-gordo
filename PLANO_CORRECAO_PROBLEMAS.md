# 🎯 Plano de Correção Gradativa dos Problemas

## 📊 Resumo Executivo

**Status Atual:** 10% dos testes passando (2/20)  
**Objetivo:** Atingir 90%+ de testes passando em 4 fases  
**Prazo Estimado:** 4-6 semanas

---

## 🚨 FASE 1: CORREÇÕES CRÍTICAS (Semana 1)
**Prioridade:** CRÍTICA - Bloqueadores principais  
**Objetivo:** Desbloquear 70% dos testes

### 1.1 Sistema de Autenticação (Dias 1-3)

#### Problema Identificado
- Login com credenciais válidas retorna erro "Resposta inválida do servidor"
- Login aceita credenciais inválidas (risco de segurança)
- Token JWT não é gerado/salvo corretamente
- Campo de senha não funciona adequadamente

#### Tarefas

**Dia 1: Diagnóstico e Correção do Endpoint de Login**
- [ ] Verificar endpoint `/api/v1/auth/login` em `functions/api/[[path]].ts`
- [ ] Validar formato de resposta esperado pelo frontend
- [ ] Corrigir resposta do backend para incluir:
  ```json
  {
    "status": "success",
    "data": {
      "user": { ... },
      "token": "jwt_token_aqui"
    }
  }
  ```
- [ ] Testar login com credenciais válidas
- [ ] Verificar se token está sendo retornado

**Dia 2: Validação de Credenciais**
- [ ] Implementar validação rigorosa de credenciais inválidas
- [ ] Retornar erro 401 com mensagem clara para credenciais inválidas
- [ ] Garantir que login não aceite credenciais incorretas
- [ ] Adicionar logs para debug

**Dia 3: Salvamento e Uso do Token**
- [ ] Verificar salvamento de token no localStorage/sessionStorage
- [ ] Implementar fallback para Safari (já feito em `safariCompatibility.ts`)
- [ ] Garantir que token é enviado em todas as requisições subsequentes
- [ ] Testar fluxo completo: login → dashboard → requisições autenticadas

#### Critérios de Sucesso
- ✅ Login funciona com credenciais válidas
- ✅ Login rejeita credenciais inválidas (401)
- ✅ Token JWT é gerado e salvo corretamente
- ✅ Token é enviado em requisições autenticadas
- ✅ Testes TC001, TC002, TC003 passam

#### Arquivos a Modificar
- `functions/api/[[path]].ts` (endpoint de login)
- `src/services/backendAuth.ts` (salvamento de token)
- `src/services/api/apiClient.ts` (envio de token)

---

### 1.2 Carregamento de Dados do Dashboard (Dias 4-5)

#### Problema Identificado
- Dashboard fica em "Carregando dashboard..." indefinidamente
- Múltiplos endpoints retornam 401 mesmo após login
- Dados não carregam corretamente

#### Tarefas

**Dia 4: Correção de Requisições Autenticadas**
- [ ] Verificar se token está sendo enviado no header Authorization
- [ ] Corrigir tratamento de erros 401 no ApiClient
- [ ] Implementar retry automático para erros 401 (com refresh token se necessário)
- [ ] Adicionar timeout para requisições
- [ ] Verificar CORS e headers no backend

**Dia 5: Correção do Estado de Carregamento**
- [ ] Corrigir estado de loading infinito no dashboard
- [ ] Implementar tratamento de erro adequado
- [ ] Adicionar fallback quando dados não carregam
- [ ] Testar carregamento de todos os endpoints principais

#### Critérios de Sucesso
- ✅ Dashboard carrega dados corretamente após login
- ✅ Endpoints retornam dados em vez de 401
- ✅ Estado de loading é removido após carregamento
- ✅ Erros são tratados adequadamente
- ✅ Testes TC008, TC011 passam

#### Arquivos a Modificar
- `src/services/api/apiClient.ts`
- `src/components/Dashboard/ShadcnDashboard.tsx`
- `src/hooks/api/useCattlePurchasesApi.ts`
- `functions/api/[[path]].ts` (validação de token)

---

### 1.3 Validação de Campo de Senha (Dia 6)

#### Problema Identificado
- Campo de senha não funciona adequadamente no formulário de login

#### Tarefas
- [ ] Verificar componente de input de senha em `Login02.tsx`
- [ ] Testar funcionalidade de mostrar/ocultar senha
- [ ] Verificar se campo está capturando valor corretamente
- [ ] Corrigir qualquer problema de acessibilidade
- [ ] Testar em diferentes navegadores

#### Critérios de Sucesso
- ✅ Campo de senha funciona corretamente
- ✅ Mostrar/ocultar senha funciona
- ✅ Valor é capturado no submit
- ✅ Testes de login passam

#### Arquivos a Modificar
- `src/pages/Login02.tsx`

---

## 🔧 FASE 2: CORREÇÕES FUNCIONAIS (Semana 2)
**Prioridade:** ALTA - Funcionalidades principais  
**Objetivo:** Tornar funcionalidades acessíveis e funcionais

### 2.1 Interface de Criação de Parceiros (Dias 7-8)

#### Problema Identificado
- Interface de criação não está visível na UI
- Navegação para funcionalidade não funciona

#### Tarefas

**Dia 7: Navegação e Roteamento**
- [ ] Verificar roteamento para página de parceiros
- [ ] Adicionar link/botão de acesso no menu/sidebar
- [ ] Verificar se componente está sendo renderizado
- [ ] Testar navegação completa

**Dia 8: Interface e Funcionalidade**
- [ ] Verificar se formulário de parceiros está completo
- [ ] Testar criação de parceiro com dados válidos
- [ ] Testar validação de campos obrigatórios
- [ ] Verificar integração com API

#### Critérios de Sucesso
- ✅ Interface de parceiros está acessível
- ✅ Criação de parceiros funciona
- ✅ Validação de campos funciona
- ✅ Teste TC004 passa

#### Arquivos a Modificar
- `src/components/Layout/ModernSidebar.tsx` (adicionar link)
- `src/components/Forms/ModernPartnerForm.tsx` (verificar)
- `src/services/api/partnerApi.ts` (verificar)

---

### 2.2 Interface de Despesas (Dias 9-10)

#### Problema Identificado
- Botão "Nova Movimentação" não está visível
- Formulário de despesas não está acessível

#### Tarefas

**Dia 9: Adicionar Acesso à Funcionalidade**
- [ ] Adicionar botão "Nova Movimentação" no dashboard
- [ ] Adicionar link no menu/sidebar
- [ ] Verificar roteamento para página de despesas
- [ ] Testar navegação

**Dia 10: Funcionalidade Completa**
- [ ] Verificar formulário de despesas
- [ ] Testar criação de despesa com dados válidos
- [ ] Testar validação de campos obrigatórios
- [ ] Verificar integração com API

#### Critérios de Sucesso
- ✅ Botão "Nova Movimentação" está visível
- ✅ Formulário de despesas funciona
- ✅ Criação de despesas funciona
- ✅ Testes TC009, TC010 passam

#### Arquivos a Modificar
- `src/components/Dashboard/ShadcnDashboard.tsx` (adicionar botão)
- `src/components/CashFlow/CashFlowForm.tsx` (verificar)
- `src/services/api/expenseApi.ts` (verificar)

---

### 2.3 Endpoint de Intervenções Veterinárias (Dias 11-12)

#### Problema Identificado
- Endpoint `/api/v1/interventions` não está disponível
- Interface de intervenções não está na UI

#### Tarefas

**Dia 11: Implementar Endpoint**
- [ ] Criar endpoint `/api/v1/interventions` em `functions/api/[[path]].ts`
- [ ] Mapear para tabela do Supabase
- [ ] Implementar CRUD completo
- [ ] Testar endpoint diretamente

**Dia 12: Criar Interface**
- [ ] Criar componente de gestão de intervenções
- [ ] Adicionar roteamento
- [ ] Adicionar link no menu
- [ ] Testar funcionalidade completa

#### Critérios de Sucesso
- ✅ Endpoint de intervenções funciona
- ✅ Interface está disponível
- ✅ CRUD completo funciona
- ✅ Teste TC014 passa

#### Arquivos a Criar/Modificar
- `functions/api/[[path]].ts` (adicionar rota)
- `src/components/Interventions/InterventionManagement.tsx` (novo)
- `src/services/api/interventionsApi.ts` (novo)

---

## 🎨 FASE 3: MELHORIAS E OTIMIZAÇÕES (Semana 3)
**Prioridade:** MÉDIA - Melhorias de UX e Performance  
**Objetivo:** Melhorar experiência do usuário

### 3.1 Responsividade Mobile (Dias 13-14)

#### Tarefas
- [ ] Testar em diferentes viewports (mobile, tablet, desktop)
- [ ] Verificar breakpoints do Tailwind CSS
- [ ] Corrigir problemas de layout em mobile
- [ ] Testar em dispositivos reais
- [ ] Validar navegação mobile

#### Critérios de Sucesso
- ✅ Layout funciona em mobile
- ✅ Navegação mobile funciona
- ✅ Formulários são usáveis em mobile
- ✅ Teste TC019 passa (responsividade)

---

### 3.2 Acessibilidade (Dia 15)

#### Tarefas
- [ ] Executar auditoria de acessibilidade (WCAG)
- [ ] Verificar navegação por teclado
- [ ] Testar com leitores de tela
- [ ] Validar contraste de cores
- [ ] Adicionar labels ARIA onde necessário

#### Critérios de Sucesso
- ✅ Navegação por teclado funciona
- ✅ Contraste adequado
- ✅ Labels ARIA presentes
- ✅ Teste TC019 passa (acessibilidade)

---

### 3.3 Performance de APIs (Dia 16)

#### Tarefas
- [ ] Implementar métricas de performance
- [ ] Adicionar logging de tempo de resposta
- [ ] Identificar endpoints lentos
- [ ] Otimizar queries do banco de dados
- [ ] Implementar cache onde apropriado

#### Critérios de Sucesso
- ✅ APIs respondem em < 500ms
- ✅ Métricas de performance implementadas
- ✅ Teste TC018 passa

---

## 🔒 FASE 4: SEGURANÇA E COMPLIANCE (Semana 4)
**Prioridade:** MÉDIA - Segurança e Conformidade  
**Objetivo:** Garantir segurança e conformidade

### 4.1 Conformidade LGPD (Dias 17-18)

#### Tarefas
- [ ] Implementar funcionalidades de proteção de dados
- [ ] Adicionar endpoint para exportação de dados do usuário
- [ ] Adicionar endpoint para exclusão de dados
- [ ] Implementar criptografia de dados sensíveis
- [ ] Adicionar logs de auditoria

#### Critérios de Sucesso
- ✅ Exportação de dados funciona
- ✅ Exclusão de dados funciona
- ✅ Dados sensíveis estão criptografados
- ✅ Teste TC017 passa

---

### 4.2 Validações e Testes Finais (Dias 19-20)

#### Tarefas
- [ ] Re-executar todos os testes do TestSprite
- [ ] Corrigir problemas remanescentes
- [ ] Validar que 90%+ dos testes passam
- [ ] Documentar mudanças
- [ ] Criar guia de deploy

#### Critérios de Sucesso
- ✅ 90%+ dos testes passam
- ✅ Todos os problemas críticos resolvidos
- ✅ Documentação atualizada

---

## 📋 Checklist de Progresso

### Fase 1 - Crítico (Semana 1)
- [ ] 1.1 Sistema de Autenticação
- [ ] 1.2 Carregamento de Dados
- [ ] 1.3 Campo de Senha

### Fase 2 - Funcional (Semana 2)
- [ ] 2.1 Interface de Parceiros
- [ ] 2.2 Interface de Despesas
- [ ] 2.3 Endpoint de Intervenções

### Fase 3 - Melhorias (Semana 3)
- [ ] 3.1 Responsividade Mobile
- [ ] 3.2 Acessibilidade
- [ ] 3.3 Performance

### Fase 4 - Segurança (Semana 4)
- [ ] 4.1 Conformidade LGPD
- [ ] 4.2 Validações Finais

---

## 🎯 Métricas de Sucesso por Fase

| Fase | Testes Esperados | Meta de Passagem |
|------|------------------|------------------|
| Fase 1 | TC001-TC003, TC008, TC011 | 5 testes (25%) |
| Fase 2 | TC004, TC009, TC010, TC014 | 4 testes (20%) |
| Fase 3 | TC018, TC019 | 2 testes (10%) |
| Fase 4 | TC017, TC020 | 2 testes (10%) |
| **Total** | **13 testes** | **65%+** |

---

## 🔄 Processo de Trabalho

### Para Cada Tarefa:
1. **Investigar** - Entender o problema em profundidade
2. **Corrigir** - Implementar a correção
3. **Testar** - Verificar localmente
4. **Validar** - Re-executar teste específico do TestSprite
5. **Documentar** - Atualizar documentação

### Revisões:
- **Diária:** Revisar progresso do dia
- **Semanal:** Re-executar testes completos
- **Final:** Validação completa com TestSprite

---

## 📝 Notas Importantes

### Dependências Entre Tarefas
- Fase 1 deve ser completada antes das outras fases
- Fase 2 depende de Fase 1 estar completa
- Fase 3 e 4 podem ser feitas em paralelo após Fase 2

### Riscos Identificados
- Problemas no backend podem bloquear correções do frontend
- Integração com Supabase pode precisar de ajustes
- Testes podem revelar problemas adicionais

### Recursos Necessários
- Acesso ao backend/Supabase
- Credenciais de teste válidas
- Ambiente de desenvolvimento configurado
- TestSprite para validação contínua

---

## 🚀 Como Começar

### Passo 1: Preparação
```bash
# Verificar se backend está rodando
curl http://localhost:3001/api/v1/health

# Verificar se frontend está rodando
curl http://localhost:5173
```

### Passo 2: Começar Fase 1
1. Abrir `functions/api/[[path]].ts`
2. Localizar endpoint `/auth/login`
3. Verificar formato de resposta
4. Corrigir conforme necessário

### Passo 3: Testar
```bash
# Re-executar testes específicos
npm run test:sprite -- TC001
```

---

**Última atualização:** 2025-01-15  
**Próxima revisão:** Após conclusão da Fase 1

