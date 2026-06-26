/**
 * 获取用户资料
 */
const { users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const userRes = await users.doc(userId).get()

      if (!userRes.data || userRes.data.length === 0) {
        return { success: false, error: '用户不存在' }
      }

      const user = userRes.data[0]
      // 移除敏感信息
      delete user.password

      return {
        success: true,
        data: user
      }
    } catch (e) {
      console.error('获取用户资料失败:', e)
      return { success: false, error: e.message }
    }
  }
}
