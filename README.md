# 亲子守护 App

一款帮助家长守护孩子健康成长的手机监控应用，支持实时位置追踪、应用使用统计、远程锁屏控制等功能。

## 🌟 项目介绍

这是一个**三端架构**的亲子守护项目：

| 端 | 技术栈 | 适用人群 | 目录 |
|---|---|---|---|
| 孩子端 App | uni-app (Android) | 安装在孩子手机上 | `parenting-guardian-app/` |
| 家长端小程序 | 微信小程序 | 家长在微信里使用 | `parenting-guardian-miniprogram/` |
| 服务端 | 支付宝云云函数 | 后台数据服务 | `parenting-guardian-cloud/` |
| H5 演示版 | Vue3 + Vite | 快速预览效果 | `parenting-guardian-h5/` |

## ✨ 功能特性

- 📱 **应用使用统计** - 记录孩子手机各应用使用时长
- 🗺️ **实时位置追踪** - 查看孩子实时位置和历史轨迹
- 🔒 **远程锁屏控制** - 一键锁定/解锁孩子手机
- ⏰ **使用时长限制** - 设置每日使用时长和使用时间段
- 🚨 **SOS 紧急求助** - 孩子一键向家长发送求助信号
- 🔔 **智能告警** - 低电量、出范围等自动提醒

## 🏗️ 项目结构

```
parenting-guardian/
├── parenting-guardian-app/          # 孩子端 uni-app (Android)
│   ├── pages/                        # 页面
│   ├── nativeplugins/                # 原生插件 (UsageStats/DevicePolicy/ForegroundService)
│   ├── api/                          # 接口封装
│   └── manifest.json                 # 应用配置
├── parenting-guardian-miniprogram/   # 家长端 微信小程序
│   ├── pages/                        # 页面 (home/location/control/usage/...)
│   ├── app.js                        # 小程序入口
│   └── app.json                      # 小程序配置
├── parenting-guardian-cloud/         # 支付宝云 云函数
│   ├── auth/                         # 认证模块 (登录/注册/微信登录)
│   ├── device/                       # 设备模块
│   ├── usage/                        # 使用统计模块
│   ├── location/                     # 位置模块
│   ├── command/                      # 指令模块 (锁屏/解锁)
│   ├── alert/                        # 告警模块
│   ├── binding/                      # 绑定模块
│   ├── user/                         # 用户模块
│   ├── geofence/                     # 围栏模块
│   ├── index.js                      # 云函数入口
│   ├── http-api.js                   # HTTP API 入口 (供小程序调用)
│   └── _schema/                      # 数据库集合 Schema
└── parenting-guardian-h5/            # H5 演示版
    ├── src/views/                    # 页面
    └── package.json
```

## 🚀 快速开始（小白推荐）

如果你是第一次接触这个项目，建议先从 **H5 演示版**开始，可以最快看到效果。

### 方式一：运行 H5 演示版（最推荐，5分钟搞定）

**前置条件：** 电脑上安装了 Node.js（建议 16.x 或更高版本）

> 不知道怎么装 Node.js？搜索 "Node.js 官网下载"，下载 LTS 版本一路下一步安装即可。

```bash
# 1. 进入 H5 演示版目录
cd parenting-guardian-h5

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

启动成功后，浏览器打开 `http://localhost:5173` 就能看到效果了！

---

### 方式二：运行微信小程序（家长端）

**前置条件：**
1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 注册一个微信小程序账号（没有也可以用测试号）

**步骤：**

1. 打开微信开发者工具
2. 点击「导入项目」
3. 目录选择：`parenting-guardian-miniprogram`
4. AppID：如果没有就选「测试号」
5. 点击「导入」即可预览

> ⚠️ 注意：小程序默认调用支付宝云的 HTTP API，部署云函数后才能正常使用。

---

### 方式三：运行孩子端 App（uni-app）

