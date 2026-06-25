# 亲子守护 App 详细设计文档

## 一、项目概述

### 1.1 项目名称
**亲子守护** —— 一款帮助家长了解和引导孩子健康使用手机的管理工具

### 1.2 核心目标
- 让家长**实时了解**孩子手机使用情况
- 通过**远程控制**帮助孩子自律
- **实时守护孩子安全**（位置监控）
- 培养孩子**健康用机**习惯
- 保护孩子**视力**、**人身安全**

### 1.3 设计原则
- **透明原则**：孩子端明确知道被监控，保护隐私底线
- **最小权限**：只收集必要信息
- **双向沟通**：不是单方面监控，而是共同成长工具
- **安全第一**：孩子位置实时可见，紧急情况快速响应

---

## 二、整体系统架构

### 2.1 系统组成

```
┌──────────────────────────────────────────────────┐
│                   亲子守护 App                   │
│              (单 APK，角色区分)                   │
│  ┌─────────────────┐    ┌─────────────────┐   │
│  │   家长模式       │    │   孩子模式       │   │
│  │   (PARENT)      │    │   (CHILD)       │   │
│  └────────┬────────┘    └────────┬────────┘   │
└───────────┼───────────────────────┼─────────────┘
            │                       │
            ▼                       ▼
┌──────────────────────────────────────────────────┐
│              支付宝云 · 云开发                     │
│         (Serverless 云函数 + 云数据库)            │
│  ┌──────────────────────────────────────────┐   │
│  │           云函数 (Cloud Functions)        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ user    │ │ device  │ │ location│   │   │
│  │  │ 函数模块 │ │ 函数模块 │ │ 函数模块 │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │ command │ │ alert   │ │ report  │   │   │
│  │  │ 函数模块 │ │ 函数模块 │ │ 函数模块 │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘   │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │         云数据库 (MongoDB)               │   │
│  │  users / devices / locations / commands  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │         云存储 + CDN                      │   │
│  │  头像 / 文件 / 静态资源                   │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │         云推送 (蚂蚁推送)                 │   │
│  │  实时指令 / 告警通知                      │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

### 2.2 技术选型

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| **App端** | uniapp (Vue + 插件) | 一套代码，开发 Android/iOS |
| **App架构** | MVVM + VUE 3 | 角色通过页面/状态区分 |
| **原生插件** | Android 原生插件 | UsageStats、锁屏、后台服务 |
| **服务端** | 支付宝云 · 云开发 (Node.js) | 云函数 + 云数据库 |
| **数据库** | 云数据库 MongoDB | 支付宝云提供 |
| **实时通信** | 云推送 + 轮询 | 蚂蚁推送 + 定时拉取 |
| **文件存储** | 云存储 | 支付宝云 OSS |
| **消息推送** | uniPush (蚂蚁推送) | 免费额度 |
| **地图服务** | 高德地图 | 位置展示 |

### 2.3 uniapp + 原生插件架构

```
┌─────────────────────────────────────────────────────────┐
│                    亲子守护 App                          │
│                 (uniapp + 原生插件)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              uniapp 前端层 (Vue 3)                  │ │
│  │                                                     │ │
│  │   pages/                                            │ │
│  │   ├── login/          登录注册                     │ │
│  │   ├── home/           首页 (家长/孩子不同)           │ │
│  │   ├── location/       位置守护                      │ │
│  │   ├── control/        远程控制                      │ │
│  │   ├── alert/          告警消息                      │ │
│  │   └── settings/       设置                          │ │
│  │                                                     │ │
│  │   components/         公共组件                        │ │
│  │   ├── AppList.vue    应用列表组件                   │ │
│  │   ├── MapView.vue    地图组件                       │ │
│  │   └── LockScreen.vue 锁屏组件                       │ │
│  │                                                     │ │
│  │   static/            静态资源                       │ │
│  │   └── native/        原生插件桥接文件               │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                               │
│                           ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │              原生插件层 (Android)                    │ │
│  │                                                     │ │
│  │   // App Usage Stats Plugin                         │ │
│  │   native/UsageStatsPlugin.kt                       │ │
│  │   ├── getRunningApps()      获取前台应用            │ │
│  │   ├── getAppUsageStats()    获取使用统计            │ │
│  │   └── getInstalledApps()     获取已安装应用          │ │
│  │                                                     │ │
│  │   // Device Policy Plugin (锁屏)                   │ │
│  │   native/DevicePolicyPlugin.kt                     │ │
│  │   ├── lockScreen()         锁屏                   │ │
│  │   ├── unlockScreen()       解锁                   │ │
│  │   └── isAdminActive()      检查管理员状态          │ │
│  │                                                     │ │
│  │   // Background Service Plugin (后台保活)            │ │
│  │   native/BackgroundService.kt                      │ │
│  │   ├── startForeground()     启动前台服务            │ │
│  │   └── stopForeground()      停止服务               │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                           │                               │
│                           ▼                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │              支付宝云 · 云开发                       │ │
│  │                                                     │ │
│  │   cloudfunctions/     云函数 (Node.js)              │ │
│  │   └── common/        公共库                         │ │
│  │                                                     │ │
│  │   database/           云数据库 (MongoDB)            │ │
│  │                                                     │ │
│  │   storage/            云存储                        │ │
│  │                                                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 2.4 uniapp 适用性分析

