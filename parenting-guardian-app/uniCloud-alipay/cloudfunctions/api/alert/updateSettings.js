/**
 * 更新告警设置 (家长端)
 */
const db = require('./database');

exports.main = async (data, context) => {
  const userId = data._userId;
  const userRole = data._userRole;

  if (userRole !== 'parent') {
    return { success: false, error: '权限不足' };
  }

  try {
    const { type, value } = data;

    await db.collection('users').doc(userId).update({
      [`alertSettings.${type}`]: value
    });

    return { success: true };
  } catch (error) {
    console.error('更新告警设置失败:', error);
    return { success: false, error: error.message };
  }
};