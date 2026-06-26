/**
 * 获取围栏列表
 */
const { geofences } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId } = data

    if (!userId) {
      return { success: false, error: '用户ID不能为空' }
    }

    try {
      const query = childId ? { childId, enable: true } : { parentId: userId, enable: true }

      const geofenceRes = await geofences
        .where(query)
        .get()

      return {
        success: true,
        data: geofenceRes.data || []
      }
    } catch (e) {
      console.error('获取围栏列表失败:', e)
      return { success: false, error: e.message }
    }
  }
}