#### ✅ 完全支持的功能
| 功能 | 说明 |
|------|------|
| 用户认证 | `uni.login` + 云函数 |
| 页面展示 | Vue 3 + uView UI |
| 云数据库操作 | `uniCloud.database()` |
| 云函数调用 | `uniCloud.callFunction()` |
| 位置获取 | `uni.getLocation` |
| 消息推送 | uniPush (集成蚂蚁推送) |
| 文件上传 | `uniCloud.uploadFile()` |
| 扫码绑定 | `uni.scanCode` |

#### ⚠️ 需要原生插件的功能
| 功能 | 解决方案 | 优先级 |
|------|----------|--------|
| 应用使用统计 | 原生插件 UsageStats | P0 |
| 远程锁屏 | 原生插件 DevicePolicy | P0 |
| 后台服务保活 | 原生插件 ForegroundService | P0 |
| 自定义锁屏页面 | 原生 Activity | P1 |
| 应用分类识别 | 原生插件 + 云端分类 | P1 |

#### ❌ 不支持的功能（Android/iOS 限制）
| 功能 | 说明 |
|------|------|
| 监控其他应用 | iOS 完全不支持，Android 可行 |
| 强制锁屏 | iOS 不支持，Android 可行 |

**结论**：本 App 主要针对 Android 平台，iOS 版本功能会受限。

类似 uniCloud 的 serverless 架构：

```
┌─────────────────────────────────────────────────────┐
│              支付宝云 · 云开发架构                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │              开发者工具                      │  │
│   │         (支付宝开发者工具 / API)            │  │
│   └──────────────────────┬──────────────────────┘  │
│                          │ 部署                     │
│                          ▼                          │
│   ┌─────────────────────────────────────────────┐  │
│   │           云函数 (Cloud Functions)           │  │
│   │                                              │  │
│   │   ├── index.js (入口)                        │  │
│   │   ├── user/                                 │  │
│   │   │   ├── login.js                          │  │
│   │   │   ├── register.js                       │  │
│   │   │   └── profile.js                        │  │
│   │   ├── device/                               │  │
│   │   │   ├── register.js                       │  │
│   │   │   └── heartbeat.js                      │  │
│   │   ├── location/                             │  │
│   │   │   ├── report.js                         │  │
│   │   │   └── history.js                        │  │
│   │   ├── command/                              │  │
│   │   │   ├── lock.js                           │  │
│   │   │   └── unlock.js                         │  │
│   │   └── usage/                                │  │
│   │       └── report.js                         │  │
│   │                                              │  │
│   └──────────────────────┬──────────────────────┘  │
│                          │                          │
│   ┌──────────────────────▼──────────────────────┐  │
│   │           云数据库 (MongoDB)                 │  │
│   │                                              │  │
│   │   ├── collection: users                     │  │
│   │   ├── collection: devices                   │  │
│   │   ├── collection: bindings                  │  │
│   │   ├── collection: locations                 │  │
│   │   ├── collection: app_usage                 │  │
│   │   ├── collection: commands                  │  │
│   │   ├── collection: alerts                    │  │
│   │   └── collection: geofences                 │  │
│   │                                              │  │
│   └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2.4 云开发优势

| 特性 | 传统 ECS 部署 | 云开发模式 |
|------|---------------|------------|
| 运维成本 | 高（需自己管理服务器） | 零运维 |
| 扩展性 | 手动扩缩容 | 自动弹性伸缩 |
| 成本 | 固定月费 | 按调用量计费 |
| 开发效率 | 慢 | 快（类似 uniCloud） |
| 数据库 | 需单独购买 RDS | 内置 MongoDB |
| 推送 | 需接入第三方 | 内置蚂蚁推送 |

### 2.5 核心通信方式

| 通信路径 | 方式 | 说明 |
|----------|------|------|
| App → 云函数 | HTTPS 调用 | 客户端直接调用云函数 |
| 云函数 → 云数据库 | 内部调用 | 云函数操作数据库 |
| 云函数 → App | 云推送 | 实时指令下发 |
| 实时状态 | 轮询 | 每 10 秒拉取一次 |

---

## 三、统一 App（亲子守护）架构

### 3.1 概述
**一个 APK，两个模式**：用户安装同一个 App，登录后根据角色显示不同界面和功能。

### 3.2 角色区分机制

```
┌─────────────────────────────────────────────────┐
│                 App 启动流程                     │
└─────────────────────────────────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │    启动页 + 权限申请   │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │     登录/注册        │
            │  (调用云函数 auth)    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │  选择角色 (首次)       │
            │  孩子 / 家长          │
            └───────────┬───────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
    ┌───────────────┐       ┌───────────────┐
    │   孩子模式     │       │   家长模式     │
    │   (CHILD)     │       │   (PARENT)   │
    │               │       │               │
    │ - 使用统计    │       │ - 监控面板    │
    │ - 位置上报    │       │ - 远程控制    │
    │ - 接收锁屏    │       │ - 位置查看    │
    │ - 紧急求助    │       │ - 告警管理    │
    └───────────────┘       └───────────────┘
