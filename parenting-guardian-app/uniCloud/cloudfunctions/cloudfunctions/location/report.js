/**
 * 位置模块 - 位置上报
 *
 * 核心功能：
 * 1. 保存孩子位置到数据库
 * 2. 检查电子围栏状态
 * 3. 触发围栏告警
 */
'use strict';




const db = uniCloud.database();

/**
 * 计算两点间距离（米）- Haversine公式
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.main = async (event, context) => {
  const {
    userId,
    deviceId,
    latitude,
    longitude,
    accuracy,
    altitude,
    speed,
    locationType,
    address
  } = event;

  try {
    // 1. 验证参数
    if (!userId || latitude === undefined || longitude === undefined) {
      return { success: false, error: '缺少必要参数' };
    }

    const timestamp = new Date();

    // 2. 保存位置记录
    await db.collection('locations').add({
      data: {
        userId,
        deviceId: deviceId || '',
        latitude,
        longitude,
        accuracy: accuracy || 0,
        altitude: altitude || 0,
        speed: speed || 0,
        locationType: locationType || 'GPS',
        address: address || '',
        timestamp,
        createTime: timestamp,
        isOnline: true
      }
    });

    // 3. 更新设备在线状态
    if (deviceId) {
      await db.collection('devices')
        .where({ deviceId })
        .update({
          data: {
            isOnline: true,
            lastOnline: timestamp
          }
        });
    }

    // 4. 检查电子围栏
    const alerts = await checkGeofences(userId, latitude, longitude, address, timestamp);

    // 5. 返回结果
    return {
      success: true,
      data: {
        timestamp,
        alertsCount: alerts.length
      }
    };

  } catch (error) {
    console.error('位置上报错误:', error);
    return { success: false, error: '服务器错误' };
  }
};

/**
 * 检查电子围栏状态
 */
async function checkGeofences(userId, latitude, longitude, address, timestamp) {
  const alerts = [];

  try {
    // 查询该孩子的所有启用围栏
    const geofencesRes = await db.collection('geofences')
      .where({
        childId: userId,
        enabled: true
      })
      .get();

    for (const fence of geofencesRes.data) {
      // 计算距离
      const distance = calculateDistance(
        latitude, longitude,
        fence.latitude, fence.longitude
      );

      const isInside = distance <= fence.radius;

      // 获取上次的围栏状态
      const lastEventRes = await db.collection('geofence_events')
        .where({
          geofenceId: fence._id
        })
        .orderBy('eventTime', 'desc')
        .limit(1)
        .get();

      const lastEvent = lastEventRes.data[0];
      const lastStatus = lastEvent ? lastEvent.eventType : null;

      // 状态变化检测
      if (isInside && fence.alertIn && lastStatus !== 'ENTER') {
        // 进入围栏
        await createGeofenceAlert(fence, 'ENTER', latitude, longitude, address, timestamp);
        alerts.push({
          type: 'GEOFENCE_ENTER',
          fenceName: fence.name,
          message: `孩子进入了${fence.name}`
        });
      } else if (!isInside && fence.alertOut && lastStatus !== 'EXIT') {
        // 离开围栏
        await createGeofenceAlert(fence, 'EXIT', latitude, longitude, address, timestamp);
        alerts.push({
          type: 'GEOFENCE_EXIT',
          fenceName: fence.name,
          message: `孩子离开了${fence.name}`
        });
      }
    }

  } catch (error) {
    console.error('检查围栏错误:', error);
  }

  return alerts;
}

/**
 * 创建围栏事件
 */
async function createGeofenceAlert(fence, eventType, latitude, longitude, address, timestamp) {
  try {
    // 创建围栏事件记录
    await db.collection('geofence_events').add({
      data: {
        geofenceId: fence._id,
        parentId: fence.parentId,
        childId: fence.childId,
        eventType,
        latitude,
        longitude,
        address: address || '',
        eventTime: timestamp,
        createTime: new Date()
      }
    });

    // 创建告警记录
    const alertTitle = eventType === 'ENTER'
      ? `${fence.name}进入提醒`
      : `${fence.name}离开提醒`;
    const alertContent = eventType === 'ENTER'
      ? `孩子于${formatTime(timestamp)}进入了${fence.name}区域`
      : `孩子于${formatTime(timestamp)}离开了${fence.name}区域`;

    await db.collection('alerts').add({
      data: {
        parentId: fence.parentId,
        childId: fence.childId,
        alertType: eventType === 'ENTER' ? 'GEOFENCE_ENTER' : 'GEOFENCE_EXIT',
        title: alertTitle,
        content: alertContent,
        latitude,
        longitude,
        address: address || '',
        isRead: false,
        createTime: new Date()
      }
    });

    // TODO: 推送通知给家长
    await pushToParent(fence.parentId, {
      alertType: eventType === 'ENTER' ? 'GEOFENCE_ENTER' : 'GEOFENCE_EXIT',
      title: alertTitle,
      content: alertContent,
      latitude,
      longitude
    });

  } catch (error) {
    console.error('创建围栏告警错误:', error);
  }
}

/**
 * 格式化时间
 */
function formatTime(date) {
  const d = new Date(date);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * 推送消息给家长
 */
async function pushToParent(parentId, message) {
  try {
    // 获取家长的推送Token
    const userRes = await db.collection('users').doc(parentId).get();
    const user = userRes.data;

    if (user && user.pushToken) {
      // 调用云推送API
      await uniCloud.callFunction({name:'push'({
        token: user.pushToken,
        title: message.title,
        content: message.content,
        payload: {
          alertType: message.alertType,
          latitude: message.latitude,
          longitude: message.longitude
        }
      });
    }
  } catch (error) {
    console.error('推送消息错误:', error);
  }
}
