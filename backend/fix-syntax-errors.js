const fs = require('fs');
const path = require('path');

// Function to process files
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Fix double type annotations (: number: number -> : number)
  content = content.replace(/:\s*number\s*:\s*number/g, ': number');
  content = content.replace(/:\s*number\s*:\s*any/g, ': any');
  content = content.replace(/:\s*string\s*:\s*string/g, ': string');
  content = content.replace(/:\s*string\s*:\s*any/g, ': any');
  content = content.replace(/:\s*boolean\s*:\s*boolean/g, ': boolean');
  content = content.replace(/:\s*Date\s*:\s*Date/g, ': Date');
  
  // Also fix reduce callbacks that were incorrectly modified
  // Pattern: .reduce((sum: number, item) => sum + item.value, 0)
  // This is correct and shouldn't have double types
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
    return true;
  }
  return false;
}

// Process all TypeScript files
function processDirectory(dir) {
  let fixedCount = 0;
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
      fixedCount += processDirectory(fullPath);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      if (processFile(fullPath)) {
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

// Run the fix
console.log('Fixing syntax errors in TypeScript files...');
const srcPath = path.join(__dirname, 'src');
const fixedCount = processDirectory(srcPath);
console.log(`\nFixed ${fixedCount} files`);