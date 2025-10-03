const https = require('https');

const baseUrl = 'https://aplicacao-boi-gordo.vercel.app';

const routes = [
  '/api/debug',
  '/api/users',
  '/api/v1/users',
  '/api/partners',
  '/api/cattle-purchases',
  '/api/expenses'
];

console.log('🧪 TESTANDO TODAS AS ROTAS DA API:\n');

routes.forEach(route => {
  https.get(baseUrl + route, (res) => {
    let data = '';
    
    res.on('data', chunk => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.status) {
          console.log(`✅ ${route}: ${json.status} - ${json.message || 'OK'}`);
        } else if (json.message === 'BoviControl API - Vercel Serverless') {
          console.log(`❌ ${route}: Rota não implementada (retorna página padrão)`);
        } else {
          console.log(`⚠️ ${route}: Resposta inesperada`);
        }
      } catch (e) {
        console.log(`❌ ${route}: Erro ao parsear JSON`);
      }
    });
  }).on('error', (e) => {
    console.log(`❌ ${route}: ${e.message}`);
  });
});

setTimeout(() => {
  console.log('\n📊 Teste concluído');
}, 3000);
