import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testImport() {
  try {
    console.log('🧪 Iniciando teste de importação...');
    
    // 1. Fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:3002/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@boigordo.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Buscar contas pagadoras
    console.log('2. Buscando contas pagadoras...');
    const accountsResponse = await fetch('http://localhost:3002/api/v1/payer-accounts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    let payerAccountId = null;
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json();
      if (accountsData.data && accountsData.data.length > 0) {
        payerAccountId = accountsData.data[0].id;
        console.log('✅ Conta pagadora encontrada:', payerAccountId);
      } else {
        console.log('⚠️ Nenhuma conta pagadora encontrada, criando uma...');
        
        // Criar conta pagadora de teste
        const createAccountResponse = await fetch('http://localhost:3002/api/v1/payer-accounts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            accountName: 'Conta Teste',
            bankName: 'Banco Teste',
            accountNumber: '12345-6',
            agency: '1234',
            accountType: 'CHECKING',
            balance: 1000000.00
          })
        });

        if (createAccountResponse.ok) {
          const newAccountData = await createAccountResponse.json();
          payerAccountId = newAccountData.data.id;
          console.log('✅ Conta pagadora criada:', payerAccountId);
        } else {
          console.log('❌ Erro ao criar conta pagadora');
        }
      }
    }

    // 3. Criar fornecedor
    console.log('3. Criando fornecedor...');
    const vendorResponse = await fetch('http://localhost:3002/api/v1/partners', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'FORNECEDOR TESTE',
        type: 'VENDOR',
        cpfCnpj: '12345678900',
        phone: '11999999999',
        isActive: true
      })
    });

    let vendorId = null;
    if (vendorResponse.ok) {
      const vendorData = await vendorResponse.json();
      vendorId = vendorData.data.id;
      console.log('✅ Fornecedor criado:', vendorId);
    } else {
      const errorText = await vendorResponse.text();
      console.log('❌ Erro ao criar fornecedor:', errorText);
      return;
    }

    // 4. Preparar dados de teste
    const testData = {
      lotCode: 'LOTE-TEST-001',
      vendorId: vendorId,
      vendorName: 'FORNECEDOR TESTE',
      vendorCPF: '123.456.789-00',
      purchaseDate: '2025-06-03T00:00:00.000Z',
      animalType: 'MALE',
      initialQuantity: 89,
      purchaseWeight: 30144.30,
      carcassYield: 52,
      pricePerArroba: 295.08,
      purchaseValue: 296494.99,
      paymentType: 'CASH',
      city: 'PLANALTINA',
      state: 'GO',
      animalAge: 24,
      commission: 2964.95,
      transportCompanyName: 'Rialma Agropecuária',
      payerAccountId: payerAccountId
    };

    // 5. Testar criação de compra individual
    console.log('4. Testando criação de compra...');
    const createResponse = await fetch('http://localhost:3002/api/v1/cattle-purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testData)
    });

    const responseText = await createResponse.text();
    console.log('Response status:', createResponse.status);
    console.log('Response body:', responseText);

    if (createResponse.ok) {
      console.log('✅ Compra criada com sucesso!');
      const purchaseData = JSON.parse(responseText);
      console.log('📋 ID da compra:', purchaseData.data.id);
    } else {
      console.log('❌ Erro na criação da compra:', responseText);
      
      // Verificar se é erro de validação
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.message) {
          console.log('📝 Mensagem de erro:', errorData.message);
        }
      } catch (e) {
        // Erro não é JSON válido
      }
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testImport();