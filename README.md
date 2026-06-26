# 亲子守护 App

一款帮助家长守护孩子健康成长的手机监控应用，支持实时位置追踪、应用使用统计、远程锁屏控制等功能。

## 🌟 项目介绍

基于 **uni-app + uniCloud（支付宝云）** 开发的亲子守护项目，**一套代码，多端运行**：

| 端 | 运行方式 | 适用人群 |
|---|---|---|
| 孩子端 | 编译为 Android App，安装到孩子手机 | 孩子 |
| 家长端 | 编译为微信小程序，家长在微信里用 | 家长 |
| 家长端（可选） | 编译为 H5，浏览器直接打开 | 家长 |
| 服务端 | uniCloud 云函数（在 uni-app 项目里） | - |

> 💡 **重点说明**：云函数直接放在 `uniCloud/cloudfunctions/` 目录下，跟着前端项目走，不需要单独的服务端项目！通过 `uniCloud.callFunction()` 调用。

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
├── parenting-guardian-app/          # 🌟 主工程（uni-app + uniCloud）
│   ├── pages/                        # 页面（孩子端 + 家长端共用，按角色区分）
│   │   ├── login/                    # 登录注册
│   │   ├── home/                     # 首页
│   │   ├── location/                 # 位置
│   │   ├── control/                  # 控制
│   │   ├── alert/                    # 告警/SOS
│   │   └── settings/                 # 设置
│   ├── nativeplugins/                # Android 原生插件
│   │   ├── UsageStats/               # 应用使用统计
│   │   ├── DevicePolicy/             # 设备管理员/锁屏
│   │   └── ForegroundService/        # 前台服务保活
│   ├── uniCloud/                     # ☁️ 云函数（跟着前端项目走）
│   │   ├── cloudfunctions/
│   │   │   └── cloudfunctions/       # 统一入口云函数
│   │   │       ├── index.js          # 入口（路由到各模块）
│   │   │       ├── auth/             # 认证模块
│   │   │       ├── user/             # 用户模块
│   │   │       ├── binding/          # 绑定模块
│   │   │       ├── device/           # 设备模块
│   │   │       ├── usage/            # 使用统计
│   │   │       ├── location/         # 位置模块
│   │   │       ├── command/          # 指令模块
│   │   │       ├── alert/            # 告警模块
│   │   │       ├── geofence/         # 围栏模块
│   │   │       └── package.json
│   │   └── space-info.json           # 云服务空间配置
│   ├── api/                          # 接口封装（uniCloud.callFunction）
│   ├── store/                        # 状态管理
│   ├── manifest.json                 # 应用配置
│   └── pages.json                    # 页面路由
├── parenting-guardian-miniprogram/   # （可选）原生微信小程序版
│   └── ...                           # 如需原生小程序开发可用这个
├── parenting-guardian-cloud/         # （旧）独立云函数目录
│   └── ...                           # 已迁移到 parenting-guardian-app/uniCloud/
└── parenting-guardian-h5/            # H5 演示版（Vue3 + Vite）
    └── ...                           # 快速预览效果用
