const fs = require('fs');

// Read existing curriculum
const curriculum = JSON.parse(fs.readFileSync('./content/cambridge_curriculum.json', 'utf-8'));

// New B1 vocabulary lessons (7 lessons covering B1-level topics)
const b1VocabLessons = [
  {
    id: "VOC-B1-01",
    order: 17,
    level: "B1",
    title: "Business and Professional Skills",
    focus: "EN: career goals, workplace communication, professional language | VI: mục tiêu nghề nghiệp, giao tiếp nơi làm việc, ngôn ngữ chuyên nghiệp",
    objective: "EN: Discuss career goals and professional interactions. | VI: Thảo luận mục tiêu sự nghiệp và tương tác chuyên nghiệp.",
    topic_ielts: "Work and Employment",
    focus_en: "career goals, workplace communication, professional language",
    focus_vi: "mục tiêu nghề nghiệp, giao tiếp nơi làm việc, ngôn ngữ chuyên nghiệp",
    objective_en: "Discuss career goals and professional interactions.",
    objective_vi: "Thảo luận mục tiêu sự nghiệp và tương tác chuyên nghiệp.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  },
  {
    id: "VOC-B1-02",
    order: 18,
    level: "B1",
    title: "Academic Study Skills",
    focus: "EN: research, analysis, academic writing vocabulary | VI: nghiên cứu, phân tích, từ vựng viết học thuật",
    objective: "EN: Use academic language for research and discussion. | VI: Sử dụng ngôn ngữ học thuật cho nghiên cứu và thảo luận.",
    topic_ielts: "Education",
    focus_en: "research, analysis, academic writing vocabulary",
    focus_vi: "nghiên cứu, phân tích, từ vựng viết học thuật",
    objective_en: "Use academic language for research and discussion.",
    objective_vi: "Sử dụng ngôn ngữ học thuật cho nghiên cứu và thảo luận.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  },
  {
    id: "VOC-B1-03",
    order: 19,
    level: "B1",
    title: "Travel and Culture",
    focus: "EN: travel planning, cultural experiences, tourism vocabulary | VI: lập kế hoạch du lịch, trải nghiệm văn hóa, từ vựng du lịch",
    objective: "EN: Describe travel experiences and cultural differences. | VI: Mô tả trải nghiệm du lịch và khác biệt văn hóa.",
    topic_ielts: "Travel and Transport",
    focus_en: "travel planning, cultural experiences, tourism vocabulary",
    focus_vi: "lập kế hoạch du lịch, trải nghiệm văn hóa, từ vựng du lịch",
    objective_en: "Describe travel experiences and cultural differences.",
    objective_vi: "Mô tả trải nghiệm du lịch và khác biệt văn hóa.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  },
  {
    id: "VOC-B1-04",
    order: 20,
    level: "B1",
    title: "Environmental and Social Issues",
    focus: "EN: sustainability, social responsibility, environmental concerns | VI: tính bền vững, trách nhiệm xã hội, lo ngại môi trường",
    objective: "EN: Discuss environmental and social topics. | VI: Thảo luận các chủ đề môi trường và xã hội.",
    topic_ielts: "Environment",
    focus_en: "sustainability, social responsibility, environmental concerns",
    focus_vi: "tính bền vững, trách nhiệm xã hội, lo ngại môi trường",
    objective_en: "Discuss environmental and social topics.",
    objective_vi: "Thảo luận các chủ đề môi trường và xã hội.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  },
  {
    id: "VOC-B1-05",
    order: 21,
    level: "B1",
    title: "Technology and Digital Life",
    focus: "EN: digital communication, tech trends, online behavior | VI: giao tiếp kỹ thuật số, xu hướng công nghệ, hành vi trực tuyến",
    objective: "EN: Discuss technology and digital trends. | VI: Thảo luận công nghệ và xu hướng kỹ thuật số.",
    topic_ielts: "Technology and Internet",
    focus_en: "digital communication, tech trends, online behavior",
    focus_vi: "giao tiếp kỹ thuật số, xu hướng công nghệ, hành vi trực tuyến",
    objective_en: "Discuss technology and digital trends.",
    objective_vi: "Thảo luận công nghệ và xu hướng kỹ thuật số.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  },
  {
    id: "VOC-B1-06",
    order: 22,
    level: "B1",
    title: "Health and Wellness",
    focus: "EN: mental health, fitness trends, medical terminology | VI: sức khỏe tâm thần, xu hướng thể chất, thuật ngữ y tế",
    objective: "EN: Discuss health topics and wellness practices. | VI: Thảo luận các chủ đề sức khỏe và thực hành wellness.",
    topic_ielts: "Health and Lifestyle",
    focus_en: "mental health, fitness trends, medical terminology",
    focus_vi: "sức khỏe tâm thần, xu hướng thể chất, thuật ngữ y tế",
    objective_en: "Discuss health topics and wellness practices.",
    objective_vi: "Thảo luận các chủ đề sức khỏe và thực hành wellness.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  },
  {
    id: "VOC-B1-07",
    order: 23,
    level: "B1",
    title: "Opinions and Debates",
    focus: "EN: expressing opinions, argumentation, debate vocabulary | VI: bày tỏ quan điểm, lập luận, từ vựng tranh luận",
    objective: "EN: Build and defend arguments on various topics. | VI: Xây dựng và bảo vệ quan điểm trên các chủ đề.",
    topic_ielts: "Opinion and Argument",
    focus_en: "expressing opinions, argumentation, debate vocabulary",
    focus_vi: "bày tỏ quan điểm, lập luận, từ vựng tranh luận",
    objective_en: "Build and defend arguments on various topics.",
    objective_vi: "Xây dựng và bảo vệ quan điểm trên các chủ đề.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1", "Oxford-B1"]
  }
];

// New B1 grammar lessons (focus on complex structures)
const b1GrammarLessons = [
  {
    id: "GRM-B1-01",
    order: 17,
    level: "B1",
    title: "Conditional Sentences (Type 1 & 2)",
    focus: "EN: if clauses, conditional probability | VI: mệnh đề if, xác suất điều kiện",
    objective: "EN: Use conditional sentences to express hypothetical situations. | VI: Sử dụng câu điều kiện cho tình huống giả định.",
    topic_ielts: "Grammar",
    focus_en: "if clauses, conditional probability",
    focus_vi: "mệnh đề if, xác suất điều kiện",
    objective_en: "Use conditional sentences to express hypothetical situations.",
    objective_vi: "Sử dụng câu điều kiện cho tình huống giả định.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1"]
  },
  {
    id: "GRM-B1-02",
    order: 18,
    level: "B1",
    title: "Passive Voice",
    focus: "EN: be + past participle, agent phrases | VI: bị động, cách nói tác nhân",
    objective: "EN: Construct passive sentences and recognize voice choice. | VI: Xây dựng câu bị động và nhận biết sự lựa chọn thể.",
    topic_ielts: "Grammar",
    focus_en: "be + past participle, agent phrases",
    focus_vi: "bị động, cách nói tác nhân",
    objective_en: "Construct passive sentences and recognize voice choice.",
    objective_vi: "Xây dựng câu bị động và nhận biết sự lựa chọn thể.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1"]
  },
  {
    id: "GRM-B1-03",
    order: 19,
    level: "B1",
    title: "Relative Clauses",
    focus: "EN: who, which, that, where, whose clauses | VI: mệnh đề quan hệ",
    objective: "EN: Use relative clauses to provide additional information. | VI: Sử dụng mệnh đề quan hệ để cung cấp thông tin bổ sung.",
    topic_ielts: "Grammar",
    focus_en: "who, which, that, where, whose clauses",
    focus_vi: "mệnh đề quan hệ",
    objective_en: "Use relative clauses to provide additional information.",
    objective_vi: "Sử dụng mệnh đề quan hệ để cung cấp thông tin bổ sung.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1"]
  },
  {
    id: "GRM-B1-04",
    order: 20,
    level: "B1",
    title: "Phrasal Verbs",
    focus: "EN: verb + particle combinations | VI: động từ đa từ",
    objective: "EN: Recognize and use common phrasal verbs. | VI: Nhận biết và sử dụng các động từ đa từ phổ biến.",
    topic_ielts: "Grammar",
    focus_en: "verb + particle combinations",
    focus_vi: "động từ đa từ",
    objective_en: "Recognize and use common phrasal verbs.",
    objective_vi: "Nhận biết và sử dụng các động từ đa từ phổ biến.",
    cefr_target: "B1",
    coca_frequency_band: "5001-10000",
    source_standard: "cefr-aligned",
    source_refs: ["CEFR-B1", "Cambridge-B1"]
  }
];

// Append lessons to tracks
curriculum.tracks.vocab.push(...b1VocabLessons);
curriculum.tracks.grammar = curriculum.tracks.grammar || [];
curriculum.tracks.grammar.push(...b1GrammarLessons);

// Save updated curriculum
fs.writeFileSync('./content/cambridge_curriculum.json', JSON.stringify(curriculum, null, 2));

console.log('✅ Curriculum expanded!');
console.log('📊 New totals:');

// Count by level
const vocabByLevel = {};
curriculum.tracks.vocab.forEach(x => {
  vocabByLevel[x.level] = (vocabByLevel[x.level] || 0) + 1;
});

const grammarByLevel = {};
curriculum.tracks.grammar.forEach(x => {
  grammarByLevel[x.level] = (grammarByLevel[x.level] || 0) + 1;
});

console.log('\n📚 Vocabulary Lessons:');
Object.keys(vocabByLevel).sort().forEach(k => console.log(`   ${k}: ${vocabByLevel[k]}`));

console.log('\n📖 Grammar Lessons:');
Object.keys(grammarByLevel).sort().forEach(k => console.log(`   ${k}: ${grammarByLevel[k]}`));

console.log(`\n✨ Total Lessons: ${curriculum.tracks.vocab.length + curriculum.tracks.grammar.length}`);
console.log('   - Vocab: ' + curriculum.tracks.vocab.length);
console.log('   - Grammar: ' + curriculum.tracks.grammar.length);