```

### 3.3 孩子端功能（Child Mode）

#### 3.3.1 应用使用统计模块
**功能描述**：
- 实时监测前台应用包名、应用名称
- 记录每次使用开始时间、结束时间
- 统计每日各应用使用时长
- 统计手机解锁次数、使用频次
- 统计屏幕亮屏总时长

**技术实现**：
- 使用 `UsageStatsManager` 系统 API
- 每 1 分钟批量上报一次
- 离线时本地 SQLite 缓存，联网后补发
- 调用云函数 `usage.report` 上报数据

**数据粒度**：
| 字段 | 说明 |
|------|------|
| packageName | 应用包名 |
| appName | 应用名称 |
| startTime | 使用开始时间 |
| endTime | 使用结束时间 |
| duration | 使用时长（秒） |
| date | 日期 |

#### 3.3.2 屏幕状态监测模块
**功能描述**：
- 监测屏幕亮屏/息屏状态
- 记录手机解锁次数
- 记录每次亮屏时长

**技术实现**：
- 监听 `ACTION_SCREEN_ON/OFF` 广播
- 监听 `ACTION_USER_PRESENT` 解锁广播
- 调用云函数 `screen.event` 上报事件

#### 3.3.3 定位上报模块（MVP 核心功能）
**功能描述**：
- 实时获取孩子当前位置
- 定时上报位置到云数据库（每 1 分钟）
- 息屏时降低定位频率（每 5 分钟）
- 移动时自动上报位置变化

**技术实现**：
- 使用 `FusedLocationProviderClient` (Google Location Services)
- GPS + 网络定位融合
- 后台使用 WorkManager 定时任务
- 调用云函数 `location.report` 上报位置
- 电量优化：息屏时降低精度

**数据粒度**：
| 字段 | 说明 |
|------|------|
| latitude | 纬度 |
| longitude | 经度 |
| accuracy | 精度（米） |
| locationType | GPS/WIFI/CELL |
| speed | 速度（m/s） |
| timestamp | 时间戳 |
| address | 地址（逆地理编码） |

#### 3.3.4 远程锁屏/解锁模块
**功能描述**：
- 接收家长端下发的锁屏指令
- 立即锁屏（显示自定义锁屏页面）
- 接收解锁指令后解除锁屏
- 支持定时锁屏（家长设置的时间计划）

**技术实现**：
- 轮询云函数 `command.poll` 获取待执行指令（默认每 60 秒，可配置）
- 使用 `DevicePolicyManager` 设备管理员权限
- 自定义锁屏 Activity 覆盖全屏（TYPE_SYSTEM_ERROR）
- 调用云函数 `command.execute` 确认执行结果

**锁屏页面展示**：
```
┌────────────────────────────────┐
│                                │
│         🌙 休息一下吧           │
│                                │
│    家长说：去学习啦~            │
│                                │
│    剩余锁屏时间：45:30          │
│                                │
│  ┌──────────────────────────┐  │
│  │      📞 紧急联系家长      │  │
│  └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

#### 3.3.5 紧急求助模块
**功能描述**：
- 一键发送紧急求助（位置 + 求助信息）
- SOS 按钮快速触发
- 自动拨打家长电话
- 连续按电源键3次自动求助

**技术实现**：
- 调用云函数 `alert.sos` 发送求助
- 云函数自动推送消息给绑定的家长

#### 3.3.6 数据上报模块
**上报策略**：
- 使用数据：每 1 分钟上报一次
- 位置数据：每 1 分钟上报一次（息屏时5分钟，可配置）
- 屏幕状态：变化时即时上报
- **指令轮询：默认每 60 秒一次**（可在设置中调整为30秒/5分钟）
- 离线缓存：最多缓存 3 天数据
- 补发机制：联网后自动补发

#### 3.3.7 防卸载保护
**功能描述**：
- 设备管理员权限，防止随意卸载
- 卸载需要家长端授权
- 开机自启动
- 前台服务保活（电量优化白名单引导）

---

## 四、家长端功能（Parent Mode）

### 4.1 实时监控首页
**今日概览卡片**：
- 今日总使用时长
- 当前正在使用的应用
- 今日解锁次数
- 今日屏幕亮屏时长

**实时位置卡片**：
- 孩子当前所在位置
- 最后更新时间
- 定位状态（在线/离线/定位中）
- 一键刷新位置

**今日使用排行**：
- 按使用时长排序的应用列表
- 每个应用显示使用时长、占比
- 彩色进度条可视化

**时间轴视图**：
- 今日使用时间轴
- 直观展示每个时段使用的应用
- 支持查看历史某天的数据

### 4.2 位置守护模块（MVP 核心功能）
**功能描述**：
- 实时查看孩子当前位置
- 查看位置历史轨迹
- 电子围栏告警（孩子离开安全区域）
- 位置刷新（手动/自动）

**地图展示**：
- 高德地图 SDK 集成
- 实时位置标注
- 安全区域显示（圆形）
- 轨迹回放

**电子围栏设置**：
- 创建安全区域（家、学校等）
- 设置半径（100m - 500m）
- 进出围栏告警
- 围栏生效时间段

### 4.3 远程控制模块
**一键锁屏/解锁**：
- 调用云函数 `command.lock` 下发锁屏指令
- 调用云函数 `command.unlock` 下发解锁指令
- 锁屏时长设置（15分钟/30分钟/1小时/自定义）

**应用限时**：
- 为单个应用设置每日限额
- 为应用分类设置限额
- 限额生效时间段设置

**定时计划**：
- 上课时间自动锁屏
- 睡觉时间自动锁屏
- 自定义时间计划

### 4.4 使用统计模块
**日报/周报/月报**：
- 每日使用详情
- 每周使用趋势图
- 每月汇总报告

**应用分类统计**：
- 游戏类
- 社交类
- 学习类
- 视频类
- 其他

### 4.5 告警通知模块
**告警类型**：
- 单日使用时长超标告警
- 深夜使用告警
- 新安装应用告警
- 尝试卸载告警
- **位置异常告警（电子围栏）**
- **孩子发起紧急求助**

