#!/usr/bin/env tsx
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const rootDir = join(__dirname, '..');

console.log('🔧 Corrigindo erros de compilação...\n');

// 1. Remover arquivos obsoletos
const filesToRemove = [
  'src/controllers/cattleLot.controller.ts',
  'src/controllers/purchaseOrder.controller.ts',
  'src/services/cattleLot.service.ts',
  'src/services/purchaseOrder.service.ts',
  'src/validations/cattleLot.validation.ts',
  'src/validations/purchaseOrder.validation.ts',
  'src/routes/cattleLot.routes.ts',
  'src/routes/purchaseOrder.routes.ts',
];

console.log('📁 Removendo arquivos obsoletos...');
filesToRemove.forEach(file => {
  const fullPath = join(rootDir, file);
  if (existsSync(fullPath)) {
    unlinkSync(fullPath);
    console.log(`  ✅ Removido: ${file}`);
  }
});

// 2. Corrigir importações em arquivos TypeScript
console.log('\n📝 Corrigindo importações...');

const files = glob.sync('src/**/*.ts', { cwd: rootDir });

files.forEach(file => {
  const filePath = join(rootDir, file);
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Remover importações de tipos obsoletos
  const oldImports = [
    /import.*PurchaseOrderStatus.*from.*@prisma\/client.*;/g,
    /import.*LotStatus.*from.*@prisma\/client.*;/g,
    /import.*UserRole.*from.*@prisma\/client.*;/g,
    /,\s*PurchaseOrderStatus/g,
    /,\s*LotStatus/g,
    /,\s*UserRole/g,
    /PurchaseOrderStatus\s*,/g,
    /LotStatus\s*,/g,
    /UserRole\s*,/g,
  ];

  oldImports.forEach(pattern => {
    if (pattern.test(content)) {
      content = content.replace(pattern, '');
      modified = true;
    }
  });

  // Remover referências a modelos antigos
  if (content.includes('cattleLot.')) {
    content = content.replace(/cattleLot\./g, 'cattlePurchase.');
    modified = true;
  }

  if (content.includes('purchaseOrder.')) {
    content = content.replace(/purchaseOrder\./g, 'cattlePurchase.');
    modified = true;
  }

  // Corrigir referências aos repositórios
  if (content.includes('.findAll(') && content.includes('Repository')) {
    // Adicionar os parâmetros corretos para findAll
    content = content.replace(
      /\.findAll\(\)/g, 
      '.findAll({}, undefined)'
    );
    modified = true;
  }

  // Corrigir parâmetros não utilizados
  if (content.includes('req: Request') && !content.includes('req.body') && !content.includes('req.query') && !content.includes('req.params')) {
    content = content.replace(/req: Request/g, '_req: Request');
    modified = true;
  }

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Corrigido: ${file}`);
  }
});

// 3. Corrigir repositories específicos
console.log('\n🔨 Corrigindo repositórios...');

const saleRecordRepo = join(rootDir, 'src/repositories/saleRecord.repository.ts');
if (existsSync(saleRecordRepo)) {
  let content = readFileSync(saleRecordRepo, 'utf-8');
  
  // Adicionar métodos faltantes se não existirem
  if (!content.includes('async findAll')) {
    const methods = `
  async findAll(where: any = {}, pagination?: any, include?: any) {
    const query: any = { where };
    
    if (pagination) {
      query.skip = pagination.skip;
      query.take = pagination.take;
    }
    
    if (include) {
      query.include = include;
    }
    
    const [items, total] = await Promise.all([
      this.model.findMany(query),
      this.model.count({ where })
    ]);
    
    return { items, total };
  }

  async create(data: any) {
    return this.model.create({ data });
  }

  async update(id: string, data: any) {
    return this.model.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.model.delete({
      where: { id }
    });
  }`;
    
    // Adicionar antes do fechamento da classe
    content = content.replace(/^}$/m, methods + '\n}');
    writeFileSync(saleRecordRepo, content, 'utf-8');
    console.log('  ✅ Corrigido: saleRecord.repository.ts');
  }
}

// 4. Corrigir serviços com problemas de tipos
console.log('\n🛠️ Corrigindo serviços...');

const expenseService = join(rootDir, 'src/services/expense.service.ts');
if (existsSync(expenseService)) {
  let content = readFileSync(expenseService, 'utf-8');
  content = content.replace(
    /\.findAll\((.*?), (.*?), (.*?)\)/g,
    '.findAll($1, $2)'
  );
  writeFileSync(expenseService, content, 'utf-8');
  console.log('  ✅ Corrigido: expense.service.ts');
}

const revenueService = join(rootDir, 'src/services/revenue.service.ts');
if (existsSync(revenueService)) {
  let content = readFileSync(revenueService, 'utf-8');
  content = content.replace(
    /\.findAll\((.*?), (.*?), (.*?)\)/g,
    '.findAll($1, $2)'
  );
  writeFileSync(revenueService, content, 'utf-8');
  console.log('  ✅ Corrigido: revenue.service.ts');
}

// 5. Corrigir app.ts para remover rotas obsoletas
const appFile = join(rootDir, 'src/app.ts');
if (existsSync(appFile)) {
  let content = readFileSync(appFile, 'utf-8');
  
  // Remover importações de rotas obsoletas
  content = content.replace(/import.*purchaseOrderRoutes.*\n/g, '');
  content = content.replace(/import.*cattleLotRoutes.*\n/g, '');
  
  // Remover uso das rotas
  content = content.replace(/.*app\.use.*purchaseOrderRoutes.*\n/g, '');
  content = content.replace(/.*app\.use.*cattleLotRoutes.*\n/g, '');
  
  writeFileSync(appFile, content, 'utf-8');
  console.log('  ✅ Corrigido: app.ts');
}

console.log('\n✨ Correções aplicadas com sucesso!');
console.log('Execute "npx tsc --noEmit" para verificar se ainda há erros.');