/**
 * 获取设备控制状态 (家长端)
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
      return { success: true, isLocked: false };
    }

    const deviceId = binding.data[0].deviceId;

    // 获取最新命令
    const command = await db.collection('commands').where({
      deviceId: deviceId
    }).orderBy('createdAt', 'desc').limit(1).get();

    let isLocked = false;
    let dailyLimit = 4;
    let startTime = '08:00';
    let endTime = '21:00';

    if (command.data && command.data.length > 0) {
      const cmd = command.data[0];
      isLocked = cmd.type === 'lock';
      dailyLimit = cmd.dailyLimit || 4;
      startTime = cmd.startTime || '08:00';
      endTime = cmd.endTime || '21:00';
    }

    return {
      success: true,
      isLocked,
      dailyLimit,
      startTime,
      endTime
    };
  } catch (error) {
    console.error('获取控制状态失败:', error);
    return { success: false, error: error.message };
  }
};