#!/usr/bin/env node

/**
 * Script para configurar CLOUDFLARE_API_TOKEN no GitHub
 * Requer: GITHUB_TOKEN e CLOUDFLARE_API_TOKEN
 */

import https from 'https';
import pkg from 'tweetsodium';
const { seal } = pkg;

const OWNER = 'carlosedufaraujo';
const REPO = 'aplicacao-boi-gordo';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ Erro: GITHUB_TOKEN não encontrado!');
  process.exit(1);
}

if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ Erro: CLOUDFLARE_API_TOKEN não encontrado!');
  console.error('');
  console.error('Configure o token:');
  console.error('  export CLOUDFLARE_API_TOKEN=seu_token_aqui');
  console.error('');
  console.error('Ou obtenha em: https://dash.cloudflare.com/profile/api-tokens');
  process.exit(1);
}

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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Erro: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

function encryptSecret(publicKeyBase64, secretValue) {
  try {
    const publicKeyBytes = Buffer.from(publicKeyBase64, 'base64');
    const messageBytes = Buffer.from(secretValue, 'utf8');
    const encryptedBytes = seal(messageBytes, publicKeyBytes);
    return Buffer.from(encryptedBytes).toString('base64');
  } catch (error) {
    throw new Error(`Erro ao criptografar: ${error.message}`);
  }
}

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
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 204) {
          resolve({ success: true, secretName });
        } else {
          reject(new Error(`Erro: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🔐 CONFIGURANDO CLOUDFLARE_API_TOKEN                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    console.log('🔑 Obtendo chave pública do repositório...');
    const publicKeyData = await getPublicKey();
    console.log('✅ Chave pública obtida');
    console.log('');

    console.log('📝 Configurando CLOUDFLARE_API_TOKEN...');
    await createOrUpdateSecret('CLOUDFLARE_API_TOKEN', CLOUDFLARE_API_TOKEN, publicKeyData);
    console.log('✅ CLOUDFLARE_API_TOKEN configurado com sucesso!');
    console.log('');

    console.log('🎉 Pronto! Todos os secrets estão configurados.');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

