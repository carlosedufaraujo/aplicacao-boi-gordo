#!/usr/bin/env node

/**
 * Script para configurar secrets do GitHub Actions via API
 * Requer: GITHUB_TOKEN com permissões de repo
 */

import https from 'https';
import { createPublicKey, publicEncrypt } from 'crypto';
import pkg from 'tweetsodium';
const { seal } = pkg;

const OWNER = 'carlosedufaraujo';
const REPO = 'aplicacao-boi-gordo';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

// Secrets para configurar
const SECRETS = {
  CLOUDFLARE_ACCOUNT_ID: '15c6fda1ba5327224c2c2737a34b208d',
  VITE_API_URL: 'https://aplicacao-boi-gordo.pages.dev/api/v1',
  VITE_BACKEND_URL: 'https://aplicacao-boi-gordo.pages.dev',
  VITE_SUPABASE_URL: 'https://vffxtvuqhlhcbbyqmynz.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MTQ2MDcsImV4cCI6MjA3MTI5MDYwN30.MH5C-ZmQ1udG5Obre4_furNk68NNeUohZTdrKtfagmc',
};

// CLOUDFLARE_API_TOKEN precisa ser fornecido pelo usuário
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ Erro: GITHUB_TOKEN não encontrado!');
  console.error('');
  console.error('Configure o token:');
  console.error('  export GITHUB_TOKEN=seu_token_aqui');
  console.error('');
  console.error('Ou crie um token em: https://github.com/settings/tokens');
  console.error('Permissões necessárias: repo (Full control of private repositories)');
  process.exit(1);
}

/**
 * Obter chave pública do repositório para criptografar secrets
 */
async function getPublicKey() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/actions/secrets/public-key`,
      method: 'GET',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Erro ao obter chave pública: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Criptografar valor usando chave pública (formato base64 do GitHub)
 * Usa tweetsodium que é a biblioteca recomendada pelo GitHub
 */
function encryptSecret(publicKeyBase64, secretValue) {
  try {
    // Converter chave pública de base64 para Uint8Array
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
    
    // Converter valor do secret para Uint8Array
    const messageBytes = Buffer.from(secretValue, 'utf8');
    
    // Criptografar usando tweetsodium (libsodium)
    const encryptedBytes = seal(messageBytes, publicKeyBytes);
    
    // Retornar em base64
    return Buffer.from(encryptedBytes).toString('base64');
  } catch (error) {
    throw new Error(`Erro ao criptografar: ${error.message}`);
  }
}

/**
 * Criar ou atualizar secret
 */
async function createOrUpdateSecret(secretName, secretValue, publicKeyData) {
  return new Promise((resolve, reject) => {
    const encryptedValue = encryptSecret(publicKeyData.key, secretValue);

    const payload = JSON.stringify({
      encrypted_value: encryptedValue,
      key_id: publicKeyData.key_id,
    });

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${OWNER}/${REPO}/actions/secrets/${secretName}`,
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Node.js',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          resolve({ success: true, secretName });
        } else {
          reject(new Error(`Erro ao criar secret ${secretName}: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Função principal
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔐 CONFIGURANDO SECRETS DO GITHUB                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📦 Repositório: ${OWNER}/${REPO}`);
  console.log('');

  try {
    // Obter chave pública
    console.log('🔑 Obtendo chave pública do repositório...');
    const publicKeyData = await getPublicKey();
    console.log('✅ Chave pública obtida');
    console.log('');

    // Configurar secrets
    const secretsToConfigure = { ...SECRETS };
    
    if (CLOUDFLARE_API_TOKEN) {
      secretsToConfigure.CLOUDFLARE_API_TOKEN = CLOUDFLARE_API_TOKEN;
    } else {
      console.log('⚠️  CLOUDFLARE_API_TOKEN não fornecido (pule este secret)');
      console.log('   Configure via: export CLOUDFLARE_API_TOKEN=seu_token');
      console.log('');
    }

    console.log('📝 Configurando secrets...');
    console.log('');

    const results = [];

    for (const [secretName, secretValue] of Object.entries(secretsToConfigure)) {
      if (secretName === 'CLOUDFLARE_API_TOKEN' && !CLOUDFLARE_API_TOKEN) {
        continue;
      }

      try {
        console.log(`  🔄 Configurando ${secretName}...`);
        await createOrUpdateSecret(secretName, secretValue, publicKeyData);
        console.log(`  ✅ ${secretName} configurado com sucesso`);
        results.push({ name: secretName, status: 'success' });
      } catch (error) {
        console.log(`  ❌ Erro ao configurar ${secretName}: ${error.message}`);
        results.push({ name: secretName, status: 'error', error: error.message });
      }
    }

    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ CONFIGURAÇÃO CONCLUÍDA                                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`✅ Secrets configurados com sucesso: ${successCount}`);
    if (errorCount > 0) {
      console.log(`❌ Erros: ${errorCount}`);
    }
    console.log('');

    if (!CLOUDFLARE_API_TOKEN) {
      console.log('⚠️  IMPORTANTE: CLOUDFLARE_API_TOKEN não foi configurado!');
      console.log('   Configure manualmente em:');
      console.log('   https://github.com/carlosedufaraujo/aplicacao-boi-gordo/settings/secrets/actions');
      console.log('');
    }

    console.log('🎉 Pronto! Agora você pode fazer commit e push para ativar o deploy automático.');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

