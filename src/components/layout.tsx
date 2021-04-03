import { useRouter } from 'next/dist/client/router';
import React, { useEffect, useState } from 'react';
import Header from './header';
import TextLink from './text-link';

type Props = {
  children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuOpen = () => setMenuOpen(!menuOpen);

  const router = useRouter();

  useEffect(() => {
    if (menuOpen) document.body.style.overflowY = 'hidden';
    else {
      document.body.style.overflowY = 'unset';
      document.body.style.overflowY = 'overlay';
    }
  }, [menuOpen]);

  return (
    <div>
      <div className="min-h-screen transition duration-200 ease-in-out border-t-4 border-green-500">
        <Header menuOpen={menuOpen} handleMenuOpen={handleMenuOpen} />
        <div
          className={`m-auto text-gray-900 text-lg px-6 transition duration-200 ease-in-out ${
            router.asPath !== '/simulator' ? ' md:max-w-3xl' : ''
          }`}
        >
          <main>{children}</main>
          <footer className="text-gray-600 mt-12 pb-12">
            © {new Date().getFullYear()} FI Portfolio Doctor. All Rights
            Reserved. Created by{' '}
            <TextLink href="https://dlibin.net">Danny Libin</TextLink>.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
