'use client';

/* Full-screen interactive map page */

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { PageLoader } from '@/components/LoadingSpinner';
import { useParties, useResults, useSeatCounts } from '@/hooks';
import { formatNumber, formatPercentage } from '@/lib/utils';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="h-[calc(100vh-56px)] skeleton" />,
});

export default function MapPage() {
  const router = useRouter();
  const { parties, loading: pLoading } = useParties();
  const { results, loading: rLoading } = useResults();
  const { seatCounts } = useSeatCounts();
  const loading = pLoading || rLoading;

  const handleClick = (id: string) => {
    router.push(`/constituency/${id}`);
  };

  return (
    <>
      <Header />
      {loading ? (
        <PageLoader />
      ) : (
        <div className="relative">
          {/* Full-height map */}
          <div className="h-[calc(100vh-56px)]">
            <MapView results={results} parties={parties} onConstituencyClick={handleClick} />
          </div>

          {/* Floating legend */}
          <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-[1000] max-w-[180px] sm:max-w-xs rounded-xl border border-gray-200 dark:border-slate-700 glass p-3 sm:p-4 shadow-soft-lg backdrop-blur-md">
            <h3 className="mb-2 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100">Party Seats</h3>
            <div className="space-y-1.5 sm:space-y-2">
              {seatCounts.slice(0, 5).map(sc => (
                <div key={sc.partyId} className="flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: sc.partyColor }} />
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{sc.partyName}</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-gray-100 flex-shrink-0">{sc.seats}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">Click a constituency</p>
          </div>
        </div>
      )}
    </>
  );
}
