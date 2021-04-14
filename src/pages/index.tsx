import { useRouter } from 'next/dist/client/router';
import React, { useEffect } from 'react';
import SEO from '../components/seo';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.push('/simulator');
  }, []);
  return (
    <div>
      <SEO
        title="FI Portfolio Doctor Simulator"
        description="An app for projecting portfolio performance for financial independence and retirement"
      />
    </div>
  );
}
