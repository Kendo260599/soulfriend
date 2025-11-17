import 'dotenv/config';
import redisService from './src/services/redisService';

async function cleanupRedisTestData() {
  try {
    console.log('🧹 Bắt đầu dọn dẹp Redis test data...\n');

    // Kết nối Redis
    await redisService.connect();

    const client = redisService.getClient();

    // Lấy tất cả keys
    const allKeys = await client.keys('*');
    console.log(`📦 Tổng số keys hiện tại: ${allKeys.length}\n`);

    if (allKeys.length === 0) {
      console.log('✅ Redis đã sạch, không có data nào cần xóa!\n');
      await redisService.disconnect();
      return;
    }

    // Hiển thị keys hiện có
    console.log('🔑 DANH SÁCH KEYS HIỆN TẠI:');
    allKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
    console.log('');

    // Tìm test keys (có chứa 'test', 'demo', 'foo', 'session:sess_', 'session:demo_')
    const testKeys = allKeys.filter(key => 
      key.includes('test') || 
      key.includes('demo') || 
      key === 'foo' ||
      key.startsWith('session:sess_') ||
      key.startsWith('session:demo_') ||
      key.startsWith('ratelimit:')
    );

    if (testKeys.length === 0) {
      console.log('✅ Không tìm thấy test keys nào cần xóa!\n');
      console.log(`💾 Production keys: ${allKeys.length}\n`);
      await redisService.disconnect();
      return;
    }

    console.log(`🎯 Tìm thấy ${testKeys.length} test keys:\n`);
    testKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });
    console.log('');

    // Xóa test keys
    console.log('🗑️  Đang xóa test keys...');
    const deleted = await redisService.delete(...testKeys);
    console.log(`✅ Đã xóa ${deleted} keys\n`);

    // Hiển thị keys còn lại
    const remainingKeys = await client.keys('*');
    console.log(`📊 TÌNH TRẠNG SAU KHI DỌN DẸP:`);
    console.log(`   • Keys trước: ${allKeys.length}`);
    console.log(`   • Keys đã xóa: ${deleted}`);
    console.log(`   • Keys còn lại: ${remainingKeys.length}\n`);

    if (remainingKeys.length > 0) {
      console.log('🔑 KEYS CÒN LẠI (Production data):');
      remainingKeys.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}`);
      });
    } else {
      console.log('🎉 Redis đã hoàn toàn sạch!');
    }

    // Thống kê memory
    const info = await client.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
    console.log(`\n💾 Bộ nhớ đang dùng: ${usedMemory || 'N/A'}\n`);

    console.log('═════════════════════════════════════════════════');
    console.log('✅ DỌN DẸP HOÀN TẤT!');
    console.log('═════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ LỖI:', error);
  } finally {
    await redisService.disconnect();
  }
}

cleanupRedisTestData();
