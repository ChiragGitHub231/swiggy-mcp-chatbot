import { Suspense } from "react";
import { CallbackClientHandler } from "./CallbackClientHandler";

interface CallbackPageProps {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
}

async function CallbackContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const params = await searchParams;
  return <CallbackClientHandler error={params.error} status={params.status} />;
}

function CallbackFallback() {
  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg animate-pulse">
      <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/40 rounded-full mx-auto mb-4" />
      <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4 mx-auto mb-2" />
      <div className="h-4 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2 mx-auto" />
    </div>
  );
}

export default function AuthCallbackPage({ searchParams }: CallbackPageProps) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <Suspense fallback={<CallbackFallback />}>
        <CallbackContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
