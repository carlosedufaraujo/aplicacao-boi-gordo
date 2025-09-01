import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  debounce, 
  throttle, 
  memoize, 
  chunkArray,
  BatchProcessor 
} from './performance';

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('deve atrasar a execução da função', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('test3');
    });

    it('deve resetar o timer a cada chamada', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('test1');
      vi.advanceTimersByTime(50);
      
      debouncedFn('test2');
      vi.advanceTimersByTime(50);
      
      expect(fn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('test2');
    });
  });

  describe('throttle', () => {
    it('deve limitar execuções ao intervalo especificado', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('call1');

      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('call3');
    });

    it('deve executar a última chamada após o intervalo', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('first');
      expect(fn).toHaveBeenCalledWith('first');

      throttledFn('second');
      throttledFn('third');
      throttledFn('fourth');

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('fourth');
    });
  });

  describe('memoize', () => {
    it('deve cachear resultados de funções', () => {
      const expensiveFn = vi.fn((x: number, y: number) => x + y);
      const memoizedFn = memoize(expensiveFn);

      expect(memoizedFn(1, 2)).toBe(3);
      expect(memoizedFn(1, 2)).toBe(3);
      expect(memoizedFn(1, 2)).toBe(3);

      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    it('deve diferenciar diferentes argumentos', () => {
      const fn = vi.fn((x: number, y: number) => x * y);
      const memoizedFn = memoize(fn);

      expect(memoizedFn(2, 3)).toBe(6);
      expect(memoizedFn(3, 4)).toBe(12);
      expect(memoizedFn(2, 3)).toBe(6);

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('deve usar key generator customizado quando fornecido', () => {
      const fn = vi.fn((obj: { id: number; name: string }) => obj.name.toUpperCase());
      const memoizedFn = memoize(fn, (obj) => obj.id.toString());

      const obj1 = { id: 1, name: 'test' };
      const obj2 = { id: 1, name: 'different' };

      expect(memoizedFn(obj1)).toBe('TEST');
      expect(memoizedFn(obj2)).toBe('TEST'); // Usa cache baseado no ID

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('chunkArray', () => {
    it('deve dividir array em chunks do tamanho especificado', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const chunks = chunkArray(array, 3);

      expect(chunks).toEqual([
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
        [10]
      ]);
    });

    it('deve retornar array vazio para entrada vazia', () => {
      const chunks = chunkArray([], 5);
      expect(chunks).toEqual([]);
    });

    it('deve retornar array original se chunk size maior que array', () => {
      const array = [1, 2, 3];
      const chunks = chunkArray(array, 10);
      expect(chunks).toEqual([[1, 2, 3]]);
    });
  });

  describe('BatchProcessor', () => {
    it('deve processar items em batch após delay', () => {
      const processorFn = vi.fn();
      const batcher = new BatchProcessor(processorFn, 100);

      batcher.add('item1');
      batcher.add('item2');
      batcher.add('item3');

      expect(processorFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(processorFn).toHaveBeenCalledTimes(1);
      expect(processorFn).toHaveBeenCalledWith(['item1', 'item2', 'item3']);
    });

    it('deve resetar timer a cada novo item', () => {
      const processorFn = vi.fn();
      const batcher = new BatchProcessor(processorFn, 100);

      batcher.add('item1');
      vi.advanceTimersByTime(50);
      
      batcher.add('item2');
      vi.advanceTimersByTime(50);
      
      expect(processorFn).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      expect(processorFn).toHaveBeenCalledWith(['item1', 'item2']);
    });

    it('deve permitir flush manual', () => {
      const processorFn = vi.fn();
      const batcher = new BatchProcessor(processorFn, 100);

      batcher.add('item1');
      batcher.add('item2');
      batcher.flush();

      expect(processorFn).toHaveBeenCalledWith(['item1', 'item2']);
    });
  });
});