/**
 * 发送紧急求助 (家长端)
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
      return { success: false, error: '未绑定设备' };
    }

    const deviceId = binding.data[0].deviceId;

    // 创建紧急求助命令
    await db.collection('commands').add({
      deviceId: deviceId,
      parentId: userId,
      type: 'emergency',
      emergencyType: 'help_request',
      status: 'pending',
      createdAt: new Date()
    });

    return { success: true, message: '求助已发送' };
  } catch (error) {
    console.error('发送紧急求助失败:', error);
    return { success: false, error: error.message };
  }
};