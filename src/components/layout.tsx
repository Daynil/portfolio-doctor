import React, { useEffect, useState } from 'react';
import Header from './header';
import TextLink from './text-link';

type Props = {
  path: string;
  children: React.ReactNode;
};

export const ThemeContext = React.createContext({
  darkMode: false
});

const Layout = ({ path, children }: Props) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const handleMenuOpen = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    if (menuOpen) document.body.style.overflowY = 'hidden';
    else {
      document.body.style.overflowY = 'unset';
      document.body.style.overflowY = 'overlay';
    }
  }, [menuOpen]);

  return (
    <div>
      <div className="min-h-screen dk:bg-gray-900 transition duration-200 ease-in-out border-t-4 border-dblue-500">
        <Header
          path={path}
          menuOpen={menuOpen}
          handleMenuOpen={handleMenuOpen}
        />
        <div className="m-auto text-gray-900 dk:text-gray-300 text-lg px-6 md:max-w-3xl transition duration-200 ease-in-out">
          <main>{children}</main>
          <footer className="text-gray-600 mt-32 pb-12">
            © {new Date().getFullYear()} Quests In Code. All Rights Reserved.
            Created by{' '}
            <TextLink href="https://dlibin.net">Danny Libin</TextLink>.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
