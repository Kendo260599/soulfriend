const fs = require('fs');
const path = require('path');

// Simple fix for trailing commas
function fixTrailingCommas(content) {
  // Fix missing trailing commas in function parameters
  return content
    .replace(/(\w+)\s*\n(\s*\))/g, '$1,\n$2')
    .replace(/(\w+)\s*\n(\s*[}\])])/g, '$1,\n$2')
    .replace(/(\w+)\s*$/gm, (match, p1) => {
      if (match.includes(':')) {
        return match + ',';
      }
      return match;
    });
}

// Fix specific files with known issues
const filesToFix = [
  'backend/src/config/environment.ts',
  'backend/src/controllers/chatbotController.ts',
  'backend/src/index.ts'
];

filesToFix.forEach(filePath => {
  try {
    console.log(`Fixing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    content = fixTrailingCommas(content);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('🎉 Trailing comma fixes completed!');

