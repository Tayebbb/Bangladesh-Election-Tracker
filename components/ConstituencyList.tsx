'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Result, Party, Constituency } from '@/types';
import { RESULT_STATUS } from '@/lib/constants';
import { formatNumber } from '@/lib/utils';

interface Props {
  results: Result[];
  parties: Party[];
  constituencies: Constituency[];
}

export default function ConstituencyList({ results, parties, constituencies }: Props) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'completed'>('all');
  const [search, setSearch] = useState('');

  // Build lookup maps
  const partyMap = useMemo(() => {
    const m: Record<string, Party> = {};
    parties.forEach(p => { m[p.id] = p; });
    return m;
  }, [parties]);

  const resultMap = useMemo(() => {
    const m: Record<string, Result> = {};
    results.forEach(r => { m[r.constituencyId] = r; });
    return m;
  }, [results]);

  // Filter and sort
  const filtered = useMemo(() => {
    let list = constituencies.map(c => ({
      constituency: c,
      result: resultMap[c.id] || null,
    }));

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter(item => {
        if (statusFilter === 'pending') return !item.result;
        return item.result?.status === statusFilter;
      });
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(item => item.constituency.name.toLowerCase().includes(q));
    }

    // Sort: completed first, then partial, then pending
    list.sort((a, b) => {
      const order = { completed: 0, partial: 1, pending: 2 };
      const aOrder = a.result ? order[a.result.status] : 2;
      const bOrder = b.result ? order[b.result.status] : 2;
      return aOrder - bOrder;
    });

    return list;
  }, [constituencies, resultMap, statusFilter, search]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['all', 'completed', 'partial', 'pending'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm ${
                statusFilter === s
                  ? 'bg-bd-green dark:bg-emerald-600 text-white shadow-soft'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {s === 'all' ? 'All' : RESULT_STATUS[s].label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-bd-green/20 focus:border-bd-green dark:focus:border-emerald-500 transition-all shadow-sm"
        />
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.slice(0, 50).map(({ constituency, result }) => {
          const winner = result?.winnerPartyId ? partyMap[result.winnerPartyId] : null;
          const status = result?.status || 'pending';
          const { label: statusLabel, color: statusColor } = RESULT_STATUS[status as keyof typeof RESULT_STATUS] || RESULT_STATUS.pending;

          return (
            <Link
              key={constituency.id}
              href={`/constituency/${constituency.id}`}
              className="result-card flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 sm:p-4 shadow-soft hover:shadow-soft-lg transition-all duration-200">
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Winner color dot */}
                <span
                  className="h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: winner?.color || '#E5E7EB' }}
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{constituency.name}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                    {winner ? winner.shortName : 'Awaiting result'}
                    {result ? <span className="hidden sm:inline"> · {formatNumber(result.totalVotes)} votes</span> : ''}
                  </p>
                </div>
              </div>
              <span className={`rounded-lg px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-semibold ${statusColor} whitespace-nowrap shadow-sm`}>
                {statusLabel}
              </span>
            </Link>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">No constituencies match filters</p>
        )}
        {filtered.length > 50 && (
          <p className="py-3 text-center text-xs text-gray-400 dark:text-gray-500">
            Showing 50 of {filtered.length} constituencies
          </p>
        )}
      </div>
    </div>
  );
}
