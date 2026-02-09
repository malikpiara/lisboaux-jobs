import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { PostHogProvider } from './providers/PostHogProvider';
import { Motto } from '@/components/motto';
import { Toaster } from '@/components/ui/sonner';
import Link from 'next/link';
import { CardPersonOfTheMonth } from './page';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'UX Jobs',
  description:
    'Find a job in UX design and digital product design in Portugal.',
  other: {
    'theme-color': '#0237CF',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // ViewTransitions wraps <html>. This is the library's only
    // requirement — it intercepts route changes at the top level.

    <html lang='en' className='[scrollbar-gutter:stable]'>
      <PostHogProvider>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
          <footer className='gap-6 flex items-start max-w-195 w-full p-2 flex-col-reverse sm:flex-row sm:px-16 text-base sm:text-sm text-[#3d2800] dark:text-[#ffffff]/50 mx-auto'>
            <section className='flex flex-col sm:flex-row gap-5 mb-3'>
              <div>
                <Link
                  className='dark:hover:text-white transition-colors'
                  href={'https://whatsapp.com/channel/0029VbBgMmb6hENv6HkmMt2R'}
                >
                  Job Alerts on WhatsApp
                </Link>
              </div>
              <div className='hidden sm:block'>|</div>
              <div>
                <Link
                  className='dark:hover:text-white transition-colors'
                  href={'https://t.me/ux_jobs'}
                >
                  Job Alerts on Telegram
                </Link>
              </div>
              <div className='hidden sm:block'>|</div>
              <div>
                <Link
                  className='dark:hover:text-white transition-colors'
                  href={'https://lisboaux.com/slack'}
                >
                  Join our Slack Community
                </Link>
              </div>
            </section>
            {/* <section>
              <CardPersonOfTheMonth />
            </section> */}
          </footer>
          <Motto />
          <Toaster />
        </body>
      </PostHogProvider>
    </html>
  );
}
