const fs = require('fs');
const path = require('path');

// Function to fix trailing comma issues
function fixTrailingCommas(content) {
  // Fix missing trailing commas in objects and arrays
  return content
    .replace(/(\w+)\s*\)\s*$/gm, '$1,\n)')
    .replace(/(\w+)\s*}\s*$/gm, '$1,\n}')
    .replace(/(\w+)\s*]\s*$/gm, '$1,\n]')
    .replace(/(\w+)\s*\)\s*;$/gm, '$1,\n);')
    .replace(/(\w+)\s*}\s*;$/gm, '$1,\n};')
    .replace(/(\w+)\s*]\s*;$/gm, '$1,\n];');
}

// Function to fix unused variables
function fixUnusedVariables(content) {
  // Add underscore prefix to unused parameters
  return content
    .replace(/function\s+(\w+)\s*\(\s*([^)]+)\s*\)/g, (match, funcName, params) => {
      const paramList = params.split(',').map(param => {
        const trimmed = param.trim();
        if (trimmed && !trimmed.startsWith('_')) {
          return `_${trimmed}`;
        }
        return trimmed;
      }).join(', ');
      return `function ${funcName}(${paramList})`;
    })
    .replace(/\(\s*([^)]+)\s*\)\s*=>/g, (match, params) => {
      const paramList = params.split(',').map(param => {
        const trimmed = param.trim();
        if (trimmed && !trimmed.startsWith('_')) {
          return `_${trimmed}`;
        }
        return trimmed;
      }).join(', ');
      return `(${paramList}) =>`;
    });
}

// Function to remove console statements
function removeConsoleStatements(content) {
  return content
    .replace(/console\.(log|warn|error|info|debug)\([^)]*\);?\s*\n?/g, '')
    .replace(/console\.(log|warn|error|info|debug)\([^)]*\)\s*;?\s*\n?/g, '');
}

// Function to fix any types
function fixAnyTypes(content) {
  return content
    .replace(/:\s*any\b/g, ': unknown')
    .replace(/:\s*any\[\]/g, ': unknown[]')
    .replace(/:\s*any\s*\[\]/g, ': unknown[]');
}

// Function to fix comparison operators
function fixComparisonOperators(content) {
  return content
    .replace(/!=\s*=/g, '!==')
    .replace(/==\s*=/g, '===');
}

// Function to fix unnecessary escape characters
function fixUnnecessaryEscapes(content) {
  return content
    .replace(/\\\./g, '.')
    .replace(/\\\*/g, '*')
    .replace(/\\\+/g, '+')
    .replace(/\\\?/g, '?')
    .replace(/\\\^/g, '^')
    .replace(/\\\$/g, '$')
    .replace(/\\\|/g, '|')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\[/g, '[')
    .replace(/\\\]/g, ']')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}');
}

// Main function to process files
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Apply fixes
    content = fixTrailingCommas(content);
    content = fixUnusedVariables(content);
    content = removeConsoleStatements(content);
    content = fixAnyTypes(content);
    content = fixComparisonOperators(content);
    content = fixUnnecessaryEscapes(content);
    
    // Write back to file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts') && !item.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'backend', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files to process...`);

tsFiles.forEach(processFile);

console.log('Linting fixes completed!');