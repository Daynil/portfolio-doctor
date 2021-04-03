import { useRouter } from 'next/dist/client/router';
import Link from 'next/link';
import React from 'react';
import LogoIcon from './svg/logo-icon';

type Props = {
  menuOpen: boolean;
  handleMenuOpen: () => void;
};

const navClassName =
  'transition duration-200 ease-in-out md:ml-4 mt-2 md:mt-0 px-3 py-2 text-xl font-medium text-gray-900 border-b-2 border-transparent hover:border-green-500 hover:text-green-500 hover:text-green-500 focus:outline-none';
const mobileNavClassName =
  'transition duration-200 ease-in-out md:ml-4 mt-2 md:mt-0 px-3 py-2 text-xl font-medium text-gray-100 border-b-2 border-transparent hover:text-green-500 hover:border-green-500 focus:outline-none';
const activeClassName = ' border-b-2 border-green-500';

type HeaderLinkProps = {
  href: string;
  isActive: boolean;
  isMobile: boolean;
  children: React.ReactNode;
};

function HeaderLink({ href, isActive, isMobile, children }: HeaderLinkProps) {
  let linkClass = isMobile ? mobileNavClassName : navClassName;
  if (isActive) linkClass += activeClassName;
  return (
    <Link href={href}>
      <a className={linkClass}>{children}</a>
    </Link>
  );
}

export default function Header({ menuOpen, handleMenuOpen }: Props) {
  const router = useRouter();

  return (
    <header className="relative max-w-6xl mx-auto px-6 lg:px-8 text-xl mt-3">
      <div className="flex items-center justify-between md:h-16">
        <div className="w-full justify-between flex flex-col md:flex-row md:items-center">
          <div className="flex justify-between">
            <Link href="/simulator">
              <a className="px-3 py-2 rounded-md text-3xl font-medium text-gray-900">
                <span className="flex flex-row items-center">
                  <LogoIcon className="text-green-500" />
                  <span className="ml-2 hidden sm:inline-block">
                    {' '}
                    FI Portfolio Doctor
                  </span>
                </span>
              </a>
            </Link>
            {/* Mobile Nav Button */}
            <div className="absolute right-0 top-0 mt-2 mr-5 flex md:hidden">
              <button
                onClick={handleMenuOpen}
                className="transition duration-200 ease-in-out inline-flex items-center justify-center p-2 rounded-md text-gray-900 hover:text-green-500 focus:outline-none focus:text-white"
              >
                <svg
                  className="h-6 w-6"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    className={'inline-flex ' + (menuOpen ? 'hidden' : '')}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                  <path
                    className={'inline-flex ' + (menuOpen ? '' : 'hidden')}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          {/* Desktop Nav Bar */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline">
              <HeaderLink
                href="/simulator/"
                isMobile={false}
                isActive={router.asPath.match(/(^\/simulator)/i)?.length > 0}
              >
                Simulator
              </HeaderLink>
              {/* <HeaderLink
                href="/blog/"
                isMobile={false}
                isActive={router.asPath.match(/(^\/blog)/i)?.length > 0}
              >
                Blog
              </HeaderLink> */}
              <HeaderLink
                href="/about/"
                isMobile={false}
                isActive={router.asPath.match(/(^\/about)/i)?.length > 0}
              >
                About
              </HeaderLink>
            </div>
          </div>
          {/* Mobile Nav Menu */}
          <div
            className={
              'flex absolute z-50 inset-0 -mt-3 justify-center w-full h-screen text-center md:hidden ' +
              (menuOpen ? '' : 'hidden')
            }
            style={{
              backgroundColor: 'hsla(215, 41%, 28%, 97%)'
            }}
          >
            <button
              onClick={handleMenuOpen}
              className="transition duration-200 ease-in-out absolute right-0 top-0 mt-5 mr-5 inline-flex items-center justify-center p-2 rounded-md text-gray-100 hover:text-green-500 focus:outline-none focus:text-white"
            >
              <svg
                className="h-6 w-6"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  className={'inline-flex ' + (menuOpen ? 'hidden' : '')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  className={'inline-flex ' + (menuOpen ? '' : 'hidden')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex flex-col justify-center">
              <HeaderLink
                href="/simulator/"
                isMobile={true}
                isActive={router.asPath.match(/(^\/simulator)/i)?.length > 0}
              >
                Simulator
              </HeaderLink>
              {/* <HeaderLink
                href="/blog/"
                isMobile={true}
                isActive={router.asPath.match(/(^\/blog)/i)?.length > 0}
              >
                Blog
              </HeaderLink> */}
              <HeaderLink
                href="/about/"
                isMobile={true}
                isActive={router.asPath.match(/(^\/about)/i)?.length > 0}
              >
                About
              </HeaderLink>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
