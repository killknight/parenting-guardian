/**
 * 云函数 API 封装
 */

// 云函数基础地址
const BASE_URL = 'api'

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {object} data 请求参数
 */
export function callFunction(name, data = {}) {
  return new Promise((resolve, reject) => {
    uniCloud.callFunction({
      name: name,
      data: data,
      success: (res) => {
        if (res.result && res.result.success !== undefined) {
          resolve(res.result)
        } else {
          resolve(res.result)
        }
      },
      fail: (err) => {
        console.error('云函数调用失败:', err)
        reject(err)
      }
    })
  })
}

// ============ 认证模块 ============

/**
 * 发送验证码
 */
export function sendCode(phone) {
  return callFunction(BASE_URL, {
    action: 'auth.sendCode',
    data: { phone }
  })
}

/**
 * 用户登录
 */
export function login(phone, password) {
  return callFunction(BASE_URL, {
    action: 'auth.login',
    data: { phone, password }
  })
}

/**
 * 用户注册
 */
export function register(phone, password, code, role, nickname) {
  return callFunction(BASE_URL, {
    action: 'auth.register',
    data: { phone, password, code, role, nickname }
  })
}

/**
 * 登出
 */
export function logout() {
  return callFunction(BASE_URL, {
    action: 'auth.logout',
    data: {}
  })
}

// ============ 用户模块 ============

/**
 * 获取用户资料
 */
export function getUserProfile() {
  return callFunction(BASE_URL, {
    action: 'user.getProfile',
    data: {}
  })
}

/**
 * 更新用户资料
 */
export function updateUserProfile(data) {
  return callFunction(BASE_URL, {
    action: 'user.updateProfile',
    data: data
  })
}

/**
 * 设置紧急联系电话
 */
export function setEmergencyPhone(phone) {
  return callFunction(BASE_URL, {
    action: 'user.setEmergencyPhone',
    data: { phone }
  })
}

// ============ 绑定模块 ============

/**
 * 生成绑定码（家长）
 */
export function generateBindingCode() {
  return callFunction(BASE_URL, {
    action: 'binding.generateCode',
    data: {}
  })
}

/**
 * 申请绑定（孩子）
 */
export function applyBinding(code) {
  return callFunction(BASE_URL, {
    action: 'binding.apply',
    data: { code }
  })
}

/**
 * 确认绑定（家长）
 */
export function confirmBinding(childId, relationship) {
  return callFunction(BASE_URL, {
    action: 'binding.confirm',
    data: { childId, relationship }
  })
}

/**
 * 获取绑定的孩子列表（家长）
 */
export function getChildren() {
  return callFunction(BASE_URL, {
    action: 'binding.getChildren',
    data: {}
  })
}

/**
 * 获取绑定的家长（孩子）
 */
export function getParent() {
  return callFunction(BASE_URL, {
    action: 'binding.getParent',
    data: {}
  })
}

/**
 * 解除绑定
 */
export function unbind(bindingId) {
  return callFunction(BASE_URL, {
    action: 'binding.unbind',
    data: { bindingId }
  })
}

// ============ 设备模块 ============

/**
 * 注册设备
 */
export function registerDevice(deviceInfo) {
  return callFunction(BASE_URL, {
    action: 'device.register',
    data: deviceInfo
  })
}

/**
 * 心跳
 */
export function deviceHeartbeat() {
  return callFunction(BASE_URL, {
    action: 'device.heartbeat',
    data: {}
  })
}

// ============ 使用统计模块 ============

/**
 * 上报使用数据
 */
export function reportUsage(appList) {
  return callFunction(BASE_URL, {
    action: 'usage.report',
    data: { appList }
  })
}

/**
 * 获取日使用统计
 */
export function getDailyUsage(date, childId) {
  return callFunction(BASE_URL, {
    action: 'usage.daily',
    data: { date, childId }
  })
}

/**
 * 获取使用时间轴
 */
export function getUsageTimeline(date, childId) {
  return callFunction(BASE_URL, {
    action: 'usage.timeline',
    data: { date, childId }
  })
}

/**
 * 获取应用排行
 */
export function getUsageRanking(date, childId, limit = 10) {
  return callFunction(BASE_URL, {
    action: 'usage.ranking',
    data: { date, childId, limit }
  })
}

/**
 * 获取使用汇总
 */
