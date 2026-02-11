'use client';

/* Landing page — Main dashboard showing election summary, seat counts,
   popular vote percentages, and a constituency list. */

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import ElectionBanner from '@/components/ElectionBanner';
import Footer from '@/components/Footer';
import { PageLoader } from '@/components/LoadingSpinner';
import { useParties, useResults, useSummary } from '@/hooks';
import { getConstituencies } from '@/lib/firestore';
import { aggregateAllianceSeatCounts } from '@/lib/alliances';
import type { Constituency, SeatCount } from '@/types';

// Dynamic imports for heavy components to reduce initial bundle size
const ResultsSummary = dynamic(() => import('@/components/ResultsSummary'), {
  loading: () => <PageLoader />,
  ssr: false
});

const ConstituencyList = dynamic(() => import('@/components/ConstituencyList'), {
  loading: () => <PageLoader />,
  ssr: false
});

export default function HomePage() {
  const { parties, loading: pLoading } = useParties();
  const { results, loading: rLoading } = useResults();
  const { summary } = useSummary(results);
  const [constituencies, setConstituencies] = useState<Constituency[]>([]);
  const [cLoading, setCLoading] = useState(true);

  useEffect(() => {
    getConstituencies()
      .then(setConstituencies)
      .catch(console.error)
      .finally(() => setCLoading(false));
  }, []);

  // Compute seat counts locally — no extra hooks / Firestore subscriptions
  const seatCounts = useMemo((): SeatCount[] => {
    const counts: Record<string, SeatCount> = {};
    parties.forEach(p => {
      counts[p.id] = { partyId: p.id, partyName: p.shortName, partyColor: p.color, seats: 0, leadingSeats: 0, totalVotes: 0, votePercentage: 0 };
    });
    let totalVotes = 0;
    results.forEach(r => {
      Object.entries(r.partyVotes).forEach(([pid, v]) => { if (counts[pid]) counts[pid].totalVotes += v; totalVotes += v; });
      if (r.status === 'completed' && r.winnerPartyId && counts[r.winnerPartyId]) counts[r.winnerPartyId].seats++;
      else if (r.status === 'partial') { const l = Object.entries(r.partyVotes).sort(([,a],[,b]) => b - a)[0]; if (l && counts[l[0]]) counts[l[0]].leadingSeats++; }
    });
    return Object.values(counts).map(sc => ({ ...sc, votePercentage: totalVotes > 0 ? (sc.totalVotes / totalVotes) * 100 : 0 }))
      .filter(sc => sc.seats > 0 || sc.leadingSeats > 0 || sc.totalVotes > 0)
      .sort((a, b) => b.seats - a.seats || b.totalVotes - a.totalVotes);
  }, [results, parties]);

  const allianceSeatCounts = useMemo(() => aggregateAllianceSeatCounts(results), [results]);

  if (pLoading || rLoading || cLoading) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8 md:py-10">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-bd-green border-r-transparent" />
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Loading election data...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <ElectionBanner />
      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8 md:py-10">
        <div className="space-y-8">
          <ResultsSummary summary={summary} seatCounts={seatCounts} allianceSeatCounts={allianceSeatCounts} />

          <section>
            <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-gray-100">Constituencies</h2>
            <ConstituencyList results={results} parties={parties} constituencies={constituencies} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
