/**
 * 获取使用汇总
 */
const { usageRecords } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const targetChildId = childId || userId

      // 获取最近7天的数据
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

      const usageRes = await usageRecords
        .where({
          userId: targetChildId,
          timestamp: usageRecords.command.gte(sevenDaysAgo)
        })
        .get()

      // 按天分组统计
      const dailyStats = {}
      let totalDuration = 0
      let totalCount = 0

      for (const record of (usageRes.data || [])) {
        const day = new Date(record.timestamp).toISOString().slice(0, 10)
        if (!dailyStats[day]) {
          dailyStats[day] = 0
        }
        dailyStats[day] += record.duration || 0
        totalDuration += record.duration || 0
        totalCount += 1
      }

      // 计算日均使用时长
      const days = Object.keys(dailyStats).length || 1
      const avgDailyDuration = totalDuration / days

      return {
        success: true,
        data: {
          totalDuration,
          totalCount,
          avgDailyDuration,
          dailyStats,
          daysIncluded: days
        }
      }
    } catch (e) {
      console.error('获取使用汇总失败:', e)
      return { success: false, error: e.message }
    }
  }
}
