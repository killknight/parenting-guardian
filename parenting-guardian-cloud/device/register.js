/**
 * 注册设备
 */
const { devices, users } = require('../database')

module.exports = {
  async main(data, context) {
    const { userId, deviceId, deviceName, deviceModel, osVersion, appVersion } = data

    if (!userId || !deviceId) {
      return { success: false, error: '参数不完整' }
    }

    try {
      // 检查设备是否已存在
      const existRes = await devices.where({ deviceId }).get()

      if (existRes.data && existRes.data.length > 0) {
        // 更新设备信息
        await devices.doc(existRes.data[0]._id).update({
          deviceName,
          deviceModel,
          osVersion,
          appVersion,
          lastOnlineTime: Date.now(),
          onlineStatus: true
        })
      } else {
        // 创建新设备记录
        await devices.add({
          userId,
          deviceId,
          deviceName: deviceName || '未知设备',
          deviceModel,
          osVersion,
          appVersion,
          registerTime: Date.now(),
          lastOnlineTime: Date.now(),
          onlineStatus: true
        })
      }

      return { success: true }
    } catch (e) {
      console.error('注册设备失败:', e)
      return { success: false, error: e.message }
    }
  }
}