### 4.6 孩子管理模块
- 支持绑定多个孩子
- 孩子信息管理（姓名、头像、关系）
- 切换查看不同孩子
- 单独设置每个孩子的策略

---

## 五、云开发服务端设计

### 5.1 云函数列表

#### 5.1.1 认证模块 (auth)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| auth/login | POST | 手机号+验证码登录 |
| auth/register | POST | 用户注册 |
| auth/sendCode | POST | 发送验证码 |
| auth/refreshToken | POST | 刷新Token |
| auth/logout | POST | 登出 |

#### 5.1.2 用户模块 (user)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| user/getProfile | GET | 获取个人资料 |
| user/updateProfile | POST | 更新个人资料 |
| user/setEmergencyPhone | POST | 设置紧急联系电话 |

#### 5.1.3 绑定模块 (binding)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| binding/generateCode | POST | 家长生成绑定码 |
| binding/apply | POST | 孩子申请绑定 |
| binding/confirm | POST | 家长确认绑定 |
| binding/getChildren | GET | 获取绑定的孩子列表 |
| binding/getParent | GET | 获取绑定的家长 |
| binding/unbind | POST | 解除绑定 |

#### 5.1.4 设备模块 (device)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| device/register | POST | 注册设备 |
| device/heartbeat | POST | 心跳 |
| device/getStatus | GET | 获取设备状态 |
| device/getList | GET | 获取设备列表 |

#### 5.1.5 使用统计模块 (usage)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| usage/report | POST | 批量上报使用数据 |
| usage/daily | GET | 获取日使用统计 |
| usage/timeline | GET | 获取时间轴数据 |
| usage/ranking | GET | 获取应用排行 |
| usage/summary | GET | 获取汇总统计 |

#### 5.1.6 位置模块 (location)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| location/report | POST | 上报位置 |
| location/current | GET | 获取当前位置 |
| location/history | GET | 获取位置历史 |
| location/trajectory | GET | 获取轨迹 |

#### 5.1.7 指令模块 (command)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| command/lock | POST | 发送锁屏指令 |
| command/unlock | POST | 发送解锁指令 |
| command/poll | GET | 孩子端轮询待执行指令 |
| command/execute | POST | 确认指令执行结果 |
| command/history | GET | 获取指令历史 |
| command/setLimit | POST | 设置应用限额 |
| command/removeLimit | POST | 删除限额 |

#### 5.1.8 告警模块 (alert)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| alert/sos | POST | 孩子发起SOS |
| alert/list | GET | 获取告警列表 |
| alert/read | POST | 标记告警已读 |
| alert/push | - | 内部推送告警 |

#### 5.1.9 围栏模块 (geofence)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| geofence/create | POST | 创建围栏 |
| geofence/update | POST | 更新围栏 |
| geofence/delete | POST | 删除围栏 |
| geofence/list | GET | 获取围栏列表 |
| geofence/check | POST | 检查围栏状态（内部） |

#### 5.1.10 推送模块 (push)

| 云函数 | 方法 | 说明 |
|--------|------|------|
| push/register | POST | 注册推送Token |
| push/unregister | POST | 注销推送Token |

---

### 5.2 云数据库设计

#### 5.2.1 Collection: users（用户表）
```javascript
{
  _id: ObjectId,
  phone: String,              // 手机号
  password: String,           // 密码（加密）
  role: String,               // PARENT / CHILD
  nickname: String,            // 昵称
  avatar: String,             // 头像URL
  emergencyPhone: String,     // 紧急联系电话
  pushToken: String,          // 推送Token
  status: String,             // ACTIVE / BANNED
  createTime: Date,
  updateTime: Date
}
```

#### 5.2.2 Collection: bindings（绑定关系表）
```javascript
{
  _id: ObjectId,
  parentId: ObjectId,         // 家长用户ID
  childId: ObjectId,           // 孩子用户ID
  bindingCode: String,         // 绑定码（6位）
  childNickname: String,       // 孩子备注名
  childAvatar: String,         // 孩子头像
  relationship: String,        // 关系
  status: String,              // PENDING / ACTIVE / UNBINDED
  createTime: Date,
  updateTime: Date
}
```

#### 5.2.3 Collection: devices（设备表）
```javascript
{
  _id: ObjectId,
  userId: ObjectId,           // 关联用户ID
  deviceId: String,           // 设备唯一标识
  deviceName: String,         // 设备名称
  deviceModel: String,        // 设备型号
  osVersion: String,          // 系统版本
  appVersion: String,         // App版本
  isOnline: Boolean,          // 是否在线
  lastOnline: Date,           // 最后在线时间
  createTime: Date
}
```

#### 5.2.4 Collection: app_usage（应用使用记录表）
```javascript
{
  _id: ObjectId,
  deviceId: ObjectId,          // 设备ID
  userId: ObjectId,            // 用户ID
  packageName: String,         // 应用包名
  appName: String,             // 应用名称
  category: String,            // 分类
  startTime: Date,            // 开始时间
  endTime: Date,              // 结束时间
  duration: Number,            // 时长(秒)
  date: String,               // 日期 (YYYY-MM-DD)
  createTime: Date
}
```

#### 5.2.5 Collection: locations（位置记录表）
```javascript
{
  _id: ObjectId,
  deviceId: ObjectId,          // 设备ID
  userId: ObjectId,            // 用户ID
  latitude: Number,            // 纬度
  longitude: Number,           // 经度
  accuracy: Number,           // 精度
  altitude: Number,           // 海拔
  speed: Number,              // 速度
  locationType: String,       // GPS / WIFI / CELL
  address: String,            // 地址
  timestamp: Date,            // 定位时间
  createTime: Date
}
```

