/**
 * 指令模块 - 锁屏指令
 */
'use strict';




const db = uniCloud.database();

exports.main = async (event, context) => {
  const { parentId, childId, deviceId, duration, message } = event;

  try {
    // 1. 验证参数
    if (!parentId || !childId) {
      return { success: false, error: '缺少必要参数' };
    }

    const createTime = new Date();

    // 2. 创建指令记录
    const cmdRes = await db.collection('commands').add({
      data: {
        parentId,
        childId,
        deviceId: deviceId || '',
        cmdType: 'LOCK',
        cmdData: {
          duration: duration || 1800, // 默认30分钟
          message: message || '家长要求你休息一下',
          startTime: createTime.getTime(),
          expireTime: createTime.getTime() + (duration || 1800) * 1000
        },
        status: 'PENDING',
        createTime,
        executeTime: null
      }
    });

    // 3. 推送指令到孩子设备
    await pushToChildDevice(childId, {
      cmdId: cmdRes.id,
      cmdType: 'LOCK',
      duration: duration || 1800,
      message: message || '家长要求你休息一下'
    });

    // 4. 返回结果
    return {
      success: true,
      data: {
        commandId: cmdRes.id,
        createTime
      }
    };

  } catch (error) {
    console.error('锁屏指令错误:', error);
    return { success: false, error: '服务器错误' };
  }
};

/**
 * 推送指令到孩子设备
 */
async function pushToChildDevice(childId, payload) {
  try {
    // 获取孩子的设备信息
    const deviceRes = await db.collection('devices')
      .where({ userId: childId })
      .get();

    if (deviceRes.data.length > 0) {
      const device = deviceRes.data[0];

      // 更新设备状态为需要执行锁屏
      await db.collection('devices')
        .doc(device._id)
        .update({
          data: {
            pendingCommand: payload,
            commandUpdateTime: new Date()
          }
        });

      // 如果有推送Token，发送推送
      if (device.pushToken) {
        await uniCloud.callFunction({name:'push'({
          token: device.pushToken,
          title: '家长发来锁屏指令',
          content: payload.message,
          payload: {
            cmdType: 'LOCK',
            cmdId: payload.cmdId
          }
        });
      }
    }
  } catch (error) {
    console.error('推送指令错误:', error);
  }
}
