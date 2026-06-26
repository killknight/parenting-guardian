/**
 * 获取位置历史
 */
const { locationRecords } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId, date } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const targetChildId = childId || userId
      const startOfDay = new Date(date).setHours(0, 0, 0, 0)
      const endOfDay = new Date(date).setHours(23, 59, 59, 999)

      const locationRes = await locationRecords
        .where({
          userId: targetChildId,
          timestamp: locationRecords.command.gte(startOfDay).and(locationRecords.command.lte(endOfDay))
        })
        .orderBy('timestamp', 'asc')
        .get()

      return {
        success: true,
        data: locationRes.data || []
      }
    } catch (e) {
      console.error('获取位置历史失败:', e)
      return { success: false, error: e.message }
    }
  }
}
