const axios = require('axios');

async function pingYieldX() {
  const apiUrl = 'https://yieldx.onrender.com/verification';
  try {
    const startTime = Date.now();
    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'YieldX-BackendPing/1.0'
      },
      timeout: 10000 // 10 seconds
    });
    const responseTime = Date.now() - startTime;
    return {
      success: true,
      status: response.status,
      responseTime,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 0
    };
  }
}

// Example usage:
pingYieldX().then(result => console.log(result)); 