import { useEffect, useState } from 'react';
import { api, getConfiguredApiUrl, isCloudFrontend } from '../api/client';

export function BackendStatusBanner() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [database, setDatabase] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const health = await api.health();
        if (!cancelled) {
          const db = health.database || '';
          const dbOk =
            health.status === 'ok' &&
            db &&
            !String(db).toLowerCase().includes('fail') &&
            !String(db).toLowerCase().includes('error') &&
            !String(db).toLowerCase().includes('unreachable');
          setOnline(dbOk);
          setDatabase(db);
        }
      } catch {
        if (!cancelled) {
          setOnline(false);
          setDatabase(null);
        }
      }
    };

    probe();
    const id = setInterval(probe, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (online === true) return null;

  const cloud = isCloudFrontend();
  const apiUrl = getConfiguredApiUrl();

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-sm px-4 py-2.5 text-center shadow-md"
    >
      {cloud ? (
        <>
          <strong>API or database not connected on Vercel.</strong> Complete both parts: (1) Deploy{' '}
          <strong>Render</strong> with <code className="bg-red-700 px-1 rounded">DATABASE_URL</code>{' '}
          from Supabase. (2) In Vercel set{' '}
          <code className="bg-red-700 px-1 rounded">RENDER_API_URL</code> to your Render URL.
          {database ? <> Database: {database}.</> : null}
          {apiUrl ? <> API: {apiUrl}.</> : null} See <strong>VERCEL_DEPLOY.txt</strong>.
        </>
      ) : (
        <>
          Backend not connected — double-click <strong>START_PROJECT.bat</strong> and keep the server
          window open (SQL Server on port 8080).
        </>
      )}
    </div>
  );
}