**前置条件：**
1. 下载并安装 [HBuilderX](https://www.dcloud.io/hbuilderx.html)（uni-app 官方 IDE）
2. 准备一台 Android 手机（或模拟器）

**步骤：**

1. 用 HBuilderX 打开 `parenting-guardian-app` 目录
2. 手机连接电脑，开启「USB 调试」
3. 点击菜单「运行 → 运行到手机或模拟器 → 运行到 Android App 基座」
4. 手机上确认安装即可

> 💡 提示：原生插件需要打自定义基座才能生效，开发调试可以先不用插件。

---

## ☁️ 部署服务端（支付宝云）

服务端使用支付宝云（类似 uniCloud），需要先注册支付宝云账号。

### 第一步：创建云服务空间

1. 登录 [支付宝云控制台](https://cloud.alipay.com/)
2. 点击「创建服务空间」
3. 空间名：`parenting-guardian`
4. 选择按量付费（免费额度够用）
5. 创建完成后，记住你的 **SpaceID**

### 第二步：创建数据库集合

在支付宝云控制台 → 数据库 → 新建集合，依次创建以下 9 个集合：

| 集合名 | 说明 |
|---|---|
| `users` | 用户表 |
| `devices` | 设备表 |
| `bindings` | 亲子绑定关系 |
| `usage_records` | 应用使用记录 |
| `location_records` | 位置记录 |
| `commands` | 控制指令 |
| `alerts` | 告警记录 |
| `geofences` | 电子围栏 |
| `geofence_events` | 围栏事件 |

每个集合的 Schema 定义在 `parenting-guardian-cloud/_schema/` 目录下，可以参考创建字段。

### 第三步：部署云函数

**方式 A：通过 HBuilderX 部署（推荐）**

1. 用 HBuilderX 打开 `parenting-guardian-app` 项目
2. 右键 `uniCloud` 目录 → 关联云服务空间
3. 选择你创建的空间
4. 右键云函数目录 → 上传部署

**方式 B：手动上传代码包**

1. 将 `parenting-guardian-cloud` 目录打包成 zip
2. 在支付宝云控制台 → 云函数 → 新建云函数
3. 函数名：`cloudfunctions`
4. 上传代码包
5. 配置 HTTP 触发器（路径：`/api/*`）

### 第四步：配置环境变量

在支付宝云控制台 → 云函数 → 配置 → 环境变量：

| 变量名 | 说明 | 必填 |
|---|---|---|
| `JWT_SECRET` | Token 加密密钥（随便填一串复杂字符）| 是 |
| `WECHAT_APPID` | 微信小程序 AppID | 否 |
| `WECHAT_SECRET` | 微信小程序 AppSecret | 否 |

> 💡 不填微信相关的变量也可以，会自动使用 mock 模式登录。

### 第五步：获取 HTTP 访问地址

部署完成后，在支付宝云控制台找到云函数的 **HTTP 访问地址**，格式类似：
```
https://env-xxxxxx.cloud.alipay.com
```

把这个地址填到小程序的 `app.js` 里：
```javascript
// parenting-guardian-miniprogram/app.js
globalData: {
  serverUrl: 'https://你的云函数地址'  // 改成你的地址
}
```

---

## 📱 绑定设备流程

部署完成后，需要绑定家长和孩子的账号：

1. **家长端**：在微信小程序登录（微信一键登录）
2. **家长端**：进入「设置 → 管理孩子设备 → 生成绑定码」
3. **孩子端**：在 App 里输入绑定码
4. **家长端**：确认绑定
5. 完成！可以开始监控了

---

## 🔧 常见问题

### Q: H5 演示版启动报错怎么办？
A: 检查 Node.js 版本，建议使用 16.x 或 18.x。执行 `node -v` 查看版本。

### Q: 微信小程序提示「request 合法域名校验失败」？
A: 开发阶段在微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」。
上线前需要在微信公众平台配置 request 合法域名为你的支付宝云地址。

### Q: 孩子端 App 锁屏功能不生效？
A: 需要授予「设备管理员」权限。首次使用锁屏功能时会引导开启，按照提示操作即可。

### Q: 怎么获取微信小程序的 AppID 和 AppSecret？
A: 登录 [微信公众平台](https://mp.weixin.qq.com/) → 开发 → 开发管理 → 开发设置 中查看。

### Q: 支付宝云收费吗？
A: 有免费额度，个人学习使用基本不花钱。具体价格参考支付宝云官网。

---

## 📚 技术栈说明

| 模块 | 技术 |
|---|---|
| 孩子端 App | uni-app + Vue3 + 原生插件(Kotlin) |
| 家长端小程序 | 微信小程序原生开发 |
| 服务端 | Node.js + 支付宝云云函数 |
| 数据库 | 支付宝云数据库 (MongoDB 风格) |
| H5 演示版 | Vue3 + Vite + Pinia |

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License