#### 5.2.6 Collection: commands（指令表）
```javascript
{
  _id: ObjectId,
  parentId: ObjectId,          // 发起人ID
  childId: ObjectId,          // 孩子用户ID
  deviceId: ObjectId,         // 目标设备ID
  cmdType: String,            // LOCK / UNLOCK / SET_LIMIT
  cmdData: Object,            // 指令参数 { duration: 1800, message: "休息一下" }
  status: String,              // PENDING / EXECUTED / FAILED / EXPIRED
  createTime: Date,
  executeTime: Date
}
```

#### 5.2.7 Collection: alerts（告警表）
```javascript
{
  _id: ObjectId,
  parentId: ObjectId,          // 家长用户ID
  childId: ObjectId,           // 孩子用户ID
  alertType: String,           // SOS / USAGE_OVERTIME / GEOFENCE / UNINSTALL
  title: String,               // 告警标题
  content: String,             // 告警内容
  latitude: Number,            // 告警位置纬度
  longitude: Number,           // 告警位置经度
  address: String,            // 告警位置地址
  isRead: Boolean,            // 是否已读
  createTime: Date
}
```

#### 5.2.8 Collection: geofences（电子围栏表）
```javascript
{
  _id: ObjectId,
  parentId: ObjectId,          // 家长用户ID
  childId: ObjectId,           // 孩子用户ID
  name: String,               // 围栏名称
  latitude: Number,           // 中心纬度
  longitude: Number,          // 中心经度
  radius: Number,             // 半径(米)
  enabled: Boolean,          // 是否启用
  alertIn: Boolean,          // 进入告警
  alertOut: Boolean,         // 离开告警
  createTime: Date
}
```

#### 5.2.9 Collection: app_limits（应用限额表）
```javascript
{
  _id: ObjectId,
  parentId: ObjectId,          // 家长用户ID
  childId: ObjectId,           // 孩子用户ID
  deviceId: ObjectId,          // 设备ID
  packageName: String,         // 应用包名
  appName: String,             // 应用名称
  category: String,            // 分类
  dailyLimit: Number,          // 每日限额(分钟)
  enabled: Boolean,           // 是否启用
  createTime: Date
}
```

#### 5.2.10 Collection: screen_events（屏幕事件表）
```javascript
{
  _id: ObjectId,
  deviceId: ObjectId,          // 设备ID
  userId: ObjectId,            // 用户ID
  eventType: String,          // SCREEN_ON / SCREEN_OFF / UNLOCK
  eventTime: Date,            // 事件时间
  date: String,               // 日期
  createTime: Date
}
```

---

### 5.3 云函数示例代码

#### 5.3.1 入口文件 index.js
```javascript
'use strict';

exports.main = async (event, context) => {
  const { action, data } = event;
  
  try {
    switch (action) {
      // 认证
      case 'auth.login': return require('./auth/login').main(data, context);
      case 'auth.register': return require('./auth/register').main(data, context);
      case 'auth.sendCode': return require('./auth/sendCode').main(data, context);
      
      // 用户
      case 'user.getProfile': return require('./user/getProfile').main(data, context);
      case 'user.updateProfile': return require('./user/updateProfile').main(data, context);
      
      // 绑定
      case 'binding.generateCode': return require('./binding/generateCode').main(data, context);
      case 'binding.apply': return require('./binding/apply').main(data, context);
      case 'binding.confirm': return require('./binding/confirm').main(data, context);
      case 'binding.getChildren': return require('./binding/getChildren').main(data, context);
      
      // 设备
      case 'device.register': return require('./device/register').main(data, context);
      case 'device.heartbeat': return require('./device/heartbeat').main(data, context);
      
      // 使用统计
      case 'usage.report': return require('./usage/report').main(data, context);
      case 'usage.daily': return require('./usage/daily').main(data, context);
      
      // 位置
      case 'location.report': return require('./location/report').main(data, context);
      case 'location.current': return require('./location/current').main(data, context);
      case 'location.history': return require('./location/history').main(data, context);
      
      // 指令
      case 'command.lock': return require('./command/lock').main(data, context);
      case 'command.unlock': return require('./command/unlock').main(data, context);
      case 'command.poll': return require('./command/poll').main(data, context);
      case 'command.execute': return require('./command/execute').main(data, context);
      
      // 告警
      case 'alert.sos': return require('./alert/sos').main(data, context);
      case 'alert.list': return require('./alert/list').main(data, context);
      
      // 围栏
      case 'geofence.create': return require('./geofence/create').main(data, context);
      case 'geofence.list': return require('./geofence/list').main(data, context);
      case 'geofence.delete': return require('./geofence/delete').main(data, context);
      
      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    console.error('云函数错误:', error);
    return { success: false, error: error.message };
  }
};
```

