import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cattlePurchaseApi } from '@/services/api/cattlePurchaseApi';
import { CattlePurchase, CreateCattlePurchaseDTO, UpdateCattlePurchaseDTO } from '@/types/cattlePurchase';
import { useToast } from '@/hooks/use-toast';

// Query Keys
const QUERY_KEYS = {
  all: ['cattle-purchases'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters?: any) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

// Hook para listar cattle purchases
export const useCattlePurchaseList = (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  penId?: string;
}) => {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: () => cattlePurchaseApi.getAll(filters),
    staleTime: 1000 * 60 * 3, // 3 minutos
  });
};

// Hook para obter um cattle purchase
export const useCattlePurchase = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => cattlePurchaseApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para criar cattle purchase
export const useCreateCattlePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: CreateCattlePurchaseDTO) => cattlePurchaseApi.create(data),
    onSuccess: (newPurchase) => {
      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      
      // Adicionar novo item ao cache
      queryClient.setQueryData(
        QUERY_KEYS.detail(newPurchase.id),
        newPurchase
      );
      
      toast({
        title: 'Sucesso',
        description: 'Compra de gado criada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar compra',
        variant: 'destructive',
      });
    },
  });
};

// Hook para atualizar cattle purchase
export const useUpdateCattlePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCattlePurchaseDTO }) =>
      cattlePurchaseApi.update(id, data),
    onSuccess: (updatedPurchase) => {
      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      
      // Atualizar cache do item
      queryClient.setQueryData(
        QUERY_KEYS.detail(updatedPurchase.id),
        updatedPurchase
      );
      
      toast({
        title: 'Sucesso',
        description: 'Compra atualizada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao atualizar compra',
        variant: 'destructive',
      });
    },
  });
};

// Hook para deletar cattle purchase
export const useDeleteCattlePurchase = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => cattlePurchaseApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Invalidar lista
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      
      // Remover do cache
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(deletedId) });
      
      toast({
        title: 'Sucesso',
        description: 'Compra deletada com sucesso',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao deletar compra',
        variant: 'destructive',
      });
    },
  });
};

// Hook para prefetch
export const usePrefetchCattlePurchase = () => {
  const queryClient = useQueryClient();

  return async (id: string) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.detail(id),
      queryFn: () => cattlePurchaseApi.getById(id),
      staleTime: 1000 * 60 * 5, // 5 minutos
    });
  };
};