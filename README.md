# Augment Balance

一个用于显示Augment Code剩余套餐额度的Visual Studio Code扩展。

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 功能特性

### 🔋 智能余额显示
- **状态栏显示**：实时显示剩余套餐额度（如：🔋 104.00）
- **颜色警告**：余额不足时自动变色提醒
  - 绿色：余额充足（≥10）
  - 黄色：余额不足（<10）
  - 红色：余额耗尽（≤0）

### 📊 详细账号信息
- **完整信息面板**：鼠标悬停状态栏查看详细信息
- **邮箱账号**：显示当前登录的邮箱地址
- **套餐类型**：显示当前使用的套餐名称
- **到期时间**：显示套餐到期日期（支持无限期套餐）

### ⚙️ 智能配置管理
- **简单配置**：只需配置API token即可使用
- **自动更新**：可自定义更新间隔（1分钟-1小时）
- **热更新**：配置变更立即生效，无需重启

### 💾 高效缓存机制
- **智能缓存**：24小时缓存机制，减少API调用
- **精确清理**：Token更换时只清理相关缓存
- **自动维护**：启动时自动清理过期缓存

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

## 🚀 使用方法

### 基本使用
1. **查看余额**：配置完成后，状态栏右侧会显示当前余额
2. **查看详情**：鼠标悬停在状态栏项目上查看完整账号信息
3. **打开设置**：点击状态栏项目快速打开设置页面
4. **手动刷新**：使用命令面板中的"Augment Balance: Refresh Balance"命令

### 信息面板说明
当您将鼠标悬停在状态栏的余额显示上时，会看到详细的信息面板：

```
Augment账号基础信息
邮箱账号：your-email@example.com
套餐名称：Pro Plan
到期时间：2024-12-31（或"无期限"）
剩余套餐额度：104.00
点击打开设置
```

### 命令面板
- `Augment Balance: Open Settings` - 打开设置页面
- `Augment Balance: Refresh Balance` - 手动刷新余额

## 📱 状态说明

### 状态栏显示
- 🔋 **正常状态**: `🔋 104.00` - 显示当前余额，颜色表示余额状态
- ⚙️ **未配置**: `⚙️ Augment未配置` - 需要配置API token
- ❌ **错误状态**: `❌ Augment错误` - API调用失败或其他错误
- 🔄 **加载中**: `⏳ Augment余额加载中...` - 正在获取最新信息

### 颜色含义
- **默认色**：余额充足（≥10）
- **黄色**：余额不足，建议及时充值（<10）
- **红色**：余额耗尽，需要立即充值（≤0）

## ❓ 常见问题

### Q: 为什么显示"Augment未配置"？
A: 您需要先配置API token。请按照上面的"Token获取方法"获取token，然后在设置中配置。

### Q: 为什么显示"Augment错误"？
A: 可能的原因：
- Token已过期或无效
- 网络连接问题
- API服务暂时不可用

解决方法：检查token是否正确，或稍后重试。

### Q: 如何调整更新频率？
A: 在VS Code设置中搜索"augmentBalance.updateInterval"，可设置1-60分钟的更新间隔。

### Q: 团队账号如何获取token？
A: 团队子账号无法直接获取token，请使用团队主账号登录获取。

## 🔧 故障排除

### 扩展无响应
1. 重新加载VS Code窗口（Ctrl+Shift+P → "Developer: Reload Window"）
2. 检查VS Code输出面板中的错误信息
3. 重新安装扩展

### 余额显示不准确
1. 使用命令面板手动刷新："Augment Balance: Refresh Balance"
2. 检查网络连接
3. 验证token是否有效

### 配置无法保存
1. 确保有足够的权限修改VS Code设置
2. 检查设置格式是否正确
3. 重启VS Code

## 🔄 更新日志

### v1.1.0
- ✨ 新增详细的账号信息显示（邮箱、套餐、到期时间）
- 🎨 全新的信息面板设计
- 💾 优化缓存机制，支持精确清理
- 🔧 改进错误处理和用户提示

### v1.0.x
- 🔋 基础余额显示功能
- ⚙️ 配置管理
- 🔄 自动更新机制

## 🤝 支持与反馈

- **QQ交流群**：AI Code IDE Studio (611135619)
- **GitHub**：[augment-balance](https://github.com/gacjie/augment-balance)
- **问题反馈**：[GitHub Issues](https://github.com/gacjie/augment-balance/issues)

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
