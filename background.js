// 添加 AES-GCM 解密函数
async function decryptData(encryptedData) {
  try {
    console.log('原始加密数据:', encryptedData);
    
    // 从存储中获取密钥
    const settings = await chrome.storage.sync.get(['apiKey']);
    if (!settings.apiKey) {
      throw new Error('未找到解密密钥');
    }
    
    // 解码Base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // 分离IV和加密数据
    const iv = combined.slice(0, 12); // GCM模式通常使用12字节的IV
    const ciphertext = combined.slice(12);
    
    // 解码密钥
    const decodedKey = Uint8Array.from(atob(settings.apiKey), c => c.charCodeAt(0));
    
    // 导入密钥
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      decodedKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // 解密数据
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      cryptoKey,
      ciphertext
    );
    
    // 转换为字符串
    const decoder = new TextDecoder();
    const decryptedMessage = decoder.decode(decrypted);
    console.log('解密成功:', decryptedMessage);
    return decryptedMessage;
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fetchVerificationCode') {
    console.log('开始请求验证码，URL:', message.url);
    console.log('使用的API Key:', message.apiKey);
    
    // 改用 Fetch API 代替 XMLHttpRequest
    fetch(message.url, {
      method: 'GET',
      headers: {
        'Authorization': message.apiKey,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`网络请求失败: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('解析后的响应数据:', data);
      
      if (data.message) {
        console.log('开始解密消息...');
        return decryptData(data.message)
          .then(decryptedMessage => {
            if (decryptedMessage) {
              console.log('解密成功:', decryptedMessage);
              sendResponse({ success: true, data: decryptedMessage });
            } else {
              throw new Error('解密失败');
            }
          });
      } else {
        throw new Error('无效的响应格式');
      }
    })
    .catch(error => {
      console.error('请求失败:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // 保持消息通道开放
  }
}); 