```

## 🚀 快速开始（小白推荐）

### 前置准备

1. 下载安装 **HBuilderX**（uni-app 官方 IDE）：https://www.dcloud.io/hbuilderx.html
2. 注册 **支付宝云** 账号（免费额度够用）：https://cloud.alipay.com/
3. （可选）注册 **微信小程序** 账号：https://mp.weixin.qq.com/

### 第一步：导入项目

1. 打开 HBuilderX
2. 「文件 → 打开目录」，选择 `parenting-guardian-app` 文件夹
3. 等待项目加载完成

### 第二步：配置云服务空间

1. 登录支付宝云控制台，创建服务空间，名字随便起
2. 创建完成后，复制 **SpaceID**
3. 在 HBuilderX 中，右键 `uniCloud` 目录 → 「关联云服务空间」
4. 选择你创建的空间，完成关联

> 或者直接修改 `manifest.json` 里的 `uniCloud.spaceId` 为你的 SpaceID。

### 第三步：上传云函数

1. 在 HBuilderX 中，右键 `uniCloud/cloudfunctions/cloudfunctions` 目录
2. 点击「上传部署 → 上传并运行」
3. 等待上传完成（第一次可能需要安装依赖，稍等几分钟）

> ⚠️ 注意：云函数名是 `cloudfunctions`，前端调用时也用这个名字。

### 第四步：创建数据库集合

在支付宝云控制台 → 数据库 → 新建集合，创建以下 9 个集合：

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

> 💡 集合的字段可以先不建，云函数运行时会自动写入。

### 第五步：运行项目

#### 📱 方式 A：运行到 Android 手机（孩子端）

1. 用 USB 连接手机，开启「USB 调试」（设置 → 开发者选项 → USB 调试）
2. 在 HBuilderX 中，点击「运行 → 运行到手机或模拟器 → 运行到 Android App 基座」
3. 手机上确认安装，打开 App 即可

> ⚠️ **重要提示**：默认基座是 HBuilderX 提供的标准基座，**不包含本项目的原生插件**（锁屏、使用统计、前台服务等）。要使用原生插件功能，必须打「自定义基座」。
>
> 👉 详细教程见下方 [📦 Android 自定义基座详细教程](#-android-自定义基座详细教程)

#### 💬 方式 B：运行到微信小程序（家长端）

1. 打开微信开发者工具
2. 在 HBuilderX 中，点击「运行 → 运行到小程序模拟器 → 微信开发者工具」
3. 首次运行需要配置微信开发者工具路径和小程序 AppID
4. 微信开发者工具会自动打开并加载项目

> 没有 AppID 可以选「测试号」。

#### 🌐 方式 C：运行到 H5（浏览器预览）

1. 在 HBuilderX 中，点击「运行 → 运行到浏览器 → Chrome」
2. 浏览器会自动打开

> H5 模式下原生插件功能不可用，仅用于界面预览。

#### ⚡ 方式 D：H5 演示版（最快，5 分钟）

如果不想装 HBuilderX，可以直接跑演示版：

```bash
cd parenting-guardian-h5
npm install
npm run dev
```

然后浏览器打开 `http://localhost:5173`

---

## ☁️ 云函数调用方式

前端通过 `uniCloud.callFunction()` 调用云函数，所有接口都走同一个云函数入口 `cloudfunctions`，用 `action` 参数区分：

```javascript
// 调用示例
uniCloud.callFunction({
  name: 'cloudfunctions',  // 云函数名
  data: {
    action: 'auth.login',  // 具体动作
    data: {                // 业务参数
      phone: '138xxxx8888',
      password: '123456'
    }
  },
  success: (res) => {
    console.log(res.result)  // 返回结果
  }
})
```

### 所有 action 列表

**认证模块：**
- `auth.login` - 手机号密码登录
- `auth.register` - 用户注册
- `auth.sendCode` - 发送验证码
- `auth.wechatLogin` - 微信小程序登录
- `auth.logout` - 退出登录

**用户模块：**
- `user.getProfile` - 获取用户资料
- `user.updateProfile` - 更新用户资料
- `user.setEmergencyPhone` - 设置紧急联系电话

**绑定模块：**
- `binding.generateCode` - 生成绑定码（家长）
- `binding.apply` - 申请绑定（孩子）
- `binding.confirm` - 确认绑定（家长）
- `binding.getChildren` - 获取孩子列表
- `binding.getParent` - 获取家长信息
- `binding.unbind` - 解除绑定

**设备模块：**
- `device.register` - 注册设备
- `device.heartbeat` - 心跳上报
- `device.status` - 设备状态
- `device.controlStatus` - 控制状态

**使用统计：**
- `usage.report` - 上报使用数据
- `usage.daily` - 日统计
- `usage.ranking` - 应用排行
- `usage.timeline` - 使用时间轴
- `usage.summary` - 使用汇总
- `usage.stats` - 综合统计

**位置模块：**
- `location.report` - 上报位置
- `location.current` - 当前位置
- `location.history` - 历史位置
- `location.trajectory` - 移动轨迹

**指令模块：**
- `command.lock` - 发送锁屏指令
- `command.unlock` - 发送解锁指令
- `command.poll` - 轮询指令（孩子端）
- `command.execute` - 确认执行
- `command.history` - 指令历史
- `command.setLimit` - 设置使用限制

**告警模块：**
- `alert.sos` - SOS 求助
- `alert.list` - 告警列表
- `alert.read` - 标记已读
- `alert.settings` - 告警设置
- `alert.updateSettings` - 更新设置
- `alert.sendEmergency` - 发送紧急求助

