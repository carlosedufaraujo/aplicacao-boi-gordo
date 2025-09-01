const axios = require('axios');

async function createTestPens() {
  try {
    console.log('🐂 Criando 10 currais de teste...\n');
    
    // Primeiro fazer login para pegar o token
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@boicontrol.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso!\n');
    
    // Dados dos currais de teste - usando campos corretos da API
    const testPens = [
      {
        penNumber: '01',
        capacity: 100,
        type: 'FATTENING',
        location: 'Setor Norte - Bloco A'
      },
      {
        penNumber: '02', 
        capacity: 100,
        type: 'FATTENING',
        location: 'Setor Norte - Bloco B'
      },
      {
        penNumber: '03',
        capacity: 50,
        type: 'QUARANTINE',
        location: 'Setor de Quarentena'
      },
      {
        penNumber: '04',
        capacity: 30,
        type: 'HOSPITAL',
        location: 'Setor Veterinário'
      },
      {
        penNumber: '05',
        capacity: 80,
        type: 'RECEPTION',
        location: 'Setor Leste - Área 1'
      },
      {
        penNumber: '06',
        capacity: 80,
        type: 'RECEPTION',
        location: 'Setor Leste - Área 2'
      },
      {
        penNumber: '07',
        capacity: 120,
        type: 'FATTENING',
        location: 'Setor Sul - Bloco A'
      },
      {
        penNumber: '08',
        capacity: 120,
        type: 'FATTENING',
        location: 'Setor Sul - Bloco B'
      },
      {
        penNumber: '09',
        capacity: 60,
        type: 'FATTENING',
        location: 'Setor Oeste'
      },
      {
        penNumber: '10',
        capacity: 150,
        type: 'FATTENING',
        location: 'Setor de Terminação'
      }
    ];
    
    console.log('2️⃣ Criando currais...\n');
    
    const createdPens = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const penData of testPens) {
      try {
        const response = await axios.post(
          'http://localhost:3001/api/v1/pens',
          penData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.status === 'success') {
          createdPens.push(response.data.data);
          successCount++;
          console.log(`✅ Curral ${penData.penNumber} criado com sucesso!`);
          console.log(`   📍 Localização: ${penData.location}`);
          console.log(`   📊 Capacidade: ${penData.capacity} animais`);
          console.log(`   🏷️ Tipo: ${penData.type}\n`);
        }
      } catch (error) {
        errorCount++;
        if (error.response?.data?.message?.includes('já existe')) {
          console.log(`⚠️  Curral ${penData.penNumber} já existe no sistema\n`);
        } else {
          console.error(`❌ Erro ao criar Curral ${penData.penNumber}:`, error.response?.data?.message || error.message);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA CRIAÇÃO DE CURRAIS');
    console.log('='.repeat(60));
    console.log(`✅ Currais criados com sucesso: ${successCount}`);
    console.log(`❌ Erros ou duplicados: ${errorCount}`);
    console.log(`📦 Total processado: ${testPens.length}`);
    
    // Buscar todos os currais para mostrar o status atual
    console.log('\n3️⃣ Verificando currais no sistema...\n');
    
    try {
      const getAllResponse = await axios.get('http://localhost:3001/api/v1/pens', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (getAllResponse.data.status === 'success') {
        const allPens = getAllResponse.data.data.items || getAllResponse.data.data || [];
        
        console.log('='.repeat(60));
        console.log('🏠 CURRAIS DISPONÍVEIS NO SISTEMA');
        console.log('='.repeat(60));
        
        // Agrupar por tipo
        const pensByType = {};
        allPens.forEach(pen => {
          if (!pensByType[pen.type]) {
            pensByType[pen.type] = [];
          }
          pensByType[pen.type].push(pen);
        });
        
        // Mostrar por tipo
        Object.keys(pensByType).forEach(type => {
          console.log(`\n📌 ${type}:`);
          pensByType[type].forEach(pen => {
            const occupancyPercent = pen.capacity > 0 
              ? Math.round((pen.currentOccupancy / pen.capacity) * 100)
              : 0;
            
            const statusEmoji = pen.status === 'ACTIVE' ? '🟢' 
              : pen.status === 'MAINTENANCE' ? '🟡' 
              : '🔴';
            
            console.log(`   ${statusEmoji} Curral ${pen.penNumber}`);
            console.log(`      📊 Ocupação: ${pen.currentOccupancy}/${pen.capacity} (${occupancyPercent}%)`);
            console.log(`      📍 ${pen.location || 'Sem localização'}`);
          });
        });
        
        // Estatísticas gerais
        const totalCapacity = allPens.reduce((sum, pen) => sum + (pen.capacity || 0), 0);
        const totalOccupancy = allPens.reduce((sum, pen) => sum + (pen.currentOccupancy || 0), 0);
        const activePens = allPens.filter(pen => pen.status === 'ACTIVE').length;
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 ESTATÍSTICAS GERAIS');
        console.log('='.repeat(60));
        console.log(`🏠 Total de currais: ${allPens.length}`);
        console.log(`🟢 Currais ativos: ${activePens}`);
        console.log(`📊 Capacidade total: ${totalCapacity} animais`);
        console.log(`🐂 Ocupação atual: ${totalOccupancy} animais`);
        console.log(`📈 Taxa de ocupação: ${totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}%`);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar currais:', error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  Backend não está rodando na porta 3001');
      console.log('💡 Execute: PORT=3001 npm run dev no diretório backend/');
    }
  }
}

// Executar
createTestPens();