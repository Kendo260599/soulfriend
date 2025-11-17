import 'dotenv/config';
import redisService from './src/services/redisService';

async function connectToSoulfriendRedis() {
  try {
    console.log('🔄 Đang kết nối với Redis Cloud - Database: soulfriend...\n');

    // Kết nối Redis
    await redisService.connect();

    console.log('\n✅ ĐÃ KẾT NỐI THÀNH CÔNG!\n');

    // Hiển thị thông tin database
    const client = redisService.getClient();
    
    console.log('📊 THÔNG TIN DATABASE:');
    console.log('─────────────────────────────────────────────────');
    console.log(`Host: ${process.env.REDIS_HOST}`);
    console.log(`Port: ${process.env.REDIS_PORT}`);
    console.log(`Database: soulfriend`);
    console.log('─────────────────────────────────────────────────\n');

    // Lấy tất cả keys
    const allKeys = await client.keys('*');
    console.log(`📦 Tổng số keys: ${allKeys.length}`);
    
    if (allKeys.length > 0) {
      console.log('\n🔑 DANH SÁCH KEYS:');
      allKeys.forEach((key, index) => {
        console.log(`   ${index + 1}. ${key}`);
      });
    } else {
      console.log('   (Database trống - chưa có dữ liệu)');
    }

    // Kiểm tra memory usage
    const info = await client.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim();
    console.log(`\n💾 Bộ nhớ đang dùng: ${usedMemory || 'N/A'}`);

    // Lấy database size
    const dbSize = await client.dbSize();
    console.log(`📈 Database size: ${dbSize} keys\n`);

    console.log('─────────────────────────────────────────────────');
    console.log('✅ Redis đã sẵn sàng sử dụng!');
    console.log('─────────────────────────────────────────────────\n');

    // Test một số thao tác cơ bản
    console.log('🧪 KIỂM TRA THAO TÁC CƠ BẢN:\n');

    // 1. SET/GET
    console.log('1️⃣ Test SET/GET:');
    await redisService.set('test:hello', 'Xin chào từ SoulFriend!', 300);
    const value = await redisService.get('test:hello');
    console.log(`   ✅ Value: ${value}\n`);

    // 2. JSON Cache
    console.log('2️⃣ Test JSON Cache:');
    const testData = {
      app: 'SoulFriend',
      timestamp: new Date().toISOString(),
      message: 'Redis hoạt động tốt!'
    };
    await redisService.cacheJSON('test:json', testData, 300);
    const cachedData = await redisService.getCachedJSON('test:json');
    console.log('   ✅ Cached data:', cachedData, '\n');

    // 3. Session
    console.log('3️⃣ Test Session Management:');
    await redisService.setSession('demo_session', {
      userId: 'demo_user_123',
      loginAt: new Date().toISOString(),
      role: 'user'
    }, 3600);
    const session = await redisService.getSession('demo_session');
    console.log('   ✅ Session:', session, '\n');

    // Hiển thị lại số keys
    const finalKeys = await client.keys('*');
    console.log(`📦 Tổng số keys sau test: ${finalKeys.length}\n`);

    console.log('═════════════════════════════════════════════════');
    console.log('🎉 TẤT CẢ KIỂM TRA THÀNH CÔNG!');
    console.log('═════════════════════════════════════════════════\n');

    // Giữ kết nối mở - nhấn Ctrl+C để thoát
    console.log('💡 Tip: Nhấn Ctrl+C để ngắt kết nối và thoát\n');
    
    // Giữ process chạy
    process.stdin.resume();

  } catch (error) {
    console.error('\n❌ LỖI KẾT NỐI:', error);
    process.exit(1);
  }
}

// Xử lý khi nhấn Ctrl+C
process.on('SIGINT', async () => {
  console.log('\n\n🔌 Đang ngắt kết nối Redis...');
  await redisService.disconnect();
  console.log('✅ Đã ngắt kết nối!\n');
  process.exit(0);
});

connectToSoulfriendRedis();
