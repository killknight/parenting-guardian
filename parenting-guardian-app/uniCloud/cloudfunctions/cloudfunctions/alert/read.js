/**
 * 标记告警已读
 */
const { alerts } = require('../database')

module.exports = {
  async main(data, context) {
    const { alertId } = data

    if (!alertId) {
      return { success: false, error: '告警ID不能为空' }
    }

    try {
      await alerts.doc(alertId).update({
        readStatus: true,
        readTime: Date.now()
      })

      return { success: true }
    } catch (e) {
      console.error('标记告警已读失败:', e)
      return { success: false, error: e.message }
    }
  }
}
