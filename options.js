document.getElementById('getCode').addEventListener('click', async () => {
  try {
    // 获取设置
    const settings = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
    
    if (!settings.apiUrl || !settings.apiKey) {
      throw new Error('请先配置API接口和密钥！');
    }

    // 检查URL格式
    try {
      new URL(settings.apiUrl);
    } catch (e) {
      throw new Error('API地址格式不正确');
    }

    // 发送消息给 background script
    const response = await chrome.runtime.sendMessage({
      type: 'fetchVerificationCode',
      url: settings.apiUrl,
      apiKey: settings.apiKey
    });

    // 修改响应处理逻辑
    if (!response) {
      throw new Error('未收到响应数据');
    }

    if (!response.success) {
      throw new Error(response.error || '请求失败，但未返回具体错误信息');
    }

    // 直接使用解密后的数据
    if (!response.data) {
      throw new Error('响应数据格式不正确');
    }

    // 复制到剪贴板
    await navigator.clipboard.writeText(response.data);
    alert('验证码已复制：' + response.data);

  } catch (error) {
    console.error('获取验证码失败:', error);
    const errorMessage = error.message || '未知错误';
    alert(`获取验证码失败: ${errorMessage}\n如果问题持续存在，请检查：\n1. API地址是否正确\n2. API密钥是否有效\n3. 网络连接是否正常`);
  }
});

document.getElementById('save').addEventListener('click', () => {
  const apiUrl = document.getElementById('apiUrl').value;
  const apiKey = document.getElementById('apiKey').value;
  
  if (!apiUrl || !apiKey) {
    alert('请填写完整的接口地址和密钥！');
    return;
  }

  chrome.storage.sync.set({
    apiUrl: apiUrl,
    apiKey: apiKey
  }, () => {
    alert('设置已保存！');
  });
});

// 加载保存的设置
chrome.storage.sync.get(['apiUrl', 'apiKey'], (result) => {
  if (result.apiUrl) {
    document.getElementById('apiUrl').value = result.apiUrl;
  }
  if (result.apiKey) {
    document.getElementById('apiKey').value = result.apiKey;
  }
});

// 解密函数
async function decryptMessage(encryptedMessage, key) {
  try {
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
    return new TextDecoder().decode(decrypted);

  } catch (error) {
    console.error('解密失败:', error);
    throw new Error(`解密失败: ${error.message}`);
  }
} 