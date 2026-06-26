/**
 * 设置紧急联系电话
 */
const { users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, phone } = data

    if (!userId || !phone) {
      return { success: false, error: '参数不完整' }
    }

    // 简单验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return { success: false, error: '手机号格式不正确' }
    }

    try {
      await users.doc(userId).update({
        emergencyPhone: phone,
        updateTime: Date.now()
      })

      return { success: true }
    } catch (e) {
      console.error('设置紧急联系电话失败:', e)
      return { success: false, error: e.message }
    }
  }
}
