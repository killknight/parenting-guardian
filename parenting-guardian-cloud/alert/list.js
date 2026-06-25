/**
 * 获取告警列表
 */
const { alerts } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const alertRes = await alerts
        .where({
          userId
        })
        .orderBy('createTime', 'desc')
        .limit(50)
        .get()

      return {
        success: true,
        data: alertRes.data || []
      }
    } catch (e) {
      console.error('获取告警列表失败:', e)
      return { success: false, error: e.message }
    }
  }
}
