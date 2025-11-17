import 'dotenv/config';
import redisService from './src/services/redisService';

async function cleanupTestData() {
  try {
    console.log('🧹 Bắt đầu dọn dẹp test data từ Redis...\n');

    await redisService.connect();

    const client = redisService.getClient();
    
    // Lấy tất cả keys
    const allKeys = await client.keys('*');
    console.log(`📦 Tổng số keys hiện tại: ${allKeys.length}\n`);

    // Liệt kê các keys test
    const testKeys = allKeys.filter(key => 
      key.startsWith('test:') || 
      key.startsWith('session:demo_') ||
      key.startsWith('session:sess_') ||
      key === 'foo' ||
      key.startsWith('ratelimit:')
    );

    console.log('🔍 Keys test được tìm thấy:');
    testKeys.forEach((key, index) => {
      console.log(`   ${index + 1}. ${key}`);
    });

    if (testKeys.length === 0) {
      console.log('\n✅ Không có test data cần dọn dẹp!');
      await redisService.disconnect();
      return;
    }

    console.log(`\n🗑️ Đang xóa ${testKeys.length} test keys...`);

    // Xóa từng key
    let deletedCount = 0;
    for (const key of testKeys) {
      const result = await client.del(key);
      if (result > 0) {
        deletedCount++;
        console.log(`   ✅ Đã xóa: ${key}`);
      }
    }

    console.log(`\n✅ Đã dọn dẹp ${deletedCount}/${testKeys.length} keys`);

    // Kiểm tra lại
    const remainingKeys = await client.keys('*');
    console.log(`\n📦 Số keys còn lại: ${remainingKeys.length}`);
    
    if (remainingKeys.length > 0) {
      console.log('\n🔑 Keys còn lại trong database:');
      remainingKeys.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}`);
      });
    } else {
      console.log('\n✨ Database đã sạch hoàn toàn!');
    }

    await redisService.disconnect();
    console.log('\n🎉 Hoàn tất dọn dẹp!\n');

  } catch (error) {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  }
}

cleanupTestData();
