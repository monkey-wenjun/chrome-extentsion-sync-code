// AES解密函数
async function decryptMessage(encryptedMessage, key) {
  try {
    console.log('开始解密，加密消息:', encryptedMessage);
    console.log('使用的密钥:', key);

    // Base64 解码密文
    const encryptedData = atob(encryptedMessage);
    const encryptedBytes = new Uint8Array(encryptedData.length);
    for (let i = 0; i < encryptedData.length; i++) {
      encryptedBytes[i] = encryptedData.charCodeAt(i);
    }

    // 提取 IV（前12字节）和密文
    const iv = encryptedBytes.slice(0, 12);
    const ciphertext = encryptedBytes.slice(12);

    // Base64 解码密钥
    const keyBytes = atob(key);
    const keyBuffer = new Uint8Array(keyBytes.length);
    for (let i = 0; i < keyBytes.length; i++) {
      keyBuffer[i] = keyBytes.charCodeAt(i);
    }

    // 导入密钥
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 解密
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      ciphertext
    );

    // 转换为文本
    const result = new TextDecoder().decode(decrypted);
    console.log('解密结果:', result);
    return result;

  } catch (error) {
    console.error('解密失败:', error);
    throw new Error(`解密失败: ${error.message}`);
  }
}

// 复制到剪贴板
async function copyToClipboard(text) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('没有可复制的内容');
    }
    
    await navigator.clipboard.writeText(text);
    console.log('复制的内容:', text);
    alert(`已复制内容: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}`);
  } catch (err) {
    console.error('复制失败:', err);
    throw new Error(`复制失败: ${err.message}`);
  }
}

// 获取验证码的函数
async function getVerificationCode() {
  try {
    // 从存储中获取设置
    const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
    
    console.log('使用的API地址:', settings.apiUrl);
    console.log('使用的密钥长度:', settings.apiKey?.length);

    if (!settings.apiUrl || !settings.apiKey) {
      alert('请先在扩展设置中配置API接口和密钥！');
      return;
    }

    // 通过后台脚本发送请求
    console.log('发送请求...');
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'fetchVerificationCode',
        url: settings.apiUrl,
        apiKey: settings.apiKey
      }, response => {
        console.log('收到响应:', response);
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || '请求失败'));
        }
      });
    });

    console.log('API响应数据:', response);
    console.log('响应数据类型:', typeof response.message);

    if (!response || !response.message) {
      throw new Error('返回数据格式错误，缺少message字段');
    }

    // 使用配置的密钥解密message
    const decryptedMessage = await decryptMessage(response.message, settings.apiKey);
    
    // 复制到剪贴板
    await copyToClipboard(decryptedMessage);

  } catch (error) {
    console.error('完整错误:', error);
    alert('操作失败：' + error.message);
  }
} 