# API Documentation - Partners Management

## POST /api/v1/partners

### Descrição
Cria um novo parceiro no sistema.

### Autenticação
**Obrigatória:** Bearer Token JWT

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo | Validação |
|-------|------|-----------|---------|-----------|
| `name` | string | Nome do parceiro | `"Fazenda São João"` | 3-100 caracteres |
| `type` | string | Tipo do parceiro | `"VENDOR"` | Valores válidos do enum PartnerType |

### Campos Opcionais

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `cpfCnpj` | string | CPF ou CNPJ | `"12.345.678/0001-90"` |
| `phone` | string | Telefone | `"(11) 98765-4321"` |
| `email` | string | Email | `"contato@fazenda.com"` |
| `address` | string | Endereço | `"Rodovia SP-123, km 45"` |
| `notes` | string | Observações | `"Fornecedor confiável"` |

### Tipos Válidos (PartnerType)

| Valor | Descrição |
|-------|-----------|
| `VENDOR` | Fornecedor/Vendedor |
| `BROKER` | Corretor |
| `BUYER` | Comprador |
| `INVESTOR` | Investidor |
| `SERVICE_PROVIDER` | Prestador de Serviços |
| `FREIGHT_CARRIER` | Transportadora |
| `OTHER` | Outros |

### Exemplo de Request Válido

```json
{
  "name": "Fazenda São João",
  "type": "VENDOR",
  "cpfCnpj": "12.345.678/0001-90",
  "phone": "(11) 98765-4321",
  "email": "contato@fazenda.com",
  "address": "Rodovia SP-123, km 45",
  "notes": "Fornecedor confiável"
}
```

### Exemplo Mínimo Válido

```json
{
  "name": "João Silva",
  "type": "BROKER"
}
```

### Respostas

#### 201 Created - Sucesso
```json
{
  "status": "success",
  "data": {
    "id": "cmfjneowx00089jrt4i1tdk2r",
    "name": "Fazenda São João",
    "type": "VENDOR",
    "cpfCnpj": "12.345.678/0001-90",
    "phone": "(11) 98765-4321",
    "email": "contato@fazenda.com",
    "address": "Rodovia SP-123, km 45",
    "notes": "Fornecedor confiável",
    "isActive": true,
    "createdAt": "2025-09-14T12:05:19.138Z",
    "updatedAt": "2025-09-14T12:05:19.138Z"
  }
}
```

#### 400 Bad Request - Erro de Validação
```json
{
  "status": "error",
  "message": "name: Nome é obrigatório, type: Tipo é obrigatório",
  "statusCode": 400,
  "details": [
    {
      "field": "name",
      "message": "Nome é obrigatório",
      "value": undefined
    },
    {
      "field": "type",
      "message": "Tipo é obrigatório",
      "value": undefined
    }
  ]
}
```

#### 401 Unauthorized - Token Inválido/Ausente
```json
{
  "status": "error",
  "message": "Token não fornecido",
  "statusCode": 401
}
```

### Dicas para Integração

1. **Campo `type` é OBRIGATÓRIO** - sempre incluir
2. **Usar valores exatos do enum** - case-sensitive
3. **Nome mínimo de 3 caracteres** 
4. **Validar email se fornecido**
5. **CPF/CNPJ deve ser único** se fornecido
6. **Incluir Bearer token** em todas as requisições

### Exemplos de Uso por Tipo

#### Fornecedor (VENDOR)
```json
{
  "name": "Fazenda Santa Maria",
  "type": "VENDOR",
  "cpfCnpj": "12.345.678/0001-90"
}
```

#### Corretor (BROKER)
```json
{
  "name": "João Silva Corretor",
  "type": "BROKER",
  "phone": "(11) 99999-9999"
}
```

#### Comprador (BUYER)
```json
{
  "name": "JBS Frigorífico",
  "type": "BUYER",
  "address": "São Paulo, SP"
}
```
