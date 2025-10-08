const fs = require('fs');
const path = require('path');

// Function to fix TypeScript compilation errors
function fixTypeScriptErrors(content, filePath) {
  let fixed = content;
  
  // 1. Fix variable naming issues - change _variable back to variable
  const variableMappings = {
    '_limit': 'limit',
    '_answers': 'answers', 
    '_context': 'context',
    '_suggestions': 'suggestions',
    '_metrics': 'metrics',
    '_historicalData': 'historicalData',
    '_result': 'result',
    '_entry': 'entry',
    '_duration': 'duration',
    '_next': 'next',
    '_session': 'session',
    '_userSegments': 'userSegments',
    '_multiIntentData': 'multiIntentData',
    '_crisisScenarios': 'crisisScenarios',
    '_identifyKnowledgeGap': 'identifyKnowledgeGap',
    '_interactionPatterns': 'interactionPatterns',
    '_PCL5_QUESTIONS': 'PCL5_QUESTIONS',
    '_EDEQ_QUESTIONS': 'EDEQ_QUESTIONS',
    '_CSSRS_QUESTIONS': 'CSSRS_QUESTIONS',
    '_specializedScales': 'specializedScales',
    '_scorePHQ9': 'scorePHQ9',
    '_currentMetrics': 'currentMetrics'
  };
  
  // Replace all _variable with variable
  for (const [underscoreVar, normalVar] of Object.entries(variableMappings)) {
    // Only replace if it's a variable name (not part of a string or comment)
    const regex = new RegExp(`\\b${underscoreVar}\\b`, 'g');
    fixed = fixed.replace(regex, normalVar);
  }
  
  // 2. Fix import issues - remove underscore from imports
  fixed = fixed.replace(/import\s*{\s*_(\w+)\s*}/g, 'import { $1 }');
  fixed = fixed.replace(/import\s*{\s*_(\w+)\s*,\s*_(\w+)\s*}/g, 'import { $1, $2 }');
  fixed = fixed.replace(/import\s*{\s*_(\w+)\s*,\s*_(\w+)\s*,\s*_(\w+)\s*}/g, 'import { $1, $2, $3 }');
  
  // 3. Add missing mongoose import if needed
  if (fixed.includes('mongoose.') && !fixed.includes("import mongoose")) {
    // Find the last import statement
    const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
    const imports = fixed.match(importRegex);
    if (imports) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = fixed.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      fixed = fixed.slice(0, insertIndex) + "\nimport mongoose from 'mongoose';" + fixed.slice(insertIndex);
    }
  }
  
  // 4. Fix req._params to req.params
  fixed = fixed.replace(/req\._params/g, 'req.params');
  
  // 5. Fix callback naming issues
  fixed = fixed.replace(/function\s*\(\s*_next\s*\)/g, 'function (next)');
  fixed = fixed.replace(/async\s+function\s*\(\s*_next\s*\)/g, 'async function (next)');
  
  return fixed;
}

// Function to find all TypeScript files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findTsFiles(fullPath));
    } else if (item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'backend', 'src');
const tsFiles = findTsFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files to process...`);

let fixedCount = 0;
for (const filePath of tsFiles) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixed = fixTypeScriptErrors(content, filePath);
    
    if (content !== fixed) {
      fs.writeFileSync(filePath, fixed, 'utf8');
      console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

console.log(`\nFixed ${fixedCount} files.`);
console.log('TypeScript compilation errors have been fixed!');
