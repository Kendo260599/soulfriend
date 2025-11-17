/**
 * Check Pinecone Vector Database
 * Verify if insights from chats are being saved to Pinecone
 */

require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const { Pinecone } = require('@pinecone-database/pinecone');

// MongoDB connection
// Use MONGODB_URI_PRODUCTION if available, otherwise use MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI_PRODUCTION || process.env.MONGODB_URI || 'mongodb://localhost:27017/soulfriend';

// Pinecone configuration
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'soulfriend-memories';

async function checkPinecone() {
  try {
    console.log('\n🔍 CHECKING PINECONE VECTOR DATABASE...\n');

    // ==========================================
    // 1. CHECK CONFIGURATION
    // ==========================================
    console.log('📋 Configuration:\n');
    console.log(`   Pinecone API Key: ${PINECONE_API_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`   Index Name: ${PINECONE_INDEX_NAME}`);
    
    const isProduction = MONGODB_URI.includes('mongodb+srv://') || MONGODB_URI.includes('mongodb.net');
    const mongoType = isProduction ? 'PRODUCTION (MongoDB Atlas)' : 'LOCAL (localhost)';
    console.log(`   MongoDB: ${mongoType}`);
    console.log(`   MongoDB URI: ${MONGODB_URI.replace(/:[^:@]+@/, ':***@')}\n`);

    if (!PINECONE_API_KEY) {
      console.log('❌ PINECONE_API_KEY not found in environment variables!');
      console.log('   Vector memory system is DISABLED.\n');
      console.log('💡 To enable Pinecone:');
      console.log('   1. Sign up at https://www.pinecone.io/');
      console.log('   2. Create a new index');
      console.log('   3. Add PINECONE_API_KEY to backend/.env');
      console.log('   4. Add PINECONE_INDEX_NAME to backend/.env\n');
      return;
    }

    // ==========================================
    // 2. CONNECT TO PINECONE
    // ==========================================
    console.log('🔌 Connecting to Pinecone...\n');
    const pinecone = new Pinecone({
      apiKey: PINECONE_API_KEY,
    });

    // ==========================================
    // 3. LIST INDEXES
    // ==========================================
    console.log('📊 Listing Pinecone indexes...\n');
    const indexes = await pinecone.listIndexes();
    
    if (!indexes || indexes.indexes.length === 0) {
      console.log('❌ No indexes found!');
      console.log('   You need to create an index first.\n');
      return;
    }

    console.log(`   Found ${indexes.indexes.length} index(es):\n`);
    for (const idx of indexes.indexes) {
      console.log(`   - ${idx.name}`);
      console.log(`     Dimension: ${idx.dimension}`);
      console.log(`     Metric: ${idx.metric}`);
      console.log(`     Status: ${idx.status?.state || 'unknown'}\n`);
    }

    // ==========================================
    // 4. CHECK TARGET INDEX
    // ==========================================
    const indexExists = indexes.indexes.find(idx => idx.name === PINECONE_INDEX_NAME);
    
    if (!indexExists) {
      console.log(`❌ Target index '${PINECONE_INDEX_NAME}' not found!`);
      console.log('   Available indexes:', indexes.indexes.map(i => i.name).join(', '));
      console.log('\n💡 Create the index or update PINECONE_INDEX_NAME in .env\n');
      return;
    }

    console.log(`✅ Target index '${PINECONE_INDEX_NAME}' found!\n`);

    // ==========================================
    // 5. QUERY INDEX STATS
    // ==========================================
    console.log('📈 Querying index statistics...\n');
    const index = pinecone.index(PINECONE_INDEX_NAME);
    const stats = await index.describeIndexStats();

    console.log('   Index Stats:');
    console.log(`   - Total vectors: ${stats.totalRecordCount || 0}`);
    console.log(`   - Dimension: ${stats.dimension || 'unknown'}`);
    console.log(`   - Index fullness: ${stats.indexFullness || 0}\n`);

    if (stats.totalRecordCount === 0) {
      console.log('⚠️  Index is EMPTY - No memories saved yet!\n');
      console.log('   This means:');
      console.log('   • No users have chatted yet, OR');
      console.log('   • Chatbot is not extracting insights, OR');
      console.log('   • saveLongTermMemory() is not being called\n');
    } else {
      console.log(`✅ Index has ${stats.totalRecordCount} vectors!\n`);
    }

    // ==========================================
    // 6. CHECK MONGODB LONG-TERM MEMORIES
    // ==========================================
    console.log('🔌 Connecting to MongoDB...\n');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB!\n');

    const LongTermMemory = mongoose.model('LongTermMemory', new mongoose.Schema({
      userId: String,
      type: String,
      content: String,
      vectorId: String,
      embeddingGenerated: Boolean,
      metadata: Object,
      createdAt: Date,
    }));

    const totalMemories = await LongTermMemory.countDocuments();
    const withVectors = await LongTermMemory.countDocuments({ embeddingGenerated: true });
    const withoutVectors = totalMemories - withVectors;

    console.log('📊 MongoDB Long-Term Memories:\n');
    console.log(`   Total memories: ${totalMemories}`);
    console.log(`   With vectors (Pinecone): ${withVectors} ✅`);
    console.log(`   Without vectors: ${withoutVectors} ${withoutVectors > 0 ? '⚠️' : ''}\n`);

    if (totalMemories === 0) {
      console.log('⚠️  No long-term memories in MongoDB!\n');
      console.log('   Possible reasons:');
      console.log('   • No users have chatted yet');
      console.log('   • extractInsightsBackground() is not being triggered');
      console.log('   • Messages are too short (< 15 chars) - FIXED in recent commit!\n');
    } else {
      // Show recent memories
      console.log('📝 Recent Memories (last 5):\n');
      const recent = await LongTermMemory.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('userId type content metadata.category createdAt embeddingGenerated');

      for (const mem of recent) {
        console.log(`   ${mem.embeddingGenerated ? '✅' : '❌'} [${mem.type}] ${mem.content.substring(0, 60)}...`);
        console.log(`      User: ${mem.userId} | Category: ${mem.metadata?.category || 'none'}`);
        console.log(`      Created: ${mem.createdAt?.toLocaleString() || 'unknown'}\n`);
      }
    }

    // ==========================================
    // 7. SUMMARY
    // ==========================================
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 PINECONE STATUS SUMMARY:');
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (PINECONE_API_KEY && indexExists) {
      console.log('✅ Pinecone: ENABLED');
      console.log(`✅ Index: ${PINECONE_INDEX_NAME} (${stats.totalRecordCount} vectors)`);
      console.log(`✅ MongoDB: ${totalMemories} memories (${withVectors} vectorized)`);
      
      if (totalMemories > 0 && stats.totalRecordCount === 0) {
        console.log('\n⚠️  WARNING: MongoDB has memories but Pinecone is empty!');
        console.log('   This suggests vectorization failed or index mismatch.\n');
      } else if (stats.totalRecordCount > 0) {
        console.log('\n🎉 System is working! Insights are being saved to Pinecone!\n');
      }
    } else {
      console.log('❌ Pinecone: DISABLED or INDEX NOT FOUND');
      console.log('   Long-term memory system not operational.\n');
    }

    await mongoose.connection.close();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error checking Pinecone:', error.message);
    console.error('\nStack trace:', error.stack);
  }
}

checkPinecone();
