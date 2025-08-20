#!/bin/bash

echo "🚀 Iniciando Sistema Boi Gordo..."

# Parar processos existentes
echo "🛑 Parando processos existentes..."
pkill -f "simple-server" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 2

# Iniciar Backend
echo "🔧 Iniciando Backend (porta 3333)..."
cd backend
node simple-server.js &
BACKEND_PID=$!
sleep 3

# Testar Backend
echo "🧪 Testando Backend..."
if curl -s http://localhost:3333/health > /dev/null; then
    echo "✅ Backend funcionando!"
else
    echo "❌ Backend não está respondendo!"
    exit 1
fi

# Voltar para raiz
cd ..

# Iniciar Frontend
echo "🎨 Iniciando Frontend (porta 5173)..."
npm run dev &
FRONTEND_PID=$!
sleep 5

# Testar Frontend
echo "🧪 Testando Frontend..."
if curl -s -I http://localhost:5173 > /dev/null; then
    echo "✅ Frontend funcionando!"
else
    echo "❌ Frontend não está respondendo!"
fi

echo ""
echo "🎉 Sistema iniciado!"
echo "📊 Backend:  http://localhost:3333"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Para parar: pkill -f 'simple-server' && pkill -f 'npm run dev'"
echo ""

# Manter o script rodando
wait
