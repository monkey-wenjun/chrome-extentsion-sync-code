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
    
    const xhr = new XMLHttpRequest();
    xhr.open('GET', message.url);
    xhr.setRequestHeader('Authorization', message.apiKey);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function() {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log('解析后的响应数据:', data);
        
        // 添加解密处理
        if (data.message) {
          console.log('开始解密消息...');
          decryptData(data.message)
            .then(decryptedMessage => {
              if (decryptedMessage) {
                console.log('解密成功:', decryptedMessage);
                sendResponse({ success: true, data: decryptedMessage });
              } else {
                console.error('解密失败');
                sendResponse({ success: false, error: '解密失败' });
              }
            })
            .catch(error => {
              console.error('解密失败:', error);
              sendResponse({ success: false, error: '解密失败' });
            });
        } else {
          console.error('无效的响应格式，缺少message字段');
          sendResponse({ success: false, error: '无效的响应格式' });
        }
      } else {
        console.error('请求失败，状态码:', xhr.status);
        const errorMessage = xhr.statusText || '未知网络错误';
        sendResponse({ success: false, error: `网络请求失败: ${errorMessage}` });
      }
    };
    xhr.onerror = function() {
      console.error('请求失败');
      const errorMessage = '未知网络错误';
      sendResponse({ success: false, error: `网络请求失败: ${errorMessage}` });
    };
    xhr.send();
    return true; // 保持消息通道开放
  }
}); 