import Link from 'next/link';
import React from 'react';

type Props = React.PropsWithRef<JSX.IntrinsicElements['a']>;

export default function TextLink({
  href,
  target,
  rel,
  children,
  ...delegated
}: Props) {
  const external = href.match(/(^http|^mailto)/i);
  const internalImage = href.match(/(^\/static\/)/i);

  // Open external links and internal images in a new tab
  // If we use Gatsby's link for an internal image, it breaks
  if (typeof target === 'undefined')
    target = external || internalImage ? '_blank' : '_self';

  // External links should have noopener for security
  // Prevents the new page from being able to access to window.opener
  if (external) rel = 'noopener';

  const link =
    external || internalImage ? (
      <a
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 rounded-md"
        href={href}
        rel={rel}
        target={target}
        {...delegated}
      >
        {children}
      </a>
    ) : (
      <Link href={href}>{children}</Link>
    );

  return (
    <span className="border-b-2 border-green-500 text-gray-900 hover:text-green-500 hover:border-transparent transition duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-500 focus-visible:rounded-md">
      {link}
    </span>
  );
}
