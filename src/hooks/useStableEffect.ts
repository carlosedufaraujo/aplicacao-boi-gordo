import { useEffect, useRef } from 'react';

/**
 * Hook para evitar loops infinitos em useEffect
 * Usa deep comparison para dependências
 */
export function useStableEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList | undefined
) {
  const prevDepsRef = useRef<React.DependencyList | undefined>();
  const hasChangedRef = useRef(true);

  // Deep comparison das dependências
  if (deps) {
    const hasChanged = !prevDepsRef.current || 
      deps.length !== prevDepsRef.current.length ||
      deps.some((dep, index) => {
        const prevDep = prevDepsRef.current?.[index];
        return JSON.stringify(dep) !== JSON.stringify(prevDep);
      });
    
    hasChangedRef.current = hasChanged;
    prevDepsRef.current = deps;
  }

  useEffect(() => {
    if (hasChangedRef.current) {
      return effect();
    }
  }, deps);
}

/**
 * Hook para debounce de funções
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }) as T;
}
