import { buildJobUrl } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { sendToTelegram } from '@/lib/telegram';

// The shape of data Supabase sends for INSERT events
type SupabaseWebhookPayload = {
  type: 'INSERT';
  table: string;
  schema: string;
  record: {
    id: number;
    title: string;
    company: string;
    location: string;
    url: string;
    short_code?: string;
    submitted_on: string;
    is_active: boolean;
  };
  old_record: null;
};

export async function POST(request: NextRequest) {
  // Verify request is from Supabase
  const secret = request.headers.get('x-webhook-secret');
  if (secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const payload: SupabaseWebhookPayload = await request.json();

    const job = payload.record;

    // Send to Slack
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.error('SLACK_WEBHOOK_URL is not configured');
      return NextResponse.json(
        { error: 'Slack not configured' },
        { status: 500 },
      );
    }

    const slackMessage = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `* :cake: New job posted!* \n\n *${job.title}*  \n ${job.company} ·  ${job.location}`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'More Jobs',
              },
              url: 'https://jobs.lisboaux.com/?utm_source=LisboaUX&utm_medium=Slack',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Job',
              },
              url: buildJobUrl(job.url),
            },
          ],
        },
      ],
    };

    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    if (!slackResponse.ok) {
      console.error('Slack API error:', await slackResponse.text());
      return NextResponse.json({ error: 'Slack API error' }, { status: 500 });
    }

    // Send to Telegram
    const telegramResult = await sendToTelegram(job);
    if (!telegramResult.success) {
      console.error('Telegram error:', telegramResult.error);
      // Don't fail the whole request if Telegram fails - Slack already worked
    }

    return NextResponse.json({ message: 'Notification sent' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
