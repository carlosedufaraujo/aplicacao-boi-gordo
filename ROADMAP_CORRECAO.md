# 🗺️ Roadmap de Correção - Visualização Rápida

## 📊 Visão Geral

```
Status Atual:  ████░░░░░░ 10% (2/20 testes)
Meta Final:    █████████░ 90%+ (18/20 testes)
```

---

## 🚀 Fases de Execução

### 🔴 FASE 1: CRÍTICO (Semana 1) - 6 dias
**Impacto:** Desbloqueia 13 testes (65%)

```
Dia 1-3: Sistema de Autenticação
├─ Corrigir endpoint /auth/login
├─ Validar credenciais corretamente  
└─ Gerar/salvar token JWT

Dia 4-5: Carregamento de Dados
├─ Corrigir envio de token
├─ Tratar erros 401
└─ Corrigir loading infinito

Dia 6: Campo de Senha
└─ Corrigir input de senha
```

**Resultado Esperado:** 5 testes passando (25%)

---

### 🔧 FASE 2: FUNCIONAL (Semana 2) - 6 dias
**Impacto:** Desbloqueia 4 testes (20%)

```
Dia 7-8: Interface de Parceiros
├─ Adicionar navegação
└─ Tornar formulário acessível

Dia 9-10: Interface de Despesas
├─ Adicionar botão "Nova Movimentação"
└─ Corrigir formulário

Dia 11-12: Intervenções Veterinárias
├─ Criar endpoint /interventions
└─ Criar interface
```

**Resultado Esperado:** 9 testes passando (45%)

---

### 🎨 FASE 3: MELHORIAS (Semana 3) - 4 dias
**Impacto:** Desbloqueia 2 testes (10%)

```
Dia 13-14: Responsividade Mobile
└─ Testar e corrigir layouts

Dia 15: Acessibilidade
└─ Auditoria WCAG

Dia 16: Performance
└─ Otimizar APIs
```

**Resultado Esperado:** 11 testes passando (55%)

---

### 🔒 FASE 4: SEGURANÇA (Semana 4) - 4 dias
**Impacto:** Desbloqueia 2 testes (10%)

```
Dia 17-18: Conformidade LGPD
├─ Exportação de dados
└─ Exclusão de dados

Dia 19-20: Validações Finais
└─ Re-executar todos os testes
```

**Resultado Esperado:** 18+ testes passando (90%+)

---

## 📈 Progresso Esperado

| Semana | Testes Passando | Taxa de Sucesso |
|--------|----------------|-----------------|
| Inicial | 2 | 10% |
| Semana 1 | 5 | 25% |
| Semana 2 | 9 | 45% |
| Semana 3 | 11 | 55% |
| Semana 4 | 18+ | 90%+ |

---

## 🎯 Quick Start - Começar Agora

### Passo 1: Verificar Ambiente
```bash
# Verificar se backend está rodando
curl http://localhost:3001/api/v1/health

# Verificar se frontend está rodando  
curl http://localhost:5173
```

### Passo 2: Começar Fase 1.1
1. Abrir `functions/api/[[path]].ts`
2. Localizar seção `auth/login` (linha ~196)
3. Verificar formato de resposta
4. Corrigir conforme necessário

### Passo 3: Testar
```bash
# Testar login manualmente
curl -X POST http://localhost:5173/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📝 Checklist Rápido

### Fase 1 - Crítico
- [ ] Login funciona com credenciais válidas
- [ ] Login rejeita credenciais inválidas
- [ ] Token é gerado e salvo
- [ ] Dashboard carrega dados
- [ ] Campo de senha funciona

### Fase 2 - Funcional
- [ ] Parceiros acessível
- [ ] Despesas acessível
- [ ] Intervenções implementada

### Fase 3 - Melhorias
- [ ] Mobile responsivo
- [ ] Acessível (WCAG)
- [ ] Performance < 500ms

### Fase 4 - Segurança
- [ ] LGPD compliant
- [ ] 90%+ testes passando

---

**Documento completo:** `PLANO_CORRECAO_PROBLEMAS.md`