**围栏模块：**
- `geofence.create` - 创建围栏
- `geofence.list` - 围栏列表
- `geofence.update` - 更新围栏
- `geofence.delete` - 删除围栏

---

## 📱 绑定设备流程

1. **家长端**：登录 → 设置 → 管理孩子设备 → 生成绑定码
2. **孩子端**：登录 → 输入绑定码 → 申请绑定
3. **家长端**：收到申请 → 确认绑定
4. 完成！可以开始监控了

---

## 📦 Android 自定义基座详细教程

### 什么是自定义基座？

「基座」就是运行你代码的 App 壳子。HBuilderX 默认提供一个**标准基座**，但它是通用的，**不包含你项目里的原生插件**。

**自定义基座** = 把你项目里的原生插件一起打包进基座，这样才能调用原生能力（锁屏、使用统计等）。

> 📌 一句话总结：**不用原生插件 → 用标准基座；用原生插件 → 必须打自定义基座**

---

### 什么时候需要打自定义基座？

| 场景 | 需要自定义基座吗？ |
|---|---|
| 只看界面布局、页面跳转 | ❌ 不需要 |
| 调用云函数、网络请求 | ❌ 不需要 |
| 使用原生插件（锁屏、使用统计、前台服务） | ✅ 必须打 |
| 上架应用商店 | ✅ 必须打（正式打包） |

---

### 前置准备

1. **HBuilderX 账号**：注册并登录 HBuilderX（右上角登录按钮）
2. **AppID**：在 DCloud 开发者中心创建应用，获取 AppID
   - 地址：https://dev.dcloud.net.cn/
   - 没有的话先注册账号，创建一个「移动 App」
3. **安卓证书**（可选，开发阶段可以用公共测试证书）

---

### 第一步：配置 AppID

1. 打开 HBuilderX，打开 `parenting-guardian-app` 项目
2. 双击 `manifest.json` 打开配置页面
3. 找到「基础配置」→ 「AppID」
4. 填入你的 AppID（在 DCloud 开发者中心获取）
5. 「应用名称」填 `亲子守护`
6. 「应用版本号」填 `1.0.0`
7. 「应用版本名称」填 `1.0.0`
8. 按 `Ctrl + S` 保存

> 💡 没有 AppID？点击「获取」按钮，按照提示去 DCloud 官网申请。

---

### 第二步：确认原生插件配置

1. 在 `manifest.json` 配置页，切换到「App 原生插件配置」
2. 检查「本地插件」列表，应该能看到：
   - ✅ `UsageStats` - 应用使用统计
   - ✅ `DevicePolicy` - 设备管理员/锁屏
   - ✅ `ForegroundService` - 前台服务保活
3. 如果没看到，点击「选择本地插件」添加

> 📁 插件文件在 `parenting-guardian-app/nativeplugins/` 目录下

---

### 第三步：制作自定义调试基座

#### 方法一：使用云打包（推荐，小白首选）

1. 点击菜单：「运行 → 运行到手机或模拟器 → 制作自定义调试基座」
2. 弹出打包窗口：
   - **打包方式**：勾选「使用云端证书」（开发阶段用公共证书就行）
   - **打传统包**：勾选（推荐）
   - **选择基座类型**：标准基座（支持所有模块）
3. 点击「打包」按钮
4. 等待云端打包（一般 3-10 分钟，看排队情况）
5. 打包成功后，HBuilderX 会自动下载并安装到手机

> 💡 **云打包是免费的**，每天有次数限制，开发阶段够用。

#### 方法二：使用本地打包（需要 Android Studio，不推荐小白）

如果你会 Android 开发，可以用本地打包：
1. 点击「发行 → 原生 App-本地打包 → 生成本地打包 App 资源」
2. 用 Android Studio 打开 `unpackage/resources/` 下的工程
3. 自己编译打包

> 小白建议直接用云打包，省心。

---

### 第四步：运行自定义基座

1. 手机通过 USB 连接电脑
2. 点击菜单：「运行 → 运行到手机或模拟器 → 运行到 Android App 基座」
3. HBuilderX 会自动检测到你有自定义基座，询问是否使用
4. 选择「使用自定义基座」
5. 等待安装到手机

