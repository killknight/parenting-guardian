/**
 * 删除围栏
 */
const { geofences } = require('../database')

module.exports = {
  async main(data, context) {
    const { id } = data

    if (!id) {
      return { success: false, error: '围栏ID不能为空' }
    }

    try {
      await geofences.doc(id).remove()

      return { success: true }
    } catch (e) {
      console.error('删除围栏失败:', e)
      return { success: false, error: e.message }
    }
  }
}
