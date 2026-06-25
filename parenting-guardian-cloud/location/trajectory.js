/**
 * 获取轨迹
 */
const { locationRecords } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId, startTime, endTime } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const targetChildId = childId || userId

      const locationRes = await locationRecords
        .where({
          userId: targetChildId,
          timestamp: locationRecords.command.gte(startTime).and(locationRecords.command.lte(endTime))
        })
        .orderBy('timestamp', 'asc')
        .get()

      return {
        success: true,
        data: locationRes.data || []
      }
    } catch (e) {
      console.error('获取轨迹失败:', e)
      return { success: false, error: e.message }
    }
  }
}
