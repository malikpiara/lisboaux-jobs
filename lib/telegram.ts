/**
 * Telegram Bot API integration for LisboaUX Jobs
 */

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  url: string;
  short_code?: string;
}

export async function sendToTelegram(
  job: Job,
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const channelId = process.env.TELEGRAM_CHANNEL_ID;

  if (!botToken || !channelId) {
    console.error('Telegram environment variables not set');
    return { success: false, error: 'Missing Telegram configuration' };
  }

  // Use short URL if available, otherwise fall back to direct URL
  const jobUrl = job.short_code
    ? `https://jobs.lisboaux.com/j/${job.short_code}`
    : job.url;

  // Build message with actual newlines (not \n strings)
  const message = `<b>${escapeHtml(job.title)}</b>
${escapeHtml(job.company)}
📍${escapeHtml(job.location)}
${jobUrl}`;

  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: channelId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return { success: false, error: data.description };
    }

    console.log(`Job posted to Telegram: ${job.title}`);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send to Telegram:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
