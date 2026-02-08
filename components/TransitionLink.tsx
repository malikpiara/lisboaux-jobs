//
// Drop-in replacement for <Link> that navigates through the
// shared transition context. Keeps prefetching (it's still a
// real <Link>), but intercepts clicks to use startTransition.
//
// Usage — same as <Link>:
//   <TransitionLink href="/">← All Jobs</TransitionLink>

'use client';

import { MouseEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useNavTransition } from '@/components/NavigationTransition';

interface TransitionLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

export function TransitionLink({
  href,
  children,
  className,
}: TransitionLinkProps) {
  const { navigate } = useNavTransition();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