#### 5.3.2 登录云函数 auth/login.js
```javascript
'use strict';
const cloud = require('wx-server-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();
  const { phone, code, password } = event;
  
  try {
    // 1. 验证验证码（或密码）
    // 简化版：直接使用密码登录
    // 正式版应校验短信验证码
    
    // 2. 查找用户
    const userRes = await db.collection('users')
      .where({ phone })
      .get();
    
    if (userRes.data.length === 0) {
      return { success: false, error: '用户不存在' };
    }
    
    const user = userRes.data[0];
    
    // 3. 验证密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { success: false, error: '密码错误' };
    }
    
    // 4. 生成 Token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    
    // 5. 更新推送Token
    if (event.pushToken) {
      await db.collection('users').doc(user._id).update({
        data: { pushToken: event.pushToken }
      });
    }
    
    return {
      success: true,
      data: {
        token,
        userId: user._id,
        role: user.role,
        nickname: user.nickname,
        avatar: user.avatar
      }
    };
    
  } catch (error) {
    console.error('登录错误:', error);
    return { success: false, error: error.message };
  }
};
```

#### 5.3.3 位置上报云函数 location/report.js
```javascript
'use strict';
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();
  const { userId, deviceId, latitude, longitude, accuracy, altitude, speed, locationType, address } = event;
  
  try {
    // 1. 保存位置记录
    await db.collection('locations').add({
      data: {
        userId,
        deviceId,
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        locationType,
        address,
        timestamp: new Date(),
        createTime: new Date()
      }
    });
    
    // 2. 更新设备在线状态
    await db.collection('devices')
      .where({ deviceId })
      .update({
        data: {
          isOnline: true,
          lastOnline: new Date()
        }
      });
    
    // 3. 检查电子围栏
    const geofences = await db.collection('geofences')
      .where({ childId: userId, enabled: true })
      .get();
    
    const alerts = [];
    for (const fence of geofences.data) {
      const distance = calculateDistance(
        latitude, longitude,
        fence.latitude, fence.longitude
      );
      
      const inside = distance <= fence.radius;
      const status = inside ? 'INSIDE' : 'OUTSIDE';
      
      // 简化：实际应存储上次状态比较
      if (inside && fence.alertIn) {
        alerts.push({
          parentId: fence.parentId,
          childId: userId,
          alertType: 'GEOFENCE',
          title: `${fence.name}进入提醒`,
          content: `孩子进入了${fence.name}区域`,
          latitude,
          longitude,
          address,
          createTime: new Date()
        });
      } else if (!inside && fence.alertOut) {
        alerts.push({
          parentId: fence.parentId,
          childId: userId,
          alertType: 'GEOFENCE',
          title: `${fence.name}离开提醒`,
          content: `孩子离开了${fence.name}区域`,
          latitude,
          longitude,
          address,
          createTime: new Date()
        });
      }
    }
    
    // 4. 插入告警
    if (alerts.length > 0) {
      for (const alert of alerts) {
        await db.collection('alerts').add({ data: alert });
        // TODO: 推送消息给家长
        await pushAlert(alert.parentId, alert);
      }
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('位置上报错误:', error);
    return { success: false, error: error.message };
  }
};

// 计算两点间距离（米）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 推送告警
async function pushAlert(parentId, alert) {
  // 调用支付宝云推送
  const db = cloud.database();
  const parent = await db.collection('users').doc(parentId).get();
  
  if (parent.data && parent.data.pushToken) {
    // 使用云推送 API
    await cloud.openapi.push({
      token: parent.data.pushToken,
      title: alert.title,
      content: alert.content,
      payload: { alertType: alert.alertType }
    });
  }
}
```

#### 5.3.4 锁屏指令云函数 command/lock.js
```javascript
'use strict';
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();
  const { parentId, childId, deviceId, duration, message } = event;
  
  try {
    // 1. 创建指令记录
    const cmdRes = await db.collection('commands').add({
      data: {
        parentId,
        childId,
        deviceId,
        cmdType: 'LOCK',
        cmdData: {
          duration: duration || 1800, // 默认30分钟
          message: message || '休息一下吧'
        },
        status: 'PENDING',
        createTime: new Date()
      }
    });
    
    // 2. 获取孩子的设备信息
    const deviceRes = await db.collection('devices')
      .where({ userId: childId })
      .get();
    
    if (deviceRes.data.length > 0) {
      const device = deviceRes.data[0];
      
      // 3. 推送指令到孩子设备
      // 这里简化处理，实际使用云推送
      await cloud.openapi.push({
        token: device.pushToken,
        title: '远程锁屏',
        content: message || '家长要求你休息一下',
        payload: {
          cmdId: cmdRes._id,
          cmdType: 'LOCK',
          duration: duration || 1800,
          message: message || '休息一下吧'
        }
      });
    }
    
    return {
      success: true,
      data: { commandId: cmdRes._id }
    };
    
  } catch (error) {
    console.error('锁屏指令错误:', error);
    return { success: false, error: error.message };
  }
};
```

#### 5.3.5 轮询指令云函数 command/poll.js
```javascript
'use strict';
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

exports.main = async (event, context) => {
  const db = cloud.database();
  const { userId, deviceId, lastCommandId } = event;
  
  try {
    // 1. 查询待执行的指令
    let query = {
      childId: userId,
      status: 'PENDING'
    };
    
    if (lastCommandId) {
      query._id = db.command.neq(lastCommandId);
    }
    
    const commands = await db.collection('commands')
      .where(query)
      .orderBy('createTime', 'asc')
      .limit(10)
      .get();
    
    // 2. 查询未读的告警
    const alerts = await db.collection('alerts')
      .where({
        childId: userId,
        isRead: false
      })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get();
    
    return {
      success: true,
      data: {
        commands: commands.data,
        alerts: alerts.data
      }
    };
    
  } catch (error) {
    console.error('轮询错误:', error);
    return { success: false, error: error.message };
  }
};
```

---

