/**
 * 获取设备状态 (家长端)
 */
const db = require('./database');

exports.main = async (data, context) => {
  const userId = data._userId;
  const userRole = data._userRole;

  if (userRole !== 'parent') {
    return { success: false, error: '权限不足' };
  }

  try {
    // 获取绑定的孩子设备
    const binding = await db.collection('bindings').where({
      parentId: userId,
      status: 'active'
    }).get();

    if (!binding.data || binding.data.length === 0) {
      return { success: true, isOnline: false };
    }

    const deviceId = binding.data[0].deviceId;
    const device = await db.collection('devices').doc(deviceId).get();

    if (!device.data || device.data.length === 0) {
      return { success: true, isOnline: false };
    }

    const deviceInfo = device.data[0];
    const lastHeartbeat = deviceInfo.lastHeartbeat ? new Date(deviceInfo.lastHeartbeat) : null;
    const isOnline = lastHeartbeat && (Date.now() - lastHeartbeat.getTime()) < 300000; // 5分钟内

    // 获取今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageToday = await db.collection('usage_records').where({
      deviceId: deviceId,
      date: today.toISOString().split('T')[0]
    }).get();

    let totalScreenTime = '0h 0m';
    let appCount = 0;

    if (usageToday.data && usageToday.data.length > 0) {
      const record = usageToday.data[0];
      const totalMinutes = record.totalMinutes || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      totalScreenTime = `${hours}h ${minutes}m`;
      appCount = record.apps?.length || 0;
    }

    return {
      success: true,
      isOnline,
      lastUpdate: lastHeartbeat ? '刚刚' : '未知',
      todayStats: {
        screenTime: totalScreenTime,
        appCount,
        locationUpdate: deviceInfo.lastLocationTime || '未知',
        alertCount: 0
      },
      deviceInfo: {
        model: deviceInfo.model || '未知设备',
        battery: deviceInfo.battery || 0,
        signal: deviceInfo.signal || '未知'
      }
    };
  } catch (error) {
    console.error('获取设备状态失败:', error);
    return { success: false, error: error.message };
  }
};