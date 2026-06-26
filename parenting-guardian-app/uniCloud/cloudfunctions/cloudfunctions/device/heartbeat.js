/**
 * 设备心跳
 */
const { devices } = require('../database')

module.exports = {
  async main(data, context) {
    const { deviceId } = data

    if (!deviceId) {
      return { success: false, error: '设备ID不能为空' }
    }

    try {
      const deviceRes = await devices.where({ deviceId }).get()

      if (deviceRes.data && deviceRes.data.length > 0) {
        await devices.doc(deviceRes.data[0]._id).update({
          lastOnlineTime: Date.now(),
          onlineStatus: true
        })
      }

      return { success: true }
    } catch (e) {
      console.error('设备心跳失败:', e)
      return { success: false, error: e.message }
    }
  }
}
