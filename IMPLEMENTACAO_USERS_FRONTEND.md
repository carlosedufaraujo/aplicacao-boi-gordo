# 📖 GUIA: Como Usar a Nova Rota de Usuários no Frontend

## 🔄 SITUAÇÃO ATUAL

### Rotas Disponíveis:
- ❌ `/api/v1/users` - Rota antiga com bug
- ✅ `/api/v1/list-users` - Nova rota funcional (após deploy)

---

## 🎯 IMPLEMENTAÇÃO NO FRONTEND

### 1️⃣ **Usando o userService (Recomendado)**

```typescript
// Em qualquer componente React
import userService from '@/services/userService';

// Dentro do componente
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadUsers = async () => {
    try {
      const { data, message } = await userService.getUsers();
      setUsers(data);
      console.log(message);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };
  
  loadUsers();
}, []);
```

### 2️⃣ **Chamada Direta (Alternativa)**

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/list-users`);
  const result = await response.json();
  
  if (result.status === 'success') {
    return result.data;
  }
  
  return [];
};
```

### 3️⃣ **Hook Customizado**

```typescript
// hooks/useUsers.ts
import { useState, useEffect } from 'react';
import userService from '@/services/userService';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    userService.getUsers()
      .then(({ data }) => setUsers(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
};

// Uso no componente
const { users, loading, error } = useUsers();
```

---

## 📝 EXEMPLO COMPLETO

```typescript
// components/UserList.tsx
import React, { useState, useEffect } from 'react';
import userService from '@/services/userService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await userService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Carregando usuários...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Usuários ({users.length})
      </h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Master</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.name || '-'}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                <Badge variant={user.is_active ? 'success' : 'secondary'}>
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.is_master ? '✅' : '❌'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
```

---

## 🔧 ATUALIZAR COMPONENTES EXISTENTES

Se você tem componentes que usam a rota antiga:

### ANTES:
```typescript
// ❌ Código antigo
const response = await fetch('/api/v1/users');
```

### DEPOIS:
```typescript
// ✅ Código novo
import userService from '@/services/userService';
const { data } = await userService.getUsers();
```

---

## 🧪 TESTE RÁPIDO

Para testar se está funcionando:

```javascript
// No console do navegador
fetch('https://aplicacao-boi-gordo.vercel.app/api/v1/list-users')
  .then(r => r.json())
  .then(data => console.log('Usuários:', data));
```

---

## ⚠️ NOTAS IMPORTANTES

1. **Aguarde o Deploy:** A nova rota leva 2-3 minutos para ficar disponível após o push
2. **Fallback Automático:** O userService tenta a rota nova primeiro, depois a antiga
3. **Cache:** Considere implementar cache para não fazer muitas requisições
4. **Autenticação:** Sempre envie o token JWT no header Authorization

---

## 🚀 PRÓXIMOS PASSOS

1. Aguardar deploy completar (2-3 minutos)
2. Testar com `./test-new-users-route.sh`
3. Atualizar componentes para usar `userService`
4. Remover referências à rota antiga `/api/v1/users`

---

**Última atualização:** 03/10/2025
