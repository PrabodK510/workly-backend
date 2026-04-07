const axios = require('axios');

/**
 * Sends a push notification to specific Expo push tokens
 * @param {string|string[]} tokens - ExpoPushToken[xxx] string or array
 * @param {string} title - Title of the notification
 * @param {string} body - Body content
 * @param {object} data - Optional metadata to attach to the notification
 */
const sendPushNotification = async (tokens, title, body, data = {}) => {
  const message = {
    to: tokens,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    _displayInForeground: true, // Display even when app is open
  };

  try {
    const response = await axios.post('https://exp.host/--/api/v2/push/send', message, {
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
    });
    
    // Log failures if some tokens are invalid
    if (response.data.errors) {
      console.error('Push Notification Warning:', response.data.errors);
    }
    
    return response.data;
  } catch (error) {
    console.error('Push Notification Error:', error.response?.data || error.message);
    return null;
  }
};

module.exports = { sendPushNotification };
