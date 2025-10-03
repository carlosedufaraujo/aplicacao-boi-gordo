#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Função para corrigir toast com objeto
function fixToastCalls(content) {
  // Padrão para toast({ title: ..., description: ... })
  const toastObjectPattern = /toast\(\s*\{\s*title:\s*([^,}]+),?\s*description:\s*([^,}]+),?[^}]*\}\s*\)/g;

  // Substituir toast com objeto por toast.success/error/etc com string
  let fixed = content.replace(toastObjectPattern, (match, title, description) => {
    // Limpar as aspas e espaços
    const cleanTitle = title.trim();
    const cleanDesc = description.trim();

    // Se tem variant, determinar o tipo
    if (match.includes("variant: 'destructive'") || match.includes('type: "error"') || match.includes("type: 'error'")) {
      return `toast.error(${cleanDesc} ? \`\${${cleanTitle}}: \${${cleanDesc}}\` : ${cleanTitle})`;
    } else if (match.includes('type: "success"') || match.includes("type: 'success'")) {
      return `toast.success(${cleanDesc} ? \`\${${cleanTitle}}: \${${cleanDesc}}\` : ${cleanTitle})`;
    } else if (match.includes('type: "warning"') || match.includes("type: 'warning'")) {
      return `toast.warning(${cleanDesc} ? \`\${${cleanTitle}}: \${${cleanDesc}}\` : ${cleanTitle})`;
    } else if (match.includes('type: "info"') || match.includes("type: 'info'")) {
      return `toast.info(${cleanDesc} ? \`\${${cleanTitle}}: \${${cleanDesc}}\` : ${cleanTitle})`;
    } else {
      // Default
      return `toast(${cleanDesc} ? \`\${${cleanTitle}}: \${${cleanDesc}}\` : ${cleanTitle})`;
    }
  });

  // Padrão mais simples para toast({ title: ... }) sem description
  const simpleToastPattern = /toast\(\s*\{\s*title:\s*([^,}]+)\s*\}\s*\)/g;

  fixed = fixed.replace(simpleToastPattern, (match, title) => {
    return `toast(${title.trim()})`;
  });

  return fixed;
}

// Arquivos a corrigir
const files = [
  'src/components/CashFlow/CashFlowDashboard.tsx',
  'src/components/CashFlow/CashFlowForm.tsx',
  'src/hooks/useIntegratedFinancialAnalysis.ts',
  'src/components/System/CleanUserManagement.tsx',
  'src/components/Forms/EnhancedPurchaseForm.tsx',
  'src/components/Interventions/IntegratedInterventionForm.tsx',
  'src/components/Registrations/CompleteRegistrations.tsx',
  'src/components/FinancialIntegration/IntegrationStatus.tsx'
];

console.log('🔧 Corrigindo erros de toast...\n');

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);

  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  Arquivo não encontrado: ${file}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const fixed = fixToastCalls(content);

    if (content !== fixed) {
      fs.writeFileSync(fullPath, fixed);
      console.log(`✅ Corrigido: ${file}`);
    } else {
      console.log(`⏭️  Sem mudanças: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${file}:`, error.message);
  }
});

console.log('\n✨ Correção concluída!');
console.log('📝 Reinicie o servidor de desenvolvimento para aplicar as mudanças.');