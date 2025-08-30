#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';

// Adicionar rota /stats no payerAccount.routes.ts
const payerAccountRoutesPath = path.join(__dirname, '../src/routes/payerAccount.routes.ts');
let payerAccountRoutes = fs.readFileSync(payerAccountRoutesPath, 'utf8');

if (!payerAccountRoutes.includes("router.get('/stats'")) {
  payerAccountRoutes = payerAccountRoutes.replace(
    '// CRUD básico',
    `// Estatísticas
router.get('/stats',
  payerAccountController.stats
);

// CRUD básico`
  );
  fs.writeFileSync(payerAccountRoutesPath, payerAccountRoutes);
  console.log('✅ Added /stats route to payerAccount.routes.ts');
}

// Adicionar rota /stats no partner.routes.ts
const partnerRoutesPath = path.join(__dirname, '../src/routes/partner.routes.ts');
let partnerRoutes = fs.readFileSync(partnerRoutesPath, 'utf8');

if (!partnerRoutes.includes("router.get('/stats'")) {
  partnerRoutes = partnerRoutes.replace(
    '// CRUD básico',
    `// Estatísticas
router.get('/stats',
  partnerController.stats
);

// CRUD básico`
  );
  fs.writeFileSync(partnerRoutesPath, partnerRoutes);
  console.log('✅ Added /stats route to partner.routes.ts');
}

// Adicionar método stats no PayerAccountController
const payerAccountControllerPath = path.join(__dirname, '../src/controllers/payerAccount.controller.ts');
let payerAccountController = fs.readFileSync(payerAccountControllerPath, 'utf8');

if (!payerAccountController.includes('async stats(')) {
  const showMethodEnd = payerAccountController.indexOf('  async create(');
  if (showMethodEnd > -1) {
    const before = payerAccountController.substring(0, showMethodEnd);
    const after = payerAccountController.substring(showMethodEnd);
    
    payerAccountController = before + `
  /**
   * GET /payer-accounts/stats
   * Retorna estatísticas gerais
   */
  async stats(req: Request, res: Response): Promise<void> {
    const stats = await payerAccountService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }

  ` + after;
    
    fs.writeFileSync(payerAccountControllerPath, payerAccountController);
    console.log('✅ Added stats method to PayerAccountController');
  }
}

// Adicionar método stats no PartnerController
const partnerControllerPath = path.join(__dirname, '../src/controllers/partner.controller.ts');
let partnerController = fs.readFileSync(partnerControllerPath, 'utf8');

if (!partnerController.includes('async stats(')) {
  const showMethodEnd = partnerController.indexOf('  async create(');
  if (showMethodEnd > -1) {
    const before = partnerController.substring(0, showMethodEnd);
    const after = partnerController.substring(showMethodEnd);
    
    partnerController = before + `
  /**
   * GET /partners/stats
   * Retorna estatísticas gerais
   */
  async stats(req: Request, res: Response): Promise<void> {
    const stats = await partnerService.getStats();

    res.json({
      status: 'success',
      data: stats,
    });
  }

  ` + after;
    
    fs.writeFileSync(partnerControllerPath, partnerController);
    console.log('✅ Added stats method to PartnerController');
  }
}

// Adicionar método getStats no PayerAccountService
const payerAccountServicePath = path.join(__dirname, '../src/services/payerAccount.service.ts');
let payerAccountService = fs.readFileSync(payerAccountServicePath, 'utf8');

if (!payerAccountService.includes('async getStats(')) {
  const classEnd = payerAccountService.lastIndexOf('}');
  if (classEnd > -1) {
    payerAccountService = payerAccountService.substring(0, classEnd) + `
  async getStats() {
    const accounts = await this.payerAccountRepository.findAll({});
    const total = accounts.data.length;
    const totalBalance = accounts.data.reduce((sum, acc) => sum + acc.balance, 0);
    
    const byType = {
      CHECKING: accounts.data.filter(a => a.accountType === 'CHECKING').length,
      SAVINGS: accounts.data.filter(a => a.accountType === 'SAVINGS').length,
      INVESTMENT: accounts.data.filter(a => a.accountType === 'INVESTMENT').length,
      CREDIT: accounts.data.filter(a => a.accountType === 'CREDIT').length,
    };

    return {
      total,
      active: accounts.data.filter(a => a.isActive).length,
      inactive: accounts.data.filter(a => !a.isActive).length,
      totalBalance,
      averageBalance: total > 0 ? totalBalance / total : 0,
      byType
    };
  }
}` + payerAccountService.substring(classEnd + 1);
    
    fs.writeFileSync(payerAccountServicePath, payerAccountService);
    console.log('✅ Added getStats method to PayerAccountService');
  }
}

// Adicionar método getStats no PartnerService
const partnerServicePath = path.join(__dirname, '../src/services/partner.service.ts');
let partnerService = fs.readFileSync(partnerServicePath, 'utf8');

if (!partnerService.includes('async getStats(')) {
  const classEnd = partnerService.lastIndexOf('}');
  if (classEnd > -1) {
    partnerService = partnerService.substring(0, classEnd) + `
  async getStats() {
    const partners = await this.partnerRepository.findAll({});
    const total = partners.data.length;
    
    const byType = {
      VENDOR: partners.data.filter(p => p.type === 'VENDOR').length,
      BUYER: partners.data.filter(p => p.type === 'BUYER').length,
      BROKER: partners.data.filter(p => p.type === 'BROKER').length,
      PARTNER: partners.data.filter(p => p.type === 'PARTNER').length,
      EMPLOYEE: partners.data.filter(p => p.type === 'EMPLOYEE').length,
      OTHER: partners.data.filter(p => p.type === 'OTHER').length,
    };

    return {
      total,
      active: partners.data.filter(p => p.isActive).length,
      inactive: partners.data.filter(p => !p.isActive).length,
      byType
    };
  }
}` + partnerService.substring(classEnd + 1);
    
    fs.writeFileSync(partnerServicePath, partnerService);
    console.log('✅ Added getStats method to PartnerService');
  }
}

console.log('🎉 Stats endpoints fixed!');