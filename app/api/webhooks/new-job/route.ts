import { NextRequest, NextResponse } from 'next/server';

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
    submitted_on: string;
    is_active: boolean;
  };
  old_record: null;
};

export async function POST(request: NextRequest) {
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
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${job.title} at ${job.company}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📍 ${job.location}`,
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
              url: 'https://jobs.lisboaux.com/',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Job',
              },
              url: job.url,
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

    return NextResponse.json({ message: 'Notification sent' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