### 5.4 数据库索引设计

```javascript
// users 表索引
db.collection('users').createIndex({ phone: 1 }, { unique: true });

// bindings 表索引
db.collection('bindings').createIndex({ parentId: 1 });
db.collection('bindings').createIndex({ childId: 1 });
db.collection('bindings').createIndex({ bindingCode: 1 });
db.collection('bindings').createIndex({ parentId: 1, childId: 1 });

// devices 表索引
db.collection('devices').createIndex({ userId: 1 });
db.collection('devices').createIndex({ deviceId: 1 }, { unique: true });

// locations 表索引
db.collection('locations').createIndex({ userId: 1, timestamp: -1 });
db.collection('locations').createIndex({ deviceId: 1, timestamp: -1 });

// app_usage 表索引
db.collection('app_usage').createIndex({ userId: 1, date: -1 });
db.collection('app_usage').createIndex({ deviceId: 1, date: -1 });
db.collection('app_usage').createIndex({ userId: 1, date: 1, packageName: 1 });

// commands 表索引
db.collection('commands').createIndex({ childId: 1, status: 1 });
db.collection('commands').createIndex({ parentId: 1, createTime: -1 });

// alerts 表索引
db.collection('alerts').createIndex({ parentId: 1, createTime: -1 });
db.collection('alerts').createIndex({ parentId: 1, isRead: 1 });
db.collection('alerts').createIndex({ childId: 1, createTime: -1 });

// geofences 表索引
db.collection('geofences').createIndex({ childId: 1, enabled: 1 });
```

---

## 六、App 页面结构

### 6.1 统一 App 结构

```
亲子守护 App
│
├── 启动流程
│   ├── SplashActivity (启动页)
│   ├── PermissionActivity (权限申请)
│   ├── LoginActivity (登录/注册)
│   └── RoleSelectActivity (角色选择 - 首次)
│
├── 主界面 (MainActivity)
│   ├── BottomNavigation
│   │   ├── 首页 (监控/概览)
│   │   ├── 位置 (地图)
│   │   ├── 控制 (远程控制)
│   │   └── 我的 (设置)
│   │
│   └── Fragment 页面
│
├── 家长模式页面
│   ├── HomeFragment (监控首页)
│   ├── LocationFragment (位置守护)
│   ├── ControlFragment (远程控制)
│   ├── AlertFragment (告警消息)
│   └── SettingsFragment (我的)
│
└── 孩子模式页面
    ├── HomeFragment (首页)
    ├── StatusFragment (状态)
    └── SettingsFragment (我的)
        ├── 个人信息
        ├── 绑定管理
        ├── 同步设置
        │   ├── 位置上报频率
        │   └── 指令轮询频率
        └── 关于我们
```

### 6.2 家长模式页面

#### 首页 (HomeFragment)
```
┌─────────────────────────────────────┐
│  👤 小明                    🔔 3   │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐           │
│  │ 📱 2h   │ │ 📍 学校  │           │
│  │ 今日时长 │ │ 在线    │           │
│  └─────────┘ └─────────┘           │
│  ┌─────────┐ ┌─────────┐           │
│  │ 🔓 12次 │ │ ⚡ 王者  │           │
│  │ 解锁次数 │ │ 正在用   │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  📊 今日应用使用                     │
│  🕹️ 王者荣耀    ████████ 1h30m    │
│  🎵 抖音        ██████   1h15m    │
│  📚 微信        ████     45m      │
│                                     │
└─────────────────────────────────────┘
```

#### 位置页面 (LocationFragment)
```
┌─────────────────────────────────────┐
│  📍 位置守护              🔄 刷新  │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │         🗺️ 地图            │   │
│  │      ┌───┐                 │   │
│  │      │ 📍│ ← 小明          │   │
│  │      └───┘                 │   │
│  │    ⭕ 家 (安全)             │   │
│  └─────────────────────────────┘   │
│                                     │
│  📍 小明当前位置                     │
│  🏠 北京市海淀区中关村大街1号        │
│  ⏱️ 5分钟前更新                    │
│                                     │
│  [➕ 添加安全区域]                   │
└─────────────────────────────────────┘
```

#### 远程控制页面 (ControlFragment)
```
┌─────────────────────────────────────┐
│  🎛️ 远程控制                        │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │  🚫 一键锁屏                 │   │
│  │  [15分钟] [30分钟] [1小时]   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🔓 解锁设备                 │   │
│  │  [立即解锁]                   │   │
│  └─────────────────────────────┘   │
│  📱 应用限额                        │
│  🕹️ 王者荣耀    1h/天  [✏️]      │
│  🎵 抖音        30m/天 [✏️]      │
└─────────────────────────────────────┘
```

### 6.3 孩子模式页面

#### 首页 (HomeFragment)
```
┌─────────────────────────────────────┐
│  👤 小明                           │
│  已绑定家长：爸爸                   │
├─────────────────────────────────────┤
│  📊 今日使用情况                     │
│  ┌─────────────────────────────┐   │
│  │      📱 2h 30m              │   │
│  │       今日使用时长            │   │
│  └─────────────────────────────┘   │
│                                     │
│  📱 使用排行                         │
│  🕹️ 王者荣耀    1h30m              │
│  🎵 抖音        45m                │
│                                     │
│  ⚠️ 家长设置的应用限额               │
│  🎮 游戏类      剩余 30m ⚠️即将达  │
└─────────────────────────────────────┘
```

