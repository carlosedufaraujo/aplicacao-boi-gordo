import { useState, useEffect } from 'react';
import { userService, User } from '../services/supabase';

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
}

export const useUserManagement = () => {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: false,
    error: null
  });

  // Carregar todos os usuários
  const loadUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const users = await userService.getAllUsers();
      setState(prev => ({ ...prev, users, loading: false }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao carregar usuários'
      }));
    }
  };

  // Atualizar usuário
  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const updatedUser = await userService.updateUser(id, updates);
      
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user.id === id ? updatedUser : user
        ),
        loading: false
      }));
      
      return updatedUser;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao atualizar usuário'
      }));
      throw error;
    }
  };

  // Ativar usuário
  const activateUser = async (id: string) => {
    try {
      await userService.toggleUserStatus(id, true);
      await loadUsers(); // Recarregar lista
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao ativar usuário'
      }));
      throw error;
    }
  };

  // Desativar usuário
  const deactivateUser = async (id: string) => {
    try {
      await userService.toggleUserStatus(id, false);
      await loadUsers(); // Recarregar lista
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao desativar usuário'
      }));
      throw error;
    }
  };

  // Deletar usuário
  const deleteUser = async (id: string) => {
    try {
      await userService.deleteUser(id);
      await loadUsers(); // Recarregar lista
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: error.message || 'Erro ao deletar usuário'
      }));
      throw error;
    }
  };

  // Carregar usuários na inicialização
  useEffect(() => {
    loadUsers();
  }, []);

  return {
    ...state,
    loadUsers,
    updateUser,
    activateUser,
    deactivateUser,
    deleteUser,
    refreshUsers: loadUsers
  };
};
