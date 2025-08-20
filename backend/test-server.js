const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 3333;

// Configuração do Supabase - SEU PROJETO
const supabaseUrl = 'https://vffxtvuqhlhcbbyqmynz.supabase.co';
// Você precisa fornecer a chave anônima correta do seu projeto

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Servidor funcionando!'
  });
});

// Teste de conexão com Supabase
app.get('/api/v1/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select('numero_lote, status, quantidade_animais')
      .limit(3);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data: data,
      message: 'Conexão com Supabase funcionando!'
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: err.message 
    });
  }
});

// Listar lotes
app.get('/api/v1/cattle-lots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lotes')
      .select(`
        id,
        numero_lote,
        status,
        categoria_principal,
        quantidade_animais,
        peso_estimado_total,
        data_inicial,
        data_final,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data: data,
      total: data.length
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: err.message 
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Teste Supabase: http://localhost:${port}/api/v1/test-supabase`);
  console.log(`🐄 Lotes: http://localhost:${port}/api/v1/cattle-lots`);
});
