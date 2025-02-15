# Chrome 验证码同步扩展

这是一个 Chrome 扩展程序，用于从指定 API 获取验证码并自动同步到剪贴板。

## 功能特性

- 通过 API 获取加密的验证码
- 使用 AES-GCM 算法解密验证码
- 自动将验证码复制到剪贴板
- 支持自定义 API 地址和密钥
- 安全的存储和传输机制

## 安装步骤

1. 克隆本仓库到本地：
   ```bash
   git clone git@github.com:monkey-wenjun/chrome-extentsion-sync-code.git
   ```

2. 打开 Chrome 浏览器，进入 `chrome://extensions/`

3. 启用“开发者模式”

4. 点击“加载已解压的扩展程序”，选择项目目录

或者直接Chrome 扩展安装 https://chromewebstore.google.com/detail/%E9%AA%8C%E8%AF%81%E7%A0%81%E5%90%8C%E6%AD%A5/pdpfmpcnhendfnibildbbffifinmeeap

## 配置说明

1. 点击扩展图标，打开设置页面
2. 输入 API 地址和密钥
3. 点击“保存”按钮

## 使用说明

1. 点击扩展图标
2. 点击“获取验证码”按钮
3. 验证码将自动复制到剪贴板
4. 在需要的地方粘贴使用

## 客户端 

https://github.com/monkey-wenjun/auto_sync_captcha


## 服务端

https://github.com/monkey-wenjun/sync_code_server
