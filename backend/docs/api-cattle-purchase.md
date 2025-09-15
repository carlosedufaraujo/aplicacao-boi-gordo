# API Documentation - Cattle Purchase Management

## POST /api/v1/cattle-purchases

### Descrição
Cria uma nova compra de gado no sistema.

### Autenticação
**Obrigatória:** Bearer Token JWT

### Campos Obrigatórios

| Campo | Tipo | Descrição | Exemplo | Validação |
|-------|------|-----------|---------|-----------|
| `vendorId` | string | ID do fornecedor/vendedor | `"cmfgqd1zg00018ay7so9zzmk2"` | Deve existir na tabela partners |
| `payerAccountId` | string | ID da conta pagadora | `"cmfi9fozy0028l584u9qz12h7"` | Deve existir na tabela payer_accounts |
| `purchaseDate` | string | Data da compra (ISO8601) | `"2025-09-14T10:00:00.000Z"` | Formato ISO8601 válido |
| `animalType` | string | Tipo de animal | `"MALE"` | Valores: MALE, FEMALE, MIXED |
| `initialQuantity` | number | Quantidade inicial | `50` | Inteiro >= 1 |
| `purchaseWeight` | number | Peso da compra (kg) | `15000` | Float >= 1 |
| `carcassYield` | number | Rendimento de carcaça (%) | `55.5` | Float entre 1 e 100 |
| `pricePerArroba` | number | Preço por arroba | `280.50` | Float >= 0 |
| `paymentType` | string | Tipo de pagamento | `"CASH"` | Valores: CASH, INSTALLMENT, BARTER |

### Exemplo de Request Válido

```json
{
  "vendorId": "cmfgqd1zg00018ay7so9zzmk2",
  "payerAccountId": "cmfi9fozy0028l584u9qz12h7", 
  "purchaseDate": "2025-09-14T10:00:00.000Z",
  "animalType": "MALE",
  "initialQuantity": 50,
  "purchaseWeight": 15000,
  "carcassYield": 55.5,
  "pricePerArroba": 280.50,
  "paymentType": "CASH"
}
```

### Respostas

#### 201 Created - Sucesso
```json
{
  "status": "success",
  "data": {
    "id": "cmfjne3q400019jrtz6ajepik",
    "lotCode": "LOT-2509023",
    "vendorId": "cmfgqd1zg00018ay7so9zzmk2",
    "payerAccountId": "cmfi9fozy0028l584u9qz12h7",
    "purchaseDate": "2025-09-14T10:00:00.000Z",
    "animalType": "MALE",
    "initialQuantity": 50,
    "purchaseWeight": 15000,
    "carcassYield": 55.5,
    "pricePerArroba": 280.5,
    "purchaseValue": 155677.5,
    "totalCost": 155677.5,
    "paymentType": "CASH",
    "status": "CONFIRMED",
    "createdAt": "2025-09-14T12:04:51.675Z",
    "updatedAt": "2025-09-14T12:04:51.675Z"
  }
}
```

#### 400 Bad Request - Erro de Validação
```json
{
  "status": "error",
  "message": "vendorId: Fornecedor é obrigatório, payerAccountId: Conta pagadora é obrigatória, animalType: Tipo de animal inválido",
  "statusCode": 400,
  "details": [
    {
      "field": "vendorId",
      "message": "Fornecedor é obrigatório",
      "value": undefined
    },
    {
      "field": "payerAccountId", 
      "message": "Conta pagadora é obrigatória",
      "value": undefined
    },
    {
      "field": "animalType",
      "message": "Tipo de animal inválido", 
      "value": "INVALID_TYPE"
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

### Como Obter IDs Válidos

#### Fornecedores (vendorId)
```bash
GET /api/v1/partners?type=VENDOR
```

#### Contas Pagadoras (payerAccountId)
```bash
GET /api/v1/payer-accounts
```

### Dicas para Integração

1. **Sempre validar dados no frontend** antes de enviar
2. **Usar IDs existentes** obtidos das APIs de listagem
3. **Formatar datas corretamente** em ISO8601
4. **Incluir Bearer token** em todas as requisições
5. **Tratar erros 400** mostrando campos específicos ao usuário
