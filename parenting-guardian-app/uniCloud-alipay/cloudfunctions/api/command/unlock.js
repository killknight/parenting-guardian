/**
 * 指令模块 - 解锁指令
 */
'use strict';




const db = uniCloud.database();

exports.main = async (event, context) => {
  const { parentId, childId, deviceId } = event;

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
        cmdType: 'UNLOCK',
        cmdData: {},
        status: 'PENDING',
        createTime,
        executeTime: null
      }
    });

    // 3. 推送指令到孩子设备
    await pushToChildDevice(childId, {
      cmdId: cmdRes.id,
      cmdType: 'UNLOCK'
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
    console.error('解锁指令错误:', error);
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

      // 更新设备状态为需要执行解锁
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
          title: '家长发来解锁指令',
          content: '设备已解锁，可以正常使用',
          payload: {
            cmdType: 'UNLOCK',
            cmdId: payload.cmdId
          }
        });
      }
    }
  } catch (error) {
    console.error('推送指令错误:', error);
  }
}
