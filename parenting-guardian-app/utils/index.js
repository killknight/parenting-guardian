/**
 * 通用工具类
 */

/**
 * 格式化时间戳为日期字符串
 * @param {number|Date} timestamp 时间戳或日期
 * @param {string} format 格式 默认 'YYYY-MM-DD HH:mm:ss'
 */
export function formatDate(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化时长为可读字符串
 * @param {number} seconds 秒数
 * @returns {string} 如 "1小时30分" 或 "45秒"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0秒'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  let result = ''
  if (hours > 0) result += `${hours}小时`
  if (minutes > 0) result += `${minutes}分`
  if (secs > 0 && hours === 0) result += `${secs}秒`

  return result || '0秒'
}

/**
 * 格式化时长为 "Xh Xm" 格式
 * @param {number} seconds 秒数
 */
export function formatDurationShort(seconds) {
  if (!seconds || seconds < 0) return '0m'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * 相对时间（多久以前）
 * @param {number} timestamp
 */
export function relativeTime(timestamp) {
  if (!timestamp) return ''

  const now = Date.now()
  const diff = now - new Date(timestamp).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return formatDate(timestamp, 'MM-DD HH:mm')
}

/**
 * 获取今天的日期字符串
 */
export function getToday() {
  return formatDate(Date.now(), 'YYYY-MM-DD')
}

/**
 * 生成随机绑定码
 * @param {number} length 长度 默认6位
 */
export function generateBindingCode(length = 6) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * 获取设备唯一标识
 */
export function getDeviceId() {
  let deviceId = uni.getStorageSync('deviceId')
  if (!deviceId) {
    deviceId = 'android-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    uni.setStorageSync('deviceId', deviceId)
  }
  return deviceId
}

/**
 * 获取设备信息
 */
export function getDeviceInfo() {
  const systemInfo = uni.getSystemInfoSync()
  return {
    deviceId: getDeviceId(),
    deviceName: systemInfo.brand + ' ' + systemInfo.model,
    deviceModel: systemInfo.model,
    osVersion: systemInfo.system,
    appVersion: '1.0.0'
  }
}

/**
 * 校验手机号
 */
export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 显示加载中
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 显示成功提示
 */
export function showSuccess(title = '成功') {
  uni.showToast({
    title,
    icon: 'success',
    duration: 2000
  })
}

/**
 * 显示错误提示
 */
export function showError(title = '出错了') {
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 确认对话框
 */
export function showConfirm(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 节流函数
 */
export function throttle(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 防抖函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 计算两点间距离（米）
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 深拷贝
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  const clone = Array.isArray(obj) ? [] : {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key])
    }
  }
  return clone
}

export default {
  formatDate,
  formatDuration,
  formatDurationShort,
  relativeTime,
  getToday,
  generateBindingCode,
  getDeviceId,
  getDeviceInfo,
  validatePhone,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showConfirm,
  throttle,
  debounce,
  calculateDistance,
  deepClone
}
