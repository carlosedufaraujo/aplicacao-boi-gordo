# 📊 ANÁLISE DETALHADA DO RELATÓRIO DE MORTES

## ✅ CONTAGEM CORRETA: 75 MORTES (não 70)

### Distribuição por Causa:
- **Não Identificada**: 46 mortes (61.3%)
- **Timpanismo**: 22 mortes (29.3%)
- **Transporte**: 3 mortes (4.0%)
- **Cobra**: 2 mortes (2.7%)
- **Acidente**: 1 morte (1.3%)
- **Pneumonia**: 1 morte (1.3%)

### Distribuição por Piquete (41 piquetes afetados):

| Piquete | Mortes | Detalhamento |
|---------|--------|--------------|
| C-01 | 1 | 1 Não Identificada |
| C-14 | 1 | 1 Não Identificada |
| C-15 | 2 | 1 Cobra, 1 Não Identificada |
| D-01 | 2 | 1 Timpanismo, 1 Não Identificada |
| D-05 | 1 | 1 Não Identificada |
| D-06 | 2 | 2 Não Identificada |
| E-01 | 2 | 2 Não Identificada |
| E-03 | 1 | 1 Timpanismo |
| E-13 | 1 | 1 Não Identificada |
| F-17 | 5 | 1 Timpanismo, 4 Não Identificada |
| F-18 | 6 | 2 Timpanismo, 4 Não Identificada |
| F-19 | 5 | 1 Timpanismo, 1 Cobra, 3 Não Identificada |
| G-17 | 2 | 2 Não Identificada |
| H-01 | 1 | 1 Não Identificada |
| H-02 | 2 | 1 Timpanismo, 1 Não Identificada |
| H-18 | 2 | 1 Timpanismo, 1 Não Identificada |
| H-22 | 3 | 1 Timpanismo, 2 Não Identificada |
| J-01 | 2 | 1 Acidente, 1 Não Identificada |
| J-02 | 4 | 1 Timpanismo, 3 Não Identificada |
| J-03 | 3 | 1 Timpanismo, 2 Não Identificada |
| J-06 | 2 | 1 Timpanismo, 1 Não Identificada |
| L-03 | 1 | 1 Não Identificada |
| L-04 | 1 | 1 Timpanismo |
| L-07 | 1 | 1 Timpanismo |
| M-01 | 1 | 1 Pneumonia |
| M-02 | 1 | 1 Transporte |
| M-03 | 1 | 1 Transporte |
| M-05 | 1 | 1 Timpanismo |
| M-06 | 1 | 1 Timpanismo |
| M-07 | 1 | 1 Não Identificada |
| N-09 | 1 | 1 Não Identificada |
| N-10 | 1 | 1 Não Identificada |
| O-02 | 1 | 1 Não Identificada |
| O-03 | 2 | 1 Timpanismo, 1 Não Identificada |
| P-02 | 1 | 1 Transporte |
| P-08 | 1 | 1 Timpanismo |
| Q-03 | 1 | 1 Não Identificada |
| T-05 | 2 | 1 Timpanismo, 1 Não Identificada |
| T-06 | 1 | 1 Timpanismo |
| T-07 | 2 | 1 Timpanismo, 1 Não Identificada |
| T-08 | 3 | 1 Timpanismo, 2 Não Identificada |

**TOTAL: 75 MORTES**

## 💰 CÁLCULO DO CUSTO MÉDIO POR ANIMAL

### Fórmula Correta:
```
Custo Médio = (Custo Total de Compra + Total de Comissões) / Quantidade Total de Animais
```

### Observações Importantes:
1. **NÃO incluir** custos de frete, saúde, operacionais, etc.
2. **APENAS** custo de aquisição + comissão
3. Cada morte deve ser registrada **individualmente** (quantity = 1)
4. A perda contábil é: 75 mortes × Custo Médio por Animal

## 📝 CORREÇÕES NECESSÁRIAS NO SISTEMA:

1. ✅ **Quantidade Total**: 75 mortes (confirmado)
2. ✅ **Registro Unitário**: Cada morte cadastrada separadamente
3. ✅ **Cálculo de Perda**: Baseado apenas em custo de compra + comissão
4. ✅ **Distribuição**: Respeitar a distribuição exata por curral e causa

## 🎯 MAPEAMENTO PARA O SISTEMA:

### Categorias (DeathType):
- Não Identificada → `UNKNOWN`
- Timpanismo → `DISEASE` 
- Transporte → `STRESS`
- Cobra → `PREDATION`
- Acidente → `ACCIDENT`
- Pneumonia → `DISEASE`

### Processo de Cadastro:
1. Limpar registros anteriores incorretos
2. Calcular custo médio correto (compra + comissão)
3. Cadastrar 75 registros individuais
4. Atribuir a perda contábil correta para cada morte
5. Atualizar quantidades nos lotes e currais

## 📊 RESULTADO ESPERADO:
- **75 registros** na tabela `death_records`
- **Cada registro** com quantity = 1
- **estimatedLoss** = Custo médio por animal
- **Perda total** = 75 × Custo médio