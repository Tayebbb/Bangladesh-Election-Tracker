'use client';

import { useMemo, useState } from 'react';
import type { ElectionSummary, SeatCount } from '@/types';
import { ELECTION_CONFIG } from '@/lib/constants';
import { formatNumber, formatPercentage, getRelativeTime } from '@/lib/utils';
import SeatCounter from './SeatCounter';

interface Props {
  summary: ElectionSummary;
  seatCounts: SeatCount[];
}

export default function ResultsSummary({ summary, seatCounts }: Props) {
  const [showAll, setShowAll] = useState(false);
  const { TOTAL_SEATS, MAJORITY_SEATS } = ELECTION_CONFIG;

  // Top 2 parties
  const top2 = useMemo(() => seatCounts.slice(0, 2), [seatCounts]);

  return (
    <div className="space-y-6 fade-in">
      {/* Key metrics row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
        <MetricCard label="Total Seats" value={TOTAL_SEATS} />
        <MetricCard label="Declared" value={summary.declaredSeats} accent />
        <MetricCard label="Majority" value={MAJORITY_SEATS} />
        <MetricCard
          label="Avg. Turnout"
          value={formatPercentage(summary.averageTurnout)}
        />
      </div>

      {/* Seat counter bar */}
      <SeatCounter seatCounts={seatCounts} declaredSeats={summary.declaredSeats} showAll={showAll} />

      {/* Top 2 party highlight cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {top2.map(sc => (
          <div
            key={sc.partyId}
            className="result-card rounded-xl border-l-4 bg-white dark:bg-slate-900 p-4 shadow-soft hover:shadow-soft-lg"
            style={{ borderLeftColor: sc.partyColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-bold" style={{ color: sc.partyColor }}>
                {sc.partyName}
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100">{sc.seats}</span>
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatNumber(sc.totalVotes)} votes ({formatPercentage(sc.votePercentage)})</span>
              {sc.leadingSeats > 0 && <span>+{sc.leadingSeats} leading</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Expand all parties */}
      {seatCounts.length > 2 && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 shadow-sm hover:shadow-soft">
        >
          {showAll ? 'Show Top 2 Only' : `Show All ${seatCounts.length} Parties`}
        </button>
      )}

      {/* All parties table (expandable) */}
      {showAll && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-soft">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b bg-gray-50 dark:bg-slate-800 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-2 sm:px-3 py-2">Party</th>
                <th className="px-2 sm:px-3 py-2 text-right">Won</th>
                <th className="px-2 sm:px-3 py-2 text-right hidden sm:table-cell">Leading</th>
                <th className="px-2 sm:px-3 py-2 text-right">Votes</th>
                <th className="px-2 sm:px-3 py-2 text-right hidden md:table-cell">Vote %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {seatCounts.map(sc => (
                <tr key={sc.partyId} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2">
                    <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: sc.partyColor }} />
                    <span className="font-medium truncate">{sc.partyName}</span>
                  </td>
                  <td className="px-2 sm:px-3 py-2 text-right font-bold">{sc.seats}</td>
                  <td className="px-2 sm:px-3 py-2 text-right text-gray-500 hidden sm:table-cell">{sc.leadingSeats}</td>
                  <td className="px-2 sm:px-3 py-2 text-right">{formatNumber(sc.totalVotes)}</td>
                  <td className="px-2 sm:px-3 py-2 text-right hidden md:table-cell">{formatPercentage(sc.votePercentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Last updated */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        Last updated: {getRelativeTime(summary.lastUpdated)}
      </p>
    </div>
  );
}

function MetricCard({
  label, value, accent,
}: {
  label: string; value: string | number; accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 text-center shadow-soft hover:shadow-soft-lg transition-all duration-200">
      <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-base sm:text-2xl font-bold mt-1 ${accent ? 'text-bd-green dark:text-emerald-400' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
    </div>
  );
}
