/**
 * 获取日使用统计
 */
const { usageRecords } = require('../database')

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

      const usageRes = await usageRecords
        .where({
          userId: targetChildId,
          date: date,
          timestamp: usageRecords.command.gte(startOfDay).and(usageRecords.command.lte(endOfDay))
        })
        .orderBy('timestamp', 'desc')
        .get()

      // 按应用分组统计
      const appStats = {}
      for (const record of (usageRes.data || [])) {
        const key = record.packageName
        if (!appStats[key]) {
          appStats[key] = {
            packageName: record.packageName,
            appName: record.appName,
            totalDuration: 0,
            count: 0
          }
        }
        appStats[key].totalDuration += record.duration || 0
        appStats[key].count += 1
      }

      return {
        success: true,
        data: Object.values(appStats)
      }
    } catch (e) {
      console.error('获取日使用统计失败:', e)
      return { success: false, error: e.message }
    }
  }
}
