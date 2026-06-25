/**
 * 获取告警设置 (家长端)
 */
const db = require('./database');

exports.main = async (data, context) => {
  const userId = data._userId;
  const userRole = data._userRole;

  if (userRole !== 'parent') {
    return { success: false, error: '权限不足' };
  }

  try {
    const user = await db.collection('users').doc(userId).get();

    let alertSettings = {
      lowBattery: true,
      outOfRange: true,
      appTimeout: false,
      deviceOffline: true
    };

    if (user.data && user.data.length > 0 && user.data[0].alertSettings) {
      alertSettings = { ...alertSettings, ...user.data[0].alertSettings };
    }

    return {
      success: true,
      alertSettings
    };
  } catch (error) {
    console.error('获取告警设置失败:', error);
    return { success: false, error: error.message };
  }
};