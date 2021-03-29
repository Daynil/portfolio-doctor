import { useRouter } from 'next/dist/client/router';
import React, { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/simulator');
  }, []);
  return <div></div>;
}
