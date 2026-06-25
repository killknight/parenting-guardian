/**
 * 创建围栏
 */
const { geofences } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, childId, name, latitude, longitude, radius, enable } = data

    if (!userId || !childId || !latitude || !longitude) {
      return { success: false, error: '参数不完整' }
    }

    try {
      const res = await geofences.add({
        parentId: userId,
        childId,
        name: name || '未命名围栏',
        latitude,
        longitude,
        radius: radius || 200,
        enable: enable !== false,
        createTime: Date.now(),
        updateTime: Date.now()
      })

      return {
        success: true,
        data: { id: res.id }
      }
    } catch (e) {
      console.error('创建围栏失败:', e)
      return { success: false, error: e.message }
    }
  }
}
