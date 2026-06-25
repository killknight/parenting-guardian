/**
 * 获取使用统计 (家长端)
 */
const db = require('./database');

exports.main = async (data, context) => {
  const userId = data._userId;
  const userRole = data._userRole;

  if (userRole !== 'parent') {
    return { success: false, error: '权限不足' };
  }

  try {
    const binding = await db.collection('bindings').where({
      parentId: userId,
      status: 'active'
    }).get();

    if (!binding.data || binding.data.length === 0) {
      return { success: true, todayStats: { totalTime: '0h 0m', appCount: 0 } };
    }

    const deviceId = binding.data[0].deviceId;

    // 获取今日使用数据
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const usageToday = await db.collection('usage_records').where({
      deviceId: deviceId,
      date: dateStr
    }).get();

    let todayStats = { totalTime: '0h 0m', appCount: 0 };
    let appUsageList = [];
    let weekData = [];

    if (usageToday.data && usageToday.data.length > 0) {
      const record = usageToday.data[0];
      const totalMinutes = record.totalMinutes || 0;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      todayStats = {
        totalTime: `${hours}h ${minutes}m`,
        appCount: record.apps?.length || 0
      };

      // 应用排行
      if (record.apps) {
        appUsageList = record.apps.slice(0, 5).map(app => ({
          name: app.appName,
          duration: `${Math.floor(app.duration / 60)}h ${app.duration % 60}m`,
          percent: Math.round((app.duration / totalMinutes) * 100),
          icon: '/images/app.png'
        }));
      }
    }

    // 获取本周数据
    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      
      const dayUsage = await db.collection('usage_records').where({
        deviceId: deviceId,
        date: dayStr
      }).get();

      let minutes = 0;
      if (dayUsage.data && dayUsage.data.length > 0) {
        minutes = dayUsage.data[0].totalMinutes || 0;
      }

      const hours = Math.floor(minutes / 60);
      weekData.push({
        day: weekDays[(date.getDay() + 6) % 7],
        time: `${hours}h`,
        height: Math.max(30, Math.min(150, hours * 30))
      });
    }

    return {
      success: true,
      todayStats,
      appUsageList,
      weekData
    };
  } catch (error) {
    console.error('获取使用统计失败:', error);
    return { success: false, error: error.message };
  }
};