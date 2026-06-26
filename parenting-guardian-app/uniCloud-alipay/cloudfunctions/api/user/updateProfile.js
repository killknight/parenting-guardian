/**
 * 更新用户资料
 */
const { users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, nickname, avatar, emergencyPhone } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const updateData = {}
      if (nickname) updateData.nickname = nickname
      if (avatar) updateData.avatar = avatar
      if (emergencyPhone) updateData.emergencyPhone = emergencyPhone
      updateData.updateTime = Date.now()

      await users.doc(userId).update(updateData)

      return { success: true }
    } catch (e) {
      console.error('更新用户资料失败:', e)
      return { success: false, error: e.message }
    }
  }
}
