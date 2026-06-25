/**
 * 设置应用限额
 */
const { commands } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId, packageName, appName, dailyLimit } = data

    if (!userId || !childId || !packageName) {
      return { success: false, error: '参数不完整' }
    }

    try {
      await commands.add({
        parentId: userId,
        childId,
        type: 'limit',
        packageName,
        appName: appName || packageName,
        dailyLimit: dailyLimit || 0,
        status: 'pending',
        createTime: Date.now()
      })

      return { success: true }
    } catch (e) {
      console.error('设置应用限额失败:', e)
      return { success: false, error: e.message }
    }
  }
}
