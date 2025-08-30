#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

const modules = [
  { route: 'revenue.routes.ts', controller: 'revenue.controller.ts', service: 'revenue.service.ts' },
  { route: 'payerAccount.routes.ts', controller: 'payerAccount.controller.ts', service: 'payerAccount.service.ts' },
  { route: 'partner.routes.ts', controller: 'partner.controller.ts', service: 'partner.service.ts' }
];

// Adicionar endpoint /stats em routes
modules.forEach(module => {
  const routePath = path.join(__dirname, '../src/routes', module.route);
  
  if (fs.existsSync(routePath)) {
    let content = fs.readFileSync(routePath, 'utf8');
    
    // Adicionar rota /stats se não existir
    if (!content.includes("router.get('/stats'")) {
      // Encontrar onde adicionar
      const insertPoint = content.indexOf('// CRUD básico') || 
                         content.indexOf('router.get(\'/\'') ||
                         content.indexOf('router.use(authenticate)');
      
      if (insertPoint > -1) {
        const lines = content.split('\n');
        let insertLine = 0;
        let currentPos = 0;
        
        for (let i = 0; i < lines.length; i++) {
          currentPos += lines[i].length + 1;
          if (currentPos > insertPoint) {
            insertLine = i;
            break;
          }
        }
        
        // Inserir após authenticate
        lines.splice(insertLine + 1, 0, 
          '',
          '// Estatísticas',
          `router.get('/stats', ${module.controller.replace('.ts', '')}.stats);`,
          ''
        );
        
        content = lines.join('\n');
        fs.writeFileSync(routePath, content, 'utf8');
        console.log(`✅ Added /stats route to ${module.route}`);
      }
    }
  }
});

console.log('🎉 Stats endpoints added!');