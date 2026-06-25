/**
 * 验证访问令牌
 */
const db = require('./database');

exports.main = async (token, context) => {
  if (!token) {
    return { valid: false };
  }

  try {
    const tokenData = await db.collection('tokens').doc(token).get();
    
    if (!tokenData.data || tokenData.data.length === 0) {
      return { valid: false };
    }

    const tokenInfo = tokenData.data[0];
    
    // 检查过期
    if (tokenInfo.expiresAt && new Date(tokenInfo.expiresAt) < new Date()) {
      return { valid: false, error: 'Token expired' };
    }

    return {
      valid: true,
      userId: tokenInfo.userId,
      role: tokenInfo.role
    };
  } catch (error) {
    console.error('Token验证失败:', error);
    return { valid: false };
  }
};