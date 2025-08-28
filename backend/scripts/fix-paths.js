const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Corrige os imports @/
      content = content.replace(
        /require\(["']@\/([^"']+)["']\)/g,
        (match, p1) => {
          const levels = filePath.split('/dist/')[1].split('/').length - 1;
          const prefix = levels > 0 ? '../'.repeat(levels) : './';
          return `require("${prefix}${p1}")`;
        }
      );
      
      fs.writeFileSync(filePath, content);
    }
  });
}

console.log('Corrigindo paths em dist/...');
fixImports(path.join(__dirname, '..', 'dist'));
console.log('✅ Paths corrigidos!');