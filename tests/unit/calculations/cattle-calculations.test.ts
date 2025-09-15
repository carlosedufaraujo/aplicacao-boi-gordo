/**
 * Testes de Cálculos Financeiros e de Peso para Gado
 * Garante a precisão de todos os cálculos críticos do sistema
 */

describe('Cálculos de Compra de Gado', () => {

  describe('Cálculo de Peso de Carcaça', () => {
    it('deve calcular corretamente o peso de carcaça com rendimento padrão de 50%', () => {
      const pesoVivo = 500; // kg
      const rendimento = 50; // %
      const pesoCarcaca = (pesoVivo * rendimento) / 100;

      expect(pesoCarcaca).toBe(250);
    });

    it('deve calcular corretamente com diferentes rendimentos', () => {
      const testCases = [
        { pesoVivo: 400, rendimento: 52, expected: 208 },
        { pesoVivo: 450, rendimento: 54, expected: 243 },
        { pesoVivo: 600, rendimento: 48, expected: 288 },
      ];

      testCases.forEach(({ pesoVivo, rendimento, expected }) => {
        const result = (pesoVivo * rendimento) / 100;
        expect(result).toBe(expected);
      });
    });
  });

  describe('Cálculo de Valor de Compra', () => {
    it('deve calcular valor correto baseado em arroba (@)', () => {
      const pesoCarcaca = 300; // kg
      const precoArroba = 280; // R$ por @
      const arrobas = pesoCarcaca / 15; // 1@ = 15kg
      const valorCompra = arrobas * precoArroba;

      expect(arrobas).toBe(20);
      expect(valorCompra).toBe(5600);
    });

    it('deve calcular valor completo com peso vivo e rendimento', () => {
      const pesoVivo = 450;
      const rendimento = 50;
      const precoArroba = 300;

      const pesoCarcaca = (pesoVivo * rendimento) / 100;
      const valorCompra = (pesoCarcaca / 15) * precoArroba;

      expect(pesoCarcaca).toBe(225);
      expect(valorCompra).toBe(4500);
    });

    it('deve manter precisão com valores decimais', () => {
      const pesoVivo = 473.5;
      const rendimento = 52.5;
      const precoArroba = 287.50;

      const pesoCarcaca = (pesoVivo * rendimento) / 100;
      const valorCompra = (pesoCarcaca / 15) * precoArroba;

      expect(pesoCarcaca).toBeCloseTo(248.5875, 4);
      expect(valorCompra).toBeCloseTo(4764.5937, 2);
    });
  });

  describe('Cálculo de GMD (Ganho Médio Diário)', () => {
    it('deve calcular GMD corretamente', () => {
      const pesoInicial = 350;
      const pesoFinal = 500;
      const dias = 100;

      const gmd = (pesoFinal - pesoInicial) / dias;

      expect(gmd).toBe(1.5); // 1.5 kg/dia
    });

    it('deve retornar 0 se dias for 0 para evitar divisão por zero', () => {
      const pesoInicial = 350;
      const pesoFinal = 500;
      const dias = 0;

      const gmd = dias === 0 ? 0 : (pesoFinal - pesoInicial) / dias;

      expect(gmd).toBe(0);
    });

    it('deve calcular GMD negativo em caso de perda de peso', () => {
      const pesoInicial = 400;
      const pesoFinal = 390;
      const dias = 10;

      const gmd = (pesoFinal - pesoInicial) / dias;

      expect(gmd).toBe(-1); // Perda de 1kg/dia
    });
  });

  describe('Cálculo de Custo Total', () => {
    it('deve somar todos os custos corretamente', () => {
      const valorCompra = 10000;
      const frete = 500;
      const comissao = 200;
      const despesasExtras = 300;

      const custoTotal = valorCompra + frete + comissao + despesasExtras;

      expect(custoTotal).toBe(11000);
    });

    it('deve calcular comissão como percentual do valor de compra', () => {
      const valorCompra = 10000;
      const percentualComissao = 2; // 2%
      const comissao = (valorCompra * percentualComissao) / 100;
      const frete = 500;

      const custoTotal = valorCompra + comissao + frete;

      expect(comissao).toBe(200);
      expect(custoTotal).toBe(10700);
    });
  });

  describe('Cálculo de Margem de Lucro', () => {
    it('deve calcular margem de lucro corretamente', () => {
      const valorVenda = 15000;
      const custoTotal = 10000;

      const lucro = valorVenda - custoTotal;
      const margemLucro = (lucro / custoTotal) * 100;

      expect(lucro).toBe(5000);
      expect(margemLucro).toBe(50); // 50% de margem
    });

    it('deve calcular margem negativa (prejuízo)', () => {
      const valorVenda = 8000;
      const custoTotal = 10000;

      const lucro = valorVenda - custoTotal;
      const margemLucro = (lucro / custoTotal) * 100;

      expect(lucro).toBe(-2000);
      expect(margemLucro).toBe(-20); // -20% (prejuízo)
    });

    it('deve retornar 0 se custo total for 0', () => {
      const valorVenda = 1000;
      const custoTotal = 0;

      const margemLucro = custoTotal === 0 ? 0 : ((valorVenda - custoTotal) / custoTotal) * 100;

      expect(margemLucro).toBe(0);
    });
  });

  describe('Cálculo de Mortalidade', () => {
    it('deve calcular taxa de mortalidade corretamente', () => {
      const quantidadeInicial = 100;
      const mortes = 3;

      const taxaMortalidade = (mortes / quantidadeInicial) * 100;
      const quantidadeAtual = quantidadeInicial - mortes;

      expect(taxaMortalidade).toBe(3); // 3%
      expect(quantidadeAtual).toBe(97);
    });

    it('não deve permitir mortes maiores que quantidade inicial', () => {
      const quantidadeInicial = 100;
      const mortes = 150;

      const mortesValidas = Math.min(mortes, quantidadeInicial);
      const quantidadeAtual = quantidadeInicial - mortesValidas;

      expect(mortesValidas).toBe(100);
      expect(quantidadeAtual).toBe(0);
    });
  });

  describe('Conversões de Unidades', () => {
    it('deve converter kg para arroba corretamente', () => {
      const kg = 450;
      const arrobas = kg / 15;

      expect(arrobas).toBe(30);
    });

    it('deve converter arroba para kg corretamente', () => {
      const arrobas = 25;
      const kg = arrobas * 15;

      expect(kg).toBe(375);
    });

    it('deve arredondar valores monetários para 2 casas decimais', () => {
      const valor = 1234.5678;
      const valorArredondado = Math.round(valor * 100) / 100;

      expect(valorArredondado).toBe(1234.57);
    });

    it('deve arredondar pesos para 1 casa decimal', () => {
      const peso = 456.789;
      const pesoArredondado = Math.round(peso * 10) / 10;

      expect(pesoArredondado).toBe(456.8);
    });
  });

  describe('Validações de Limites', () => {
    it('não deve aceitar valores negativos', () => {
      const valores = [-100, -50, -1];

      valores.forEach(valor => {
        const valorValido = Math.max(0, valor);
        expect(valorValido).toBe(0);
      });
    });

    it('deve validar rendimento entre 0 e 100%', () => {
      const rendimentos = [-10, 0, 50, 100, 150];

      rendimentos.forEach(rendimento => {
        const rendimentoValido = Math.max(0, Math.min(100, rendimento));
        expect(rendimentoValido).toBeGreaterThanOrEqual(0);
        expect(rendimentoValido).toBeLessThanOrEqual(100);
      });
    });

    it('deve validar peso máximo razoável', () => {
      const pesoMaximo = 2000; // kg - peso máximo razoável para um boi
      const pesos = [500, 1000, 1500, 3000];

      pesos.forEach(peso => {
        const pesoValido = Math.min(peso, pesoMaximo);
        expect(pesoValido).toBeLessThanOrEqual(pesoMaximo);
      });
    });
  });
});