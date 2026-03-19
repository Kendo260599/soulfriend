const fs = require('fs');
const path = require('path');

// Read curriculum
const curricPath = path.join(__dirname, 'content', 'cambridge_curriculum.json');
const data = JSON.parse(fs.readFileSync(curricPath, 'utf8'));

// New B1 vocabulary lessons (13-19)
const newB1Lessons = [
  {
    "id": "VOC-B1-13",
    "order": 37,
    "level": "B1",
    "title": "Business and Professional Skills",
    "focus": "EN: negotiation, marketing, finance terms | VI: đàm phán, tiếp thị, thuật ngữ tài chính",
    "objective": "EN: Discuss business and professional contexts. | VI: Thảo luận về bối cảnh kinh doanh và chuyên môn.",
    "topic_ielts": "Business and Professional",
    "focus_en": "negotiation, marketing, finance terms",
    "focus_vi": "đàm phán, tiếp thị, thuật ngữ tài chính",
    "objective_en": "Discuss business and professional contexts.",
    "objective_vi": "Thảo luận về bối cảnh kinh doanh và chuyên môn.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "business-professional",
    "source_refs": ["IELTS-business", "Cambridge-B1"]
  },
  {
    "id": "VOC-B1-14",
    "order": 38,
    "level": "B1",
    "title": "Academic Study Skills",
    "focus": "EN: research, essay, critical thinking | VI: nghiên cứu, bài luận, tư duy phản biện",
    "objective": "EN: Talk about academic topics and study methods. | VI: Thảo luận về chủ đề học thuật và phương pháp học tập.",
    "topic_ielts": "Education and Academic",
    "focus_en": "research, essay, critical thinking",
    "focus_vi": "nghiên cứu, bài luận, tư duy phản biện",
    "objective_en": "Talk about academic topics and study methods.",
    "objective_vi": "Thảo luận về chủ đề học thuật và phương pháp học tập.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "academic",
    "source_refs": ["IELTS-Academic", "Cambridge-B1"]
  },
  {
    "id": "VOC-B1-15",
    "order": 39,
    "level": "B1",
    "title": "Environmental Issues",
    "focus": "EN: climate change, pollution, sustainability | VI: biến đổi khí hậu, ô nhiễm, bền vững",
    "objective": "EN: Discuss environmental topics and solutions. | VI: Thảo luận về các vấn đề môi trường và giải pháp.",
    "topic_ielts": "Environment and Sustainability",
    "focus_en": "climate change, pollution, sustainability",
    "focus_vi": "biến đổi khí hậu, ô nhiễm, bền vững",
    "objective_en": "Discuss environmental topics and solutions.",
    "objective_vi": "Thảo luận về các vấn đề môi trường và giải pháp.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "environment",
    "source_refs": ["IELTS-PT", "Cambridge-B1"]
  },
  {
    "id": "VOC-B1-16",
    "order": 40,
    "level": "B1",
    "title": "Technology and Digital Life",
    "focus": "EN: artificial intelligence, cybersecurity, digital transformation | VI: trí tuệ nhân tạo, an ninh mạng, chuyển đổi số",
    "objective": "EN: Discuss technology trends and digital transformation. | VI: Thảo luận về xu hướng công nghệ và chuyển đổi số.",
    "topic_ielts": "Technology",
    "focus_en": "artificial intelligence, cybersecurity, digital transformation",
    "focus_vi": "trí tuệ nhân tạo, an ninh mạng, chuyển đổi số",
    "objective_en": "Discuss technology trends and digital transformation.",
    "objective_vi": "Thảo luận về xu hướng công nghệ và chuyển đổi số.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "technology",
    "source_refs": ["IELTS-PT", "Cambridge-B1"]
  },
  {
    "id": "VOC-B1-17",
    "order": 41,
    "level": "B1",
    "title": "Health and Wellness",
    "focus": "EN: mental health, nutrition, fitness | VI: sức khỏe tâm thần, dinh dưỡng, thể dục",
    "objective": "EN: Discuss health topics and wellness practices. | VI: Thảo luận về sức khỏe và các hoạt động chăm sóc sức khỏe.",
    "topic_ielts": "Health and Medicine",
    "focus_en": "mental health, nutrition, fitness",
    "focus_vi": "sức khỏe tâm thần, dinh dưỡng, thể dục",
    "objective_en": "Discuss health topics and wellness practices.",
    "objective_vi": "Thảo luận về sức khỏe và các hoạt động chăm sóc sức khỏe.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "health",
    "source_refs": ["IELTS-PT", "Cambridge-B1"]
  },
  {
    "id": "VOC-B1-18",
    "order": 42,
    "level": "B1",
    "title": "Social Issues and Opinions",
    "focus": "EN: equality, diversity, social change | VI: bình đẳng, đa dạng, thay đổi xã hội",
    "objective": "EN: Express views on social issues and current events. | VI: Nêu quan điểm về vấn đề xã hội và sự kiện hiện tại.",
    "topic_ielts": "Social Issues",
    "focus_en": "equality, diversity, social change",
    "focus_vi": "bình đẳng, đa dạng, thay đổi xã hội",
    "objective_en": "Express views on social issues and current events.",
    "objective_vi": "Nêu quan điểm về vấn đề xã hội và sự kiện hiện tại.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "social",
    "source_refs": ["IELTS-PT", "Cambridge-B1"]
  },
  {
    "id": "VOC-B1-19",
    "order": 43,
    "level": "B1",
    "title": "Cultural Diversity",
    "focus": "EN: traditions, customs, cultural heritage | VI: truyền thống, phong tục, di sản văn hóa",
    "objective": "EN: Discuss cultural topics and traditions. | VI: Thảo luận về chủ đề văn hóa và truyền thống.",
    "topic_ielts": "Culture and Society",
    "focus_en": "traditions, customs, cultural heritage",
    "focus_vi": "truyền thống, phong tục, di sản văn hóa",
    "objective_en": "Discuss cultural topics and traditions.",
    "objective_vi": "Thảo luận về chủ đề văn hóa và truyền thống.",
    "cefr_target": "B1",
    "coca_frequency_band": "2000-5000",
    "source_standard": "culture",
    "source_refs": ["IELTS-Academic", "Cambridge-B1"]
  }
];

// Add new lessons to vocab
data.tracks.vocab.push(...newB1Lessons);

// Write back
fs.writeFileSync(curricPath, JSON.stringify(data, null, 2));

console.log('\n✨ Added 7 new B1 vocabulary lessons (VOC-B1-13 to VOC-B1-19)');

// Verify
const vocabTotal = data.tracks.vocab.length;
const a1 = data.tracks.vocab.filter(x => x.level === 'A1').length;
const a2 = data.tracks.vocab.filter(x => x.level === 'A2').length;
const b1 = data.tracks.vocab.filter(x => x.level === 'B1').length;

console.log(`\n📊 Updated Curriculum:`);
console.log(`✨ Total Vocab: ${vocabTotal}`);
console.log(`  A1: ${a1}`);
console.log(`  A2: ${a2}`);
console.log(`  B1: ${b1}`);
console.log(`✨ Total Grammar: ${data.tracks.grammar.length}`);
console.log(`  A1: ${data.tracks.grammar.filter(x => x.level === 'A1').length}`);
console.log(`  A2: ${data.tracks.grammar.filter(x => x.level === 'A2').length}`);
console.log(`  B1: ${data.tracks.grammar.filter(x => x.level === 'B1').length}`);
console.log(`\n🎉 Total Lessons: ${vocabTotal + data.tracks.grammar.length}`);