export function getUsageSummary(childId) {
  return callFunction(BASE_URL, {
    action: 'usage.summary',
    data: { childId }
  })
}

// ============ 位置模块 ============

/**
 * 上报位置
 */
export function reportLocation(location) {
  return callFunction(BASE_URL, {
    action: 'location.report',
    data: location
  })
}

/**
 * 获取当前位置
 */
export function getCurrentLocation(childId) {
  return callFunction(BASE_URL, {
    action: 'location.current',
    data: { childId }
  })
}

/**
 * 获取位置历史
 */
export function getLocationHistory(childId, date) {
  return callFunction(BASE_URL, {
    action: 'location.history',
    data: { childId, date }
  })
}

/**
 * 获取轨迹
 */
export function getLocationTrajectory(childId, startTime, endTime) {
  return callFunction(BASE_URL, {
    action: 'location.trajectory',
    data: { childId, startTime, endTime }
  })
}

// ============ 指令模块 ============

/**
 * 发送锁屏指令
 */
export function sendLockCommand(childId, duration, message) {
  return callFunction(BASE_URL, {
    action: 'command.lock',
    data: { childId, duration, message }
  })
}

/**
 * 发送解锁指令
 */
export function sendUnlockCommand(childId) {
  return callFunction(BASE_URL, {
    action: 'command.unlock',
    data: { childId }
  })
}

/**
 * 轮询指令（孩子端）
 */
export function pollCommands(lastCommandId) {
  return callFunction(BASE_URL, {
    action: 'command.poll',
    data: { lastCommandId }
  })
}

/**
 * 确认指令执行
 */
export function executeCommand(commandId, status) {
  return callFunction(BASE_URL, {
    action: 'command.execute',
    data: { commandId, status }
  })
}

/**
 * 获取指令历史
 */
export function getCommandHistory(childId) {
  return callFunction(BASE_URL, {
    action: 'command.history',
    data: { childId }
  })
}

/**
 * 设置应用限额
 */
export function setAppLimit(childId, packageName, appName, dailyLimit) {
  return callFunction(BASE_URL, {
    action: 'command.setLimit',
    data: { childId, packageName, appName, dailyLimit }
  })
}

// ============ 告警模块 ============

/**
 * 发送SOS
 */
export function sendSOS(location) {
  return callFunction(BASE_URL, {
    action: 'alert.sos',
    data: location
  })
}

/**
 * 获取告警列表
 */
export function getAlertList() {
  return callFunction(BASE_URL, {
    action: 'alert.list',
    data: {}
  })
}

/**
 * 标记告警已读
 */
export function readAlert(alertId) {
  return callFunction(BASE_URL, {
    action: 'alert.read',
    data: { alertId }
  })
}

// ============ 围栏模块 ============

/**
 * 创建围栏
 */
export function createGeofence(data) {
  return callFunction(BASE_URL, {
    action: 'geofence.create',
    data: data
  })
}

/**
 * 获取围栏列表
 */
export function getGeofenceList(childId) {
  return callFunction(BASE_URL, {
    action: 'geofence.list',
    data: { childId }
  })
}

/**
 * 更新围栏
 */
export function updateGeofence(id, data) {
  return callFunction(BASE_URL, {
    action: 'geofence.update',
    data: { id, ...data }
  })
}

/**
 * 删除围栏
 */
export function deleteGeofence(id) {
  return callFunction(BASE_URL, {
    action: 'geofence.delete',
    data: { id }
  })
}

export default {
  callFunction,
  // 认证
  sendCode, login, register, logout,
  // 用户
  getUserProfile, updateUserProfile, setEmergencyPhone,
  // 绑定
  generateBindingCode, applyBinding, confirmBinding,
  getChildren, getParent, unbind,
  // 设备
  registerDevice, deviceHeartbeat,
  // 使用统计
  reportUsage, getDailyUsage, getUsageTimeline,
  getUsageRanking, getUsageSummary,
  // 位置
  reportLocation, getCurrentLocation, getLocationHistory,
  getLocationTrajectory,
  // 指令
  sendLockCommand, sendUnlockCommand, pollCommands,
  executeCommand, getCommandHistory, setAppLimit,
  // 告警
  sendSOS, getAlertList, readAlert,
  // 围栏
  createGeofence, getGeofenceList, updateGeofence, deleteGeofence
}