#### 同步设置页面（SettingsFragment）
```
┌─────────────────────────────────────┐
│  ⚙️ 同步设置                        │
├─────────────────────────────────────┤
│                                     │
│  📍 位置上报频率                     │
│  ┌─────────────────────────────┐   │
│  │ ○ 30秒                      │   │
│  │ ● 1分钟 (推荐)               │   │
│  │ ○ 5分钟 (省电)               │   │
│  └─────────────────────────────┘   │
│                                     │
│  🔔 指令轮询频率                     │
│  ┌─────────────────────────────┐   │
│  │ ○ 30秒                      │   │
│  │ ● 1分钟 (推荐)               │   │
│  │ ○ 5分钟 (省电)               │   │
│  └─────────────────────────────┘   │
│                                     │
│  💡 说明                            │
│  频率越高，响应越快，但耗电越多      │
│  息屏时会自动降低频率以节省电量      │
│                                     │
└─────────────────────────────────────┘
```

---

## 七、安全与隐私设计

### 7.1 数据安全
- **传输安全**：HTTPS + SSL pinning
- **存储安全**：密码 bcrypt 加密
- **Token安全**：JWT 短期有效 + 自动刷新
- **签名验证**：云函数调用签名验证

### 7.2 隐私保护
- **透明告知**：首次启动完整隐私政策
- **权限最小化**：只申请必要权限
- **数据删除**：支持账号注销，删除所有数据
- **孩子隐私**：位置数据仅家长可见

---

## 八、开发计划

### 第一阶段：MVP

#### App 基础
1. 单 APK 双角色架构
2. 用户注册登录（云函数）
3. 家长生成绑定码，孩子扫码绑定
4. 权限申请引导

#### 孩子端核心
5. 应用使用统计（UsageStatsManager）
6. 屏幕状态监测
7. **位置定时上报（云函数）**
8. 轮询指令（command.poll）
9. 接收远程锁屏/解锁
10. 自定义锁屏页面（含紧急联系）
11. **SOS 紧急求助（云函数）**

#### 家长端核心
12. 实时查看孩子位置（地图）
13. 实时查看使用数据
14. **一键锁屏/解锁（云函数）**
15. 接收 SOS 告警推送
16. 孩子管理

#### 云开发后端
17. 认证云函数
18. 用户云函数
19. 绑定云函数
20. 设备云函数
21. 使用统计云函数
22. 位置云函数
23. 指令云函数
24. 告警云函数

**预计工作量**：6-8 周

---

### 第二阶段：增强功能

1. 应用限额（单个应用/分类）
2. 定时计划
3. 电子围栏
4. 使用日报/周报
5. 历史轨迹回放

**预计工作量**：4-6 周

---

## 九、支付宝云·云开发费用估算

### 9.1 免费额度

| 资源 | 免费额度 | 说明 |
|------|----------|------|
| 云函数调用 | 100万次/月 | 个人用户 |
| 云数据库存储 | 1GB | 个人用户 |
| 云存储 | 5GB | 个人用户 |
| 日推送数 | 1000条 | 免费版 |
| 带宽 | 1Mbps | 免费版 |

### 9.2 超出费用

| 资源 | 单价 | 预估1000用户/月 |
|------|------|----------------|
| 云函数调用 | 0.00013元/次 | ¥130 |
| 云数据库存储 | 0.07元/GB/天 | ¥21 |
| 云存储 | 0.12元/GB | ¥5 |
| 日推送数 | 免费 | ¥0 |
| **合计** | | **¥156/月** |

### 9.3 对比传统部署

| 模式 | 月费用 | 说明 |
|------|--------|------|
| 传统 ECS 部署 | ¥315 | 固定费用 |
| 云开发模式 | ¥156 | 按量计费 |

---

## 十、技术难点与解决方案

### 10.1 实时性保证
**问题**：云函数是请求-响应模式，无法主动推送
**解决方案**：
- 孩子端**默认每 60 秒轮询** `command.poll` 云函数
- 可在设置中调整频率（30秒/1分钟/5分钟）
- 云推送作为辅助（通知栏提示有新指令）
- 指令存入数据库，轮询获取

### 10.2 位置准确性
**问题**：GPS不准、耗电、国产ROM后台限制
**解决方案**：
- GPS + 网络定位融合（FusedLocationProviderClient）
- 电量模式：息屏降频，充电时高精度
- 定位结果校验

### 10.3 后台保活
**问题**：Android 系统后台限制严格
**解决方案**：
- 前台服务 + 通知栏常驻
- WorkManager 定时任务
- 引导用户加入电池优化白名单
- 国产ROM适配

### 10.4 防卸载
**问题**：孩子可能卸载 App
**解决方案**：
- 设备管理员权限
- 卸载需要家长端授权
- 卸载告警

---

## 十一、合规与伦理

### 11.1 法律合规
- 遵守《个人信息保护法》
- 遵守《未成年人保护法》
- 儿童信息单独保护
- 隐私政策透明公示
- 用户协议明确告知

### 11.2 伦理建议
- 建议家长与孩子坦诚沟通
- 保护孩子隐私和自尊心
- 正向引导而非惩罚为主
- 尊重孩子成长规律

---

*文档版本：v3.2*
*最后更新：2026-06-24*
*更新说明：*
*1. 服务端全面改为支付宝云·云开发架构*
*2. App端改为 uniapp + 原生插件方案*
*3. 添加 uniapp 适用性分析*
*4. 明确需要原生插件的关键功能*
*5. 轮询频率改为默认60秒，支持设置调整*
