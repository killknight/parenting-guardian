/**
 * 更新围栏
 */
const { geofences } = require('../database')

module.exports = {
  async main(data, context) {
    const { id, name, latitude, longitude, radius, enable } = data

    if (!id) {
      return { success: false, error: '围栏ID不能为空' }
    }

    try {
      const updateData = { updateTime: Date.now() }
      if (name !== undefined) updateData.name = name
      if (latitude !== undefined) updateData.latitude = latitude
      if (longitude !== undefined) updateData.longitude = longitude
      if (radius !== undefined) updateData.radius = radius
      if (enable !== undefined) updateData.enable = enable

      await geofences.doc(id).update(updateData)

      return { success: true }
    } catch (e) {
      console.error('更新围栏失败:', e)
      return { success: false, error: e.message }
    }
  }
}
