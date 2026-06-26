/**
 * 获取当前位置
 */
const { locationRecords, bindings } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      // 如果是家长查询孩子的位置
      const targetChildId = childId || userId

      // 获取最新的位置记录
      const locationRes = await locationRecords
        .where({ userId: targetChildId })
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get()

      if (!locationRes.data || locationRes.data.length === 0) {
        return { success: true, data: null }
      }

      return {
        success: true,
        data: locationRes.data[0]
      }
    } catch (e) {
      console.error('获取当前位置失败:', e)
      return { success: false, error: e.message }
    }
  }
}
