/**
 * 支付宝云数据库初始化
 */

const db = uniCloud.database()
const dbCollection = (name) => db.collection(name)

module.exports = {
  db,
  dbCollection,

  // 用户集合
  users: dbCollection('users'),
  // 设备集合
  devices: dbCollection('devices'),
  // 绑定关系集合
  bindings: dbCollection('bindings'),
  // 使用记录集合
  usageRecords: dbCollection('usage_records'),
  // 位置记录集合
  locationRecords: dbCollection('location_records'),
  // 指令集合
  commands: dbCollection('commands'),
  // 告警集合
  alerts: dbCollection('alerts'),
  // 围栏集合
  geofences: dbCollection('geofences'),
  // 围栏事件集合
  geofenceEvents: dbCollection('geofence_events')
}
