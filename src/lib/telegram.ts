export async function sendTelegramNotification(botToken: string, chatId: string, message: string) {
  if (!botToken || !chatId) {
    console.warn("Telegram Bot Token or Chat ID missing. Notification not sent.");
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API Error: ${errorData.description}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    throw error;
  }
}
