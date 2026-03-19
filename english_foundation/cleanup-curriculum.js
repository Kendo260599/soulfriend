const fs = require('fs');
const path = require('path');

// Read curriculum
const curricPath = path.join(__dirname, 'content', 'cambridge_curriculum.json');
const data = JSON.parse(fs.readFileSync(curricPath, 'utf8'));

// Fix vocab: remove duplicate B1 entries (keep first 12, remove duplicates)
const vocabCleaned = [];
const seenIds = new Set();

data.tracks.vocab.forEach(item => {
  if (!seenIds.has(item.id)) {
    vocabCleaned.push(item);
    seenIds.add(item.id);
    console.log(`✅ Vocab ${item.id}: ${item.title}`);
  } else {
    console.log(`🗑️  Removed duplicate ${item.id}`);
  }
});

// Fix grammar: remove duplicate grammar entries (GRM-* with GR-*)
const grammarCleaned = [];
const seenGrammarIds = new Set();

data.tracks.grammar.forEach(item => {
  // Skip GRM-* entries if we already have a GR-* version
  const normalizedId = item.id.replace('GRM-', 'GR-');
  if (!seenGrammarIds.has(normalizedId)) {
    // Rename GRM-* to GR-* for consistency
    if (item.id.startsWith('GRM-')) {
      item.id = normalizedId;
    }
    grammarCleaned.push(item);
    seenGrammarIds.add(item.id);
    console.log(`✅ Grammar ${item.id}: ${item.title}`);
  } else {
    console.log(`🗑️  Removed duplicate ${item.id}`);
  }
});

// Update data
data.tracks.vocab = vocabCleaned;
data.tracks.grammar = grammarCleaned;

// Write back
fs.writeFileSync(curricPath, JSON.stringify(data, null, 2));

console.log('\n📊 Cleanup Complete!');
console.log(`✨ Vocab lessons: ${vocabCleaned.length}`);
console.log(`  A1: ${vocabCleaned.filter(x => x.level === 'A1').length}`);
console.log(`  A2: ${vocabCleaned.filter(x => x.level === 'A2').length}`);
console.log(`  B1: ${vocabCleaned.filter(x => x.level === 'B1').length}`);

console.log(`✨ Grammar lessons: ${grammarCleaned.length}`);
console.log(`  A1: ${grammarCleaned.filter(x => x.level === 'A1').length}`);
console.log(`  A2: ${grammarCleaned.filter(x => x.level === 'A2').length}`);
console.log(`  B1: ${grammarCleaned.filter(x => x.level === 'B1').length}`);
