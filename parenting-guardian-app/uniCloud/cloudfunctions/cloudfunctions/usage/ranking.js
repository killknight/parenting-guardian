/**
 * 获取应用排行
 */
const { usageRecords } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId, date, limit = 10 } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const targetChildId = childId || userId

      // 获取指定日期的数据
      const startOfDay = new Date(date).setHours(0, 0, 0, 0)
      const endOfDay = new Date(date).setHours(23, 59, 59, 999)

      const usageRes = await usageRecords
        .where({
          userId: targetChildId,
          timestamp: usageRecords.command.gte(startOfDay).and(usageRecords.command.lte(endOfDay))
        })
        .get()

      // 按应用分组统计使用时长
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

      // 按使用时长排序
      const sorted = Object.values(appStats).sort((a, b) => b.totalDuration - a.totalDuration)

      return {
        success: true,
        data: sorted.slice(0, limit)
      }
    } catch (e) {
      console.error('获取应用排行失败:', e)
      return { success: false, error: e.message }
    }
  }
}