> 或者：右键项目 →「运行 → 运行到手机或模拟器 → 运行基座选择 → 自定义调试基座」，先选好，再运行。

---

### 第五步：验证原生插件是否生效

运行 App 后，可以通过以下方式验证：

1. 打开 App 的「设置」页面
2. 找到「权限设置」
3. 点击「开启使用统计权限」
4. 如果能正常跳转到系统设置页面，说明 UsageStats 插件生效了
5. 如果提示「当前基座不包含该插件」，说明基座没打好，重新检查步骤

> 🐛 常见错误：`[plugin] is not defined in current version` 或「基座不包含该插件」
> → 原因：使用了标准基座，或者自定义基座没包含这个插件
> → 解决：重新打自定义基座，确认插件已勾选

---

### 常见问题（自定义基座相关）

**Q: 云打包失败怎么办？**
A: 查看打包日志，常见原因：
- AppID 没填或填错
- 网络问题（重试）
- 插件配置错误（检查 nativeplugins 目录结构）

**Q: 自定义基座和标准基座有什么区别？**
A:
| 对比项 | 标准基座 | 自定义基座 |
|---|---|---|
| 包含原生插件 | ❌ 不包含 | ✅ 包含你项目里的插件 |
| 打包时间 | 不用打，直接用 | 需要打一次（几分钟） |
| 适用场景 | 纯前端功能调试 | 需要调用原生能力 |

**Q: 每次改代码都要重新打基座吗？**
A: **不需要**！只有修改了 `nativeplugins/` 里的原生插件代码或配置，才需要重新打基座。
只改 Vue 页面、JS 代码的话，直接运行就会热更新，基座不用变。

**Q: 自定义基座可以用在正式上线吗？**
A: 不行。自定义基座只是**调试用**的。正式上线要打「正式包」：
菜单「发行 → 原生 App-云打包 → Android平台」，然后走正式打包流程。

**Q: 提示「证书校验失败」？**
A: 自定义调试基座用的是公共测试证书，不需要管。正式打包时再用自己的证书。

---

### 正式打包（上架用）

当功能开发完，要上架应用商店时：

1. 准备好安卓签名证书（.keystore 文件）
2. 点击「发行 → 原生 App-云打包 → Android平台」
3. 填写包名（如 `com.parenting.guardian`）
4. 选择「使用自有证书」，上传你的证书
5. 填写证书密码、别名等
6. 点击「打包」
7. 等待打包完成，下载 apk 文件
8. 上传到应用商店

> 📌 正式打包和自定义基座的区别：
> - 自定义基座 = 调试用，包含日志，用公共证书
> - 正式包 = 上商用，去掉日志，用自己的证书

---

## 🔧 常见问题

### Q: 云函数上传失败怎么办？
A: 检查网络是否通畅，确认 SpaceID 配置正确。右键云函数目录 → 「查看云函数日志」可以看错误信息。

### Q: 微信小程序提示「request 合法域名校验失败」？
A: 开发阶段：微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」。
上线前：在微信公众平台配置 request 合法域名为你的支付宝云地址。

### Q: 孩子端 App 锁屏功能不生效？
A: 首先确认是否打了**自定义基座**（标准基座不包含原生插件）。
其次需要授予「设备管理员」权限，首次使用锁屏功能时会引导开启。
👉 详细教程：[📦 Android 自定义基座详细教程](#-android-自定义基座详细教程)

### Q: 怎么打自定义基座？
A: 参考：[📦 Android 自定义基座详细教程](#-android-自定义基座详细教程)

### Q: 支付宝云收费吗？
A: 有免费额度，个人学习使用基本不花钱。具体价格参考支付宝云官网。

---

## 📚 技术栈

| 模块 | 技术 |
|---|---|
| 前端 | uni-app (Vue2/Vue3) |
| 孩子端原生插件 | Android (Kotlin) |
| 服务端 | uniCloud 云函数 (Node.js) |
| 数据库 | 支付宝云数据库 (MongoDB 风格) |
| 状态管理 | Vuex / Pinia |

---

## 📄 相关文档

- [uni-app 官方文档](https://uniapp.dcloud.net.cn/)
- [uniCloud 官方文档](https://uniapp.dcloud.net.cn/uniCloud/)
- [支付宝云文档](https://opendocs.alipay.com/mini/cloud)

---

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License
