/**
 * 亲子守护 - HTTP API 入口
 * 支持微信小程序等外部客户端通过HTTP调用
 */

'use strict';

const getAccessToken = require('./auth/accessToken');

exports.main = async (event, context) => {
  const method = event.httpMethod || event.method;
  const path = event.path || '/';
  const headers = event.headers || {};
  const query = event.queryParameters || event.query || {};
  const body = event.body || (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body);

  console.log('HTTP API 请求:', method, path, query);

  // CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
  }

  try {
    // 解析请求体
    let requestData = {};
    if (body && typeof body === 'string') {
      try {
        requestData = JSON.parse(body);
      } catch (e) {
        const params = new URLSearchParams(body);
        for (const [key, value] of params) {
          requestData[key] = value;
        }
      }
    }

    // 路由匹配
    const routeResult = matchRoute(path, method);
    if (!routeResult) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ success: false, error: 'API not found' })
      };
    }

    const { action, auth } = routeResult;

    // 认证检查
    if (auth) {
      const token = headers.authorization?.replace(/^Bearer\s+/i, '') || query.token;
      if (!token) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Unauthorized', message: '请先登录' })
        };
      }

      const tokenInfo = await getAccessToken.main(token, context);
      if (!tokenInfo.valid) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ success: false, error: 'Token expired', message: '登录已过期' })
        };
      }
      requestData._userId = tokenInfo.userId;
      requestData._userRole = tokenInfo.role;
    }

    // 调用对应的云函数
    const result = await callAction(action, requestData, context);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('HTTP API 错误:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

// 路由表
const routes = [
  // 认证相关 (无需登录)
  { path: '/api/auth/login', method: 'POST', action: 'auth.login', auth: false },
  { path: '/api/auth/register', method: 'POST', action: 'auth.register', auth: false },
  { path: '/api/auth/send-sms', method: 'POST', action: 'auth.sendCode', auth: false },

  // 用户相关 (需要登录)
  { path: '/api/user/info', method: 'GET', action: 'user.getProfile', auth: true },
  { path: '/api/user/profile', method: 'POST', action: 'user.updateProfile', auth: true },

  // 设备状态 (家长端)
  { path: '/api/parent/device-status', method: 'GET', action: 'device.status', auth: true },

  // 设备控制 (家长端)
  { path: '/api/parent/device-control/status', method: 'GET', action: 'device.controlStatus', auth: true },
  { path: '/api/parent/device-control/lock', method: 'POST', action: 'command.lock', auth: true },
  { path: '/api/parent/device-control/unlock', method: 'POST', action: 'command.unlock', auth: true },
  { path: '/api/parent/device-control/limit', method: 'POST', action: 'command.setLimit', auth: true },

  // 位置相关 (家长端)
  { path: '/api/parent/location', method: 'GET', action: 'location.current', auth: true },
  { path: '/api/parent/location/history', method: 'GET', action: 'location.history', auth: true },
  { path: '/api/parent/location/trajectory', method: 'GET', action: 'location.trajectory', auth: true },

  // 使用统计 (家长端)
  { path: '/api/parent/usage-stats', method: 'GET', action: 'usage.stats', auth: true },
  { path: '/api/parent/usage/daily', method: 'GET', action: 'usage.daily', auth: true },
  { path: '/api/parent/usage/ranking', method: 'GET', action: 'usage.ranking', auth: true },

  // 告警相关
  { path: '/api/parent/alert-settings', method: 'GET', action: 'alert.settings', auth: true },
  { path: '/api/parent/alert-settings', method: 'POST', action: 'alert.updateSettings', auth: true },
  { path: '/api/parent/alert/emergency', method: 'POST', action: 'alert.sendEmergency', auth: true },
  { path: '/api/alert/list', method: 'GET', action: 'alert.list', auth: true },

  // 围栏相关 (家长端)
  { path: '/api/parent/geofence', method: 'GET', action: 'geofence.list', auth: true },
  { path: '/api/parent/geofence', method: 'POST', action: 'geofence.create', auth: true },

  // 绑定相关
  { path: '/api/binding/code', method: 'GET', action: 'binding.generateCode', auth: true },
  { path: '/api/binding/apply', method: 'POST', action: 'binding.apply', auth: true },
  { path: '/api/binding/confirm', method: 'POST', action: 'binding.confirm', auth: true },
  { path: '/api/binding/children', method: 'GET', action: 'binding.getChildren', auth: true },
  { path: '/api/binding/parent', method: 'GET', action: 'binding.getParent', auth: true },

  // 设备绑定相关
  { path: '/api/device/register', method: 'POST', action: 'device.register', auth: false },
  { path: '/api/device/heartbeat', method: 'POST', action: 'device.heartbeat', auth: false },

  // 使用上报 (孩子端)
  { path: '/api/child/usage/report', method: 'POST', action: 'usage.report', auth: false },

  // 位置上报 (孩子端)
  { path: '/api/child/location/report', method: 'POST', action: 'location.report', auth: false },

  // SOS 求助 (孩子端)
  { path: '/api/child/sos', method: 'POST', action: 'alert.sos', auth: false },

  // 命令轮询 (孩子端)
  { path: '/api/child/command/poll', method: 'GET', action: 'command.poll', auth: false },
];

function matchRoute(path, method) {
  for (const route of routes) {
    if (route.path === path && route.method === method) {
      return route;
    }
  }
  return null;
}

async function callAction(action, data, context) {
  switch (action) {
    // 认证
    case 'auth.login':
      return require('./auth/login').main(data, context);
    case 'auth.register':
      return require('./auth/register').main(data, context);
    case 'auth.sendCode':
      return require('./auth/sendCode').main(data, context);

    // 用户
    case 'user.getProfile':
      return require('./user/getProfile').main(data, context);
    case 'user.updateProfile':
      return require('./user/updateProfile').main(data, context);

    // 设备
    case 'device.status':
      return require('./device/status').main(data, context);
    case 'device.controlStatus':
      return require('./device/controlStatus').main(data, context);
    case 'device.register':
      return require('./device/register').main(data, context);
    case 'device.heartbeat':
      return require('./device/heartbeat').main(data, context);

    // 位置
    case 'location.current':
      return require('./location/current').main(data, context);
    case 'location.history':
      return require('./location/history').main(data, context);
    case 'location.trajectory':
      return require('./location/trajectory').main(data, context);
    case 'location.report':
      return require('./location/report').main(data, context);

    // 使用统计
    case 'usage.stats':
      return require('./usage/stats').main(data, context);
    case 'usage.daily':
      return require('./usage/daily').main(data, context);
    case 'usage.ranking':
      return require('./usage/ranking').main(data, context);
    case 'usage.report':
      return require('./usage/report').main(data, context);

    // 命令
    case 'command.lock':
      return require('./command/lock').main(data, context);
    case 'command.unlock':
      return require('./command/unlock').main(data, context);
    case 'command.poll':
      return require('./command/poll').main(data, context);
    case 'command.setLimit':
      return require('./command/setLimit').main(data, context);
    case 'command.history':
      return require('./command/history').main(data, context);

    // 告警
    case 'alert.settings':
      return require('./alert/settings').main(data, context);
    case 'alert.updateSettings':
      return require('./alert/updateSettings').main(data, context);
    case 'alert.sendEmergency':
      return require('./alert/sendEmergency').main(data, context);
    case 'alert.list':
      return require('./alert/list').main(data, context);
    case 'alert.sos':
      return require('./alert/sos').main(data, context);

    // 围栏
    case 'geofence.list':
      return require('./geofence/list').main(data, context);
    case 'geofence.create':
      return require('./geofence/create').main(data, context);

    // 绑定
    case 'binding.generateCode':
      return require('./binding/generateCode').main(data, context);
    case 'binding.apply':
      return require('./binding/apply').main(data, context);
    case 'binding.confirm':
      return require('./binding/confirm').main(data, context);
    case 'binding.getChildren':
      return require('./binding/getChildren').main(data, context);
    case 'binding.getParent':
      return require('./binding/getParent').main(data, context);

    default:
      return { success: false, error: 'Unknown action: ' + action };
  }
}