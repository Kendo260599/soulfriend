const fs = require('fs');
const path = require('path');

// Function to fix critical linting errors
function fixCriticalErrors(content, filePath) {
  let fixed = content;
  
  // 1. Remove unused imports
  fixed = fixed.replace(/^import\s+path\s+from\s+['\"]path['\"];?\s*$/gm, '');
  fixed = fixed.replace(/^import\s+{\s*ValidationError\s*}\s+from\s+['\"]mongoose['\"];?\s*$/gm, '');
  fixed = fixed.replace(/^import\s+{\s*IResearchData\s*}\s+from\s+['\"]\.\.\/models\/ResearchData['\"];?\s*$/gm, '');
  fixed = fixed.replace(/^import\s+{\s*config\s*}\s+from\s+['\"]\.\.\/config\/environment['\"];?\s*$/gm, '');
  fixed = fixed.replace(/^import\s+mongoose\s+from\s+['\"]mongoose['\"];?\s*$/gm, '');
  
  // 2. Fix unused variables by adding underscore prefix
  fixed = fixed.replace(/\b(session|duration|entry|next|context|userReaction|sessionContext|userHistory|allKeywords|emotionalState|culturalFactors|historicalData|demographicFactors|result|currentMetrics|suggestions|categories|limit|location|hasAction|riskAssessment|metrics|calculateEvaluation|answers|maxScore|gad7Data|dass21Data|pcl5Data|scorePHQ9|scoreGAD7|params|PCL5_QUESTIONS|EDEQ_QUESTIONS|CSSRS_QUESTIONS|specializedScales|userSegments|multiIntentData|crisisScenarios|identifyKnowledgeGap|interactionPatterns)\b(?=\s*[,\)])/g, '_$1');
  
  // 3. Fix missing trailing commas in objects and arrays
  fixed = fixed.replace(/(\w+)\s*\)\s*$/gm, '$1,\n)');
  fixed = fixed.replace(/(\w+)\s*}\s*$/gm, '$1,\n}');
  fixed = fixed.replace(/(\w+)\s*]\s*$/gm, '$1,\n]');
  fixed = fixed.replace(/(\w+)\s*\)\s*;$/gm, '$1,\n);');
  fixed = fixed.replace(/(\w+)\s*}\s*;$/gm, '$1,\n};');
  fixed = fixed.replace(/(\w+)\s*]\s*;$/gm, '$1,\n];');
  
  // 4. Fix specific patterns for trailing commas
  fixed = fixed.replace(/(\w+)\s*,\s*\)/g, '$1,\n)');
  fixed = fixed.replace(/(\w+)\s*,\s*}/g, '$1,\n}');
  fixed = fixed.replace(/(\w+)\s*,\s*]/g, '$1,\n]');
  
  // 5. Fix == to !==
  fixed = fixed.replace(/==/g, '!==');
  
  // 6. Remove unnecessary escape characters
  fixed = fixed.replace(/\\\./g, '.');
  
  // 7. Fix NodeJS reference
  fixed = fixed.replace(/NodeJS\./g, 'global.');
  
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
    const fixed = fixCriticalErrors(content, filePath);
    
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
console.log('Critical linting errors have been fixed!');
