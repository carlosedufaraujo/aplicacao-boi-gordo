/**
 * CONFIGURAÇÃO COMPARTILHADA ENTRE FRONTEND E BACKEND
 * 
 * Este arquivo centraliza todas as configurações do sistema
 * garantindo que Frontend e Backend sempre usem as mesmas portas
 */

const config = {
  // Configurações de Porta
  backend: {
    port: process.env.PORT || 3001,
    host: 'localhost'
  },
  
  frontend: {
    port: 5173,
    host: 'localhost'
  },
  
  // URLs construídas dinamicamente
  get urls() {
    return {
      backend: `http://${this.backend.host}:${this.backend.port}`,
      backendApi: `http://${this.backend.host}:${this.backend.port}/api/v1`,
      frontend: `http://${this.frontend.host}:${this.frontend.port}`
    };
  },
  
  // Configurações CORS
  get cors() {
    return {
      origins: [
        this.urls.frontend,
        `http://${this.frontend.host}:5174`, // Vite preview
        `http://${this.frontend.host}:5175`, // Alternativa
        `http://${this.frontend.host}:3000`  // CRA fallback
      ]
    };
  },
  
  // Configurações do Supabase
  supabase: {
    url: 'https://vffxtvuqhlhcbbyqmynz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZnh0dnVxaGxoY2JieXFteW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwNjA1NzAsImV4cCI6MjA1MDYzNjU3MH0.KsVx8CJLm9s5EqiTQPTFB1CsGPMmf93pALCWNMpkUEI'
  }
};

// Export para Node.js (Backend)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}

// Export para ES Modules (se necessário)
if (typeof exports !== 'undefined') {
  exports.default = config;
}