/**
 * 认证模块 - 微信登录
 * 支持微信小程序一键登录
 */
'use strict';

const cloud = require('wx-server-sdk');
const jwt = require('jsonwebtoken');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const JWT_SECRET = process.env.JWT_SECRET || 'parenting_guardian_secret_2024';
const JWT_EXPIRES_IN = '7d';

// 微信小程序配置 (需要在环境变量中配置)
const WECHAT_APPID = process.env.WECHAT_APPID || 'wxxxxxxxxxxx';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

exports.main = async (event, context) => {
  const { code, userInfo, role = 'parent' } = event;

  try {
    if (!code) {
      return { success: false, error: '缺少登录凭证' };
    }

    let openid = null;
    let sessionKey = null;

    // 1. 通过 code 换取 openid
    if (WECHAT_APPID && WECHAT_SECRET) {
      // 真实环境：调用微信接口
      try {
        const result = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
          params: {
            appid: WECHAT_APPID,
            secret: WECHAT_SECRET,
            js_code: code,
            grant_type: 'authorization_code'
          }
        });

        if (result.data && result.data.openid) {
          openid = result.data.openid;
          sessionKey = result.data.session_key;
        } else {
          return { success: false, error: '微信登录失败' };
        }
      } catch (err) {
        console.error('微信登录接口调用失败:', err);
        return { success: false, error: '微信登录失败' };
      }
    } else {
      // 开发环境：使用 code 作为 mock openid
      openid = 'mock_' + code;
      console.log('开发模式 - Mock openid:', openid);
    }

    // 2. 查找或创建用户
    const userRes = await db.collection('users')
      .where({
        openid: openid
      })
      .get();

    let user;
    let isNewUser = false;

    if (userRes.data.length > 0) {
      user = userRes.data[0];
    } else {
      // 新用户，创建账号
      isNewUser = true;
      const nickName = (userInfo && userInfo.nickName) || '微信用户';
      const avatarUrl = (userInfo && userInfo.avatarUrl) || '';

      const addRes = await db.collection('users').add({
        data: {
          openid: openid,
          nickname: nickName,
          avatar: avatarUrl,
          role: role,
          phone: '',
          status: 'ACTIVE',
          createdAt: new Date(),
          lastLoginTime: new Date()
        }
      });

      user = {
        _id: addRes._id,
        openid: openid,
        nickname: nickName,
        avatar: avatarUrl,
        role: role,
        phone: '',
        status: 'ACTIVE'
      };
    }

    // 3. 检查用户状态
    if (user.status === 'BANNED') {
      return { success: false, error: '账号已被禁用' };
    }

    // 4. 更新用户信息（如果有userInfo）
    if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
      const updateData = {};
      if (userInfo.nickName && userInfo.nickName !== user.nickname) {
        updateData.nickname = userInfo.nickName;
      }
      if (userInfo.avatarUrl && userInfo.avatarUrl !== user.avatar) {
        updateData.avatar = userInfo.avatarUrl;
      }
      if (Object.keys(updateData).length > 0) {
        updateData.lastLoginTime = new Date();
        await db.collection('users').doc(user._id).update({ data: updateData });
      }
    } else {
      await db.collection('users').doc(user._id).update({
        data: { lastLoginTime: new Date() }
      });
    }

    // 5. 生成 JWT Token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        openid: openid,
        phone: user.phone || ''
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 6. 保存 token 到数据库
    try {
      await db.collection('tokens').add({
        data: {
          _id: token,
          userId: user._id,
          role: user.role,
          openid: openid,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
    } catch (e) {
      console.warn('Token保存失败:', e);
    }

    // 7. 返回结果
    return {
      success: true,
      token: token,
      userId: user._id,
      role: user.role,
      nickname: user.nickname,
      avatar: user.avatar || '',
      phone: user.phone || '',
      isNewUser: isNewUser,
      needBindPhone: !user.phone
    };

  } catch (error) {
    console.error('微信登录错误:', error);
    return { success: false, error: '服务器错误' };
  }
};