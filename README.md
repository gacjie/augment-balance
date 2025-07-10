# Augment Balance

一个用于显示Augment Code剩余套餐额度的Visual Studio Code扩展。

## 功能特性

- 🔋 在状态栏实时显示剩余套餐额度
- ⚙️ 简单的配置管理
- 🔄 自动定期更新余额信息
- 🎨 智能状态显示（正常/未配置/错误/加载中）
- 💾 智能缓存机制，减少API调用
- 🚨 余额不足时的颜色警告

## 交流讨论

QQ交流群：AI Code IDE Studio (611135619)

## Token获取方法：

1. 正常登录augment官网。
2. 控制台显示额度的地方有个View usage点进去。
3. 链接中的token值就是我们需要的API token。
4. 团队子账号无View usage，请用团队主账号获取。

## 安装和配置

1. 安装扩展后，点击状态栏中的"Augment未配置"
2. 在设置中配置以下选项：
   - `augmentBalance.token`: 您的API token（必填）
   - `augmentBalance.updateInterval`: 更新间隔时间（秒，默认600秒）
3. 保存设置后，扩展会自动获取余额信息

## 使用方法

- 配置完成后，扩展会自动在状态栏显示余额
- 点击状态栏项目可以打开设置页面
- 使用命令面板中的"刷新余额"命令可以手动刷新

## 状态说明

- 🔋 **正常状态**: 显示当前余额，绿色表示充足，黄色表示不足，红色表示耗尽
- ⚙️ **未配置**: 需要配置API token
- ❌ **错误状态**: API调用失败或其他错误
- 🔄 **加载中**: 正在获取余额信息

## 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听模式
npm run watch

# 打包
npm run package
```

## 许可证

MIT License
