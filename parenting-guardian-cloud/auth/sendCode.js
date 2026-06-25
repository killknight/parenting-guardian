/**
 * 认证模块 - 发送验证码
 *
 * 简化版：实际应连接阿里云短信、腾讯云短信等服务
 */
'use strict';

const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

// 存储验证码（实际应使用Redis）
const verificationCodes = new Map();

exports.main = async (event, context) => {
  const { phone } = event;

  try {
    // 1. 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return { success: false, error: '手机号格式不正确' };
    }

    // 2. 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. 存储验证码（带5分钟过期时间）
    verificationCodes.set(phone, {
      code,
      expireTime: Date.now() + 5 * 60 * 1000,
      count: 1
    });

    // 4. 发送短信（简化版，实际应调用短信服务）
    // 这里直接返回验证码，便于测试
    console.log(`[模拟短信] 向 ${phone} 发送验证码: ${code}`);

    // TODO: 实际调用短信服务
    // const result = await sendSms(phone, code);
    // if (!result.success) {
    //   return { success: false, error: '发送失败，请稍后重试' };
    // }

    return {
      success: true,
      message: '验证码已发送',
      // 开发环境下返回验证码，生产环境应删除
      debugCode: code
    };

  } catch (error) {
    console.error('发送验证码错误:', error);
    return { success: false, error: '服务器错误' };
  }
};

/**
 * 验证验证码
 */
exports.verify = function(phone, code) {
  const record = verificationCodes.get(phone);
  if (!record) {
    return false;
  }
  if (Date.now() > record.expireTime) {
    verificationCodes.delete(phone);
    return false;
  }
  if (record.code !== code) {
    return false;
  }
  verificationCodes.delete(phone);
  return true;
};
