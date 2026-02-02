'use client';

import { toast } from 'sonner';

export function showPointsToast({
  points,
  message,
}: {
  points: number;
  message: string;
}) {
  toast(
    <>
      <div className='text-[#3037CF] font-semibold text-lg'>
        {`+${points} points`}
      </div>
      <div className='text-muted-foreground'>{message}</div>
    </>,
    {
      position: 'bottom-left',
    },
  );
}
