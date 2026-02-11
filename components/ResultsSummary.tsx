'use client';

import { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import { ChartBarIcon, CheckCircleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import type { ElectionSummary, SeatCount, AllianceSeatCount } from '@/types';
import { ELECTION_CONFIG } from '@/lib/constants';
import { formatNumber, formatPercentage, getRelativeTime } from '@/lib/utils';
import ParliamentSeats from './ParliamentSeats';

interface Props {
  summary: ElectionSummary;
  seatCounts: SeatCount[];
  allianceSeatCounts: AllianceSeatCount[];
}

export default function ResultsSummary({ summary, seatCounts, allianceSeatCounts }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [expandedAlliances, setExpandedAlliances] = useState<Set<string>>(new Set());
  const { TOTAL_SEATS, MAJORITY_SEATS } = ELECTION_CONFIG;

  // Sort alliances by percentage (highest first)
  const sortedAlliances = useMemo(() => {
    return [...allianceSeatCounts].sort((a, b) => b.votePercentage - a.votePercentage);
  }, [allianceSeatCounts]);

  // Check if there's a winner (alliance or party with >= 151 seats)
  const winner = useMemo(() => {
    // Check alliances first
    const winningAlliance = sortedAlliances.find(a => a.seats >= MAJORITY_SEATS);
    if (winningAlliance) {
      return { type: 'alliance' as const, data: winningAlliance };
    }
    
    // Check individual parties
    const winningParty = seatCounts.find(p => p.seats >= MAJORITY_SEATS);
    if (winningParty) {
      return { type: 'party' as const, data: winningParty };
    }
    
    return null;
  }, [sortedAlliances, seatCounts, MAJORITY_SEATS]);

  // Helper function to get color from winner data
  const getWinnerColor = useCallback(() => {
    if (!winner) return sortedAlliances[0]?.allianceColor;
    return winner.type === 'alliance' ? winner.data.allianceColor : winner.data.partyColor;
  }, [winner, sortedAlliances]);

  // Helper function to get name from winner data
  const getWinnerName = useCallback(() => {
    if (!winner) return sortedAlliances[0]?.allianceName;
    return winner.type === 'alliance' ? winner.data.allianceName : winner.data.partyName;
  }, [winner, sortedAlliances]);

  const toggleAllianceExpanded = (allianceId: string) => {
    setExpandedAlliances(prev => {
      const next = new Set(prev);
      if (next.has(allianceId)) {
        next.delete(allianceId);
      } else {
        next.add(allianceId);
      }
      return next;
    });
  };

  // Calculate government formation status
  const governmentStatus = useMemo(() => {
    if (summary.declaredSeats === 0) {
      return {
        status: 'No Results Yet',
        color: 'from-gray-500 to-gray-600',
        bgGradient: 'from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900',
        accentColor: '#6B7280',
        description: 'Results pending',
      };
    }

    // Check if any alliance/party has majority
    if (winner) {
      return {
        status: 'Majority Achieved',
        color: 'from-green-500 to-emerald-600',
        bgGradient: 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30',
        accentColor: '#10B981',
        description: `${getWinnerName()} secured majority`,
      };
    }

    // Get top two contenders
    const top2 = sortedAlliances.slice(0, 2);
    
    if (top2.length === 0) {
      return {
        status: 'No Clear Lead',
        color: 'from-gray-500 to-gray-600',
        bgGradient: 'from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900',
        accentColor: '#6B7280',
        description: 'Results developing',
      };
    }

    const leader = top2[0];
    const runnerUp = top2[1];
    const seatGap = leader.seats - (runnerUp?.seats || 0);
    const seatsToMajority = MAJORITY_SEATS - leader.seats;

    // If leader is very close to majority (within 20 seats) and has decent lead
    if (seatsToMajority <= 20 && seatsToMajority > 0 && seatGap > 15) {
      return {
        status: 'Majority Likely',
        color: 'from-blue-500 to-indigo-600',
        bgGradient: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30',
        accentColor: '#3B82F6',
        description: `${leader.allianceName} needs ${seatsToMajority} more`,
      };
    }

    // If there's a clear leader but still far from majority
    if (seatGap > 20) {
      return {
        status: 'Clear Lead',
        color: 'from-blue-500 to-cyan-600',
        bgGradient: 'from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/30',
        accentColor: '#06B6D4',
        description: `${leader.allianceName} leading`,
      };
    }

    // If it's very close between top contenders
    if (seatGap <= 10 && leader.seats > 20) {
      return {
        status: 'Hung Parliament',
        color: 'from-amber-500 to-orange-600',
        bgGradient: 'from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30',
        accentColor: '#F59E0B',
        description: 'Too close to call',
      };
    }

    // Default: Coalition scenario
    return {
      status: 'Coalition Likely',
      color: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/30',
      accentColor: '#A855F7',
      description: 'No single majority in sight',
    };
  }, [summary.declaredSeats, winner, sortedAlliances, MAJORITY_SEATS, getWinnerName]);

  return (
    <div className="space-y-6 fade-in">
      {/* Key metrics row with gradient cards - 6 columns */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
        <MetricCard label="Total Seats" value={TOTAL_SEATS} icon={<ChartBarIcon className="h-6 w-6" />} />
        <MetricCard label="Declared" value={summary.declaredSeats} accent icon={<CheckCircleIcon className="h-6 w-6" />} />
        <MetricCard label="Suspended" value={2} suspended icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>} />
        <MetricCard
          label="Total Voters"
          value={formatNumber(summary.totalRegisteredVoters)}
          icon={<svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <MetricCard
          label="Turnout"
          value={formatPercentage(summary.nationalTurnout)}
          icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
        />
      </div>

      {/* Government Formation Status Card */}
      <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-xl border-2 bg-gradient-to-br ${governmentStatus.bgGradient} transition-all duration-500`}
        style={{ borderColor: governmentStatus.accentColor + '40' }}
      >
        {/* Animated background accent */}
        <div 
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl opacity-10 animate-pulse"
          style={{ backgroundColor: governmentStatus.accentColor }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-3 h-3 rounded-full animate-pulse shadow-lg"
                style={{ backgroundColor: governmentStatus.accentColor }}
              />
              <span className="text-xs font-black uppercase tracking-wider text-gray-600 dark:text-gray-400">
                Government Formation Status
              </span>
            </div>
            <div className="text-4xl animate-bounce">
              {governmentStatus.status === 'Majority Achieved' ? '🏆' :
               governmentStatus.status === 'Majority Likely' ? '📈' :
               governmentStatus.status === 'Hung Parliament' ? '⚖️' :
               governmentStatus.status === 'Coalition Likely' ? '🤝' :
               governmentStatus.status === 'Clear Lead' ? '🥇' :
               governmentStatus.status === 'No Clear Lead' ? '📊' : '⏳'}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h3 
                className={`text-3xl sm:text-5xl font-black mb-2 bg-gradient-to-r ${governmentStatus.color} bg-clip-text text-transparent`}
              >
                {governmentStatus.status}
              </h3>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 font-medium">
                {governmentStatus.description}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-4 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Required
                </div>
                <div className="text-3xl font-black" style={{ color: governmentStatus.accentColor }}>
                  {MAJORITY_SEATS}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Declaration or Leading Alliance Announcement */}
      {sortedAlliances.length > 0 && summary.declaredSeats > 0 && (
        <div className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg ${
          winner 
            ? 'border-4 border-yellow-400 dark:border-yellow-500 bg-gradient-to-br from-yellow-50 via-white to-yellow-50 dark:from-yellow-900/20 dark:via-slate-900 dark:to-yellow-900/20' 
            : 'border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white via-gray-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900'
        }`}>
          {/* Background accent */}
          <div 
            className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl ${winner ? 'opacity-20' : 'opacity-10'}`}
            style={{ backgroundColor: getWinnerColor() }}
          />
          
          {/* Celebration confetti effect for winner */}
          {winner && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-10 left-10 text-4xl animate-bounce">🎉</div>
              <div className="absolute top-20 right-20 text-3xl animate-bounce delay-100">✨</div>
              <div className="absolute bottom-20 left-20 text-3xl animate-bounce delay-200">🎊</div>
              <div className="absolute bottom-10 right-10 text-4xl animate-bounce delay-300">🏆</div>
            </div>
          )}
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div 
                className={`w-2 h-2 rounded-full ${winner ? 'animate-ping' : 'animate-pulse'}`}
                style={{ backgroundColor: getWinnerColor() }}
              />
              {winner ? (
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-yellow-700 dark:text-yellow-400 animate-pulse">
                  🏆 Winner Declared - Majority Achieved
                </span>
              ) : (
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Current Leading Alliance
                </span>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {winner?.type === 'alliance' && (winner.data.allianceId === 'bnp' || winner.data.allianceId === 'jamaat') && (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <Image
                      src={winner.data.allianceId === 'bnp' ? '/bnp.png' : '/jamaat.png'}
                      alt={winner.data.allianceName}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                {!winner && (sortedAlliances[0].allianceId === 'bnp' || sortedAlliances[0].allianceId === 'jamaat') && (
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <Image
                      src={sortedAlliances[0].allianceId === 'bnp' ? '/bnp.png' : '/jamaat.png'}
                      alt={sortedAlliances[0].allianceName}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <div>
                  <h3 
                    className="text-3xl sm:text-4xl font-black mb-2"
                    style={{ color: getWinnerColor() }}
                  >
                    {getWinnerName()}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium">
                    {winner ? (
                      <>
                        <span className="font-black text-green-700 dark:text-green-400">Wins with {winner.data.seats} seats</span>
                        {' '}({MAJORITY_SEATS} needed for majority) and{' '}
                        <span className="font-bold" style={{ color: getWinnerColor() }}>
                          {formatPercentage(winner.data.votePercentage)}
                        </span> of votes
                      </>
                    ) : (
                      <>
                        Leading with <span className="font-bold text-gray-900 dark:text-gray-100">{sortedAlliances[0].seats} seats</span> and{' '}
                        <span className="font-bold" style={{ color: sortedAlliances[0].allianceColor }}>
                          {formatPercentage(sortedAlliances[0].votePercentage)}
                        </span> of votes
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className={`text-3xl sm:text-4xl font-black ${winner ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {winner?.data.seats || sortedAlliances[0].seats}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Seats
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-3xl sm:text-4xl font-black"
                    style={{ color: getWinnerColor() }}
                  >
                    {formatPercentage(winner?.data.votePercentage || sortedAlliances[0].votePercentage)}
                  </div>
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Votes
                  </div>
                </div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-6">
              <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                <span>{winner ? 'Final Result' : 'Progress to Victory'}</span>
                <span>
                  {winner?.data.seats || sortedAlliances[0].seats}/{MAJORITY_SEATS} needed
                  {winner && <span className="ml-2 text-green-600 dark:text-green-400 font-black">✓ MAJORITY ACHIEVED</span>}
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                {/* Majority line indicator */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-800 dark:bg-gray-300 z-10"
                  style={{ left: `${(MAJORITY_SEATS / TOTAL_SEATS) * 100}%` }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-gray-800 dark:text-gray-300 whitespace-nowrap">
                    {MAJORITY_SEATS}
                  </div>
                </div>
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${winner ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${((winner?.data.seats || sortedAlliances[0].seats) / TOTAL_SEATS) * 100}%`,
                    backgroundColor: getWinnerColor(),
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parliament visualization */}
      <ParliamentSeats allianceSeatCounts={sortedAlliances} totalSeats={summary.declaredSeats} />

      {/* Alliance highlight cards with enhanced design */}
      <div className="grid grid-cols-1 gap-4">
        {sortedAlliances.map((alliance) => {
          const isExpanded = expandedAlliances.has(alliance.allianceId);
          const progressPercentage = (alliance.seats / TOTAL_SEATS) * 100;
          return (
            <div
              key={alliance.allianceId}
              className="group relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-900 dark:to-slate-900/50 transition-all duration-300 hover:shadow-xl"
              style={{
                borderLeftWidth: '4px',
                borderLeftColor: alliance.allianceColor,
              }}
            >
              {/* Background gradient accent */}
              <div 
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity"
                style={{ backgroundColor: alliance.allianceColor }}
              />
              
              {/* Main alliance info */}
              <div className="relative p-5 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {(alliance.allianceId === 'bnp' || alliance.allianceId === 'jamaat') && (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={alliance.allianceId === 'bnp' ? '/bnp.png' : '/jamaat.png'}
                          alt={alliance.allianceName}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="text-lg sm:text-xl font-extrabold tracking-tight" style={{ color: alliance.allianceColor }}>
                      {alliance.allianceName}
                    </span>
                  </div>
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{alliance.seats}</span>
                </div>
                
                {/* Progress bar showing seats out of 300 */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                    <span className="font-medium">{alliance.seats}/{TOTAL_SEATS} seats</span>
                    <span className="font-semibold" style={{ color: alliance.allianceColor }}>{formatPercentage(progressPercentage)}</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: alliance.allianceColor,
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{formatNumber(alliance.totalVotes)} votes</span>
                  <span className="font-semibold" style={{ color: alliance.allianceColor }}>{formatPercentage(alliance.votePercentage)} of votes</span>
                </div>
                {alliance.leadingSeats > 0 && (
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5">
                    <span className="text-amber-500 text-sm">⚡</span>
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">+{alliance.leadingSeats} Leading</span>
                  </div>
                )}
                
                {/* Expand/Collapse button for party breakdown */}
                {alliance.parties.length > 0 && (
                  <button
                    onClick={() => toggleAllianceExpanded(alliance.allianceId)}
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide' : 'Show'} Party Breakdown ({alliance.parties.length} parties)</span>
                    <svg 
                      className={`h-3 w-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Party breakdown table (expandable) */}
              {isExpanded && alliance.parties.length > 0 && (
                <div className="border-t border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/30 animate-slide-up">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-[10px] text-gray-600 dark:text-gray-300 font-semibold">
                        <tr>
                          <th className="px-4 py-2 uppercase tracking-wider">Party</th>
                          <th className="px-4 py-2 text-right uppercase tracking-wider">Won</th>
                          <th className="px-4 py-2 text-right hidden sm:table-cell uppercase tracking-wider">Leading</th>
                          <th className="px-4 py-2 text-right uppercase tracking-wider">Votes</th>
                          <th className="px-4 py-2 text-right hidden md:table-cell uppercase tracking-wider">Vote %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {alliance.parties.map(party => (
                          <tr key={party.partyId} className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="flex items-center gap-2 px-4 py-2.5">
                              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm" style={{ backgroundColor: party.partyColor }} />
                              <span className="font-medium truncate text-gray-800 dark:text-gray-200">{party.partyName}</span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-900 dark:text-gray-100">{party.seats}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600 dark:text-gray-400 font-medium hidden sm:table-cell">{party.leadingSeats}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-800 dark:text-gray-200">{formatNumber(party.totalVotes)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">{formatPercentage(party.votePercentage)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expand all parties button */}
      {seatCounts.length > 0 && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="group w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gradient-to-r from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:from-gray-50 hover:to-gray-100 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <span>{showAll ? 'Hide All Parties' : `Show All ${seatCounts.length} Parties`}</span>
          <svg 
            className={`h-4 w-4 transition-transform duration-300 ${showAll ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* All parties table (expandable) */}
      {showAll && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50 text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 font-semibold">
                <tr>
                  <th className="px-3 sm:px-4 py-3 uppercase tracking-wider">Party</th>
                  <th className="px-3 sm:px-4 py-3 text-right uppercase tracking-wider">Won</th>
                  <th className="px-3 sm:px-4 py-3 text-right hidden sm:table-cell uppercase tracking-wider">Leading</th>
                  <th className="px-3 sm:px-4 py-3 text-right uppercase tracking-wider">Votes</th>
                  <th className="px-3 sm:px-4 py-3 text-right hidden md:table-cell uppercase tracking-wider">Vote %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {seatCounts.map(sc => (
                  <tr key={sc.partyId} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-3">
                      <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0 rounded-full shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: sc.partyColor }} />
                      <span className="font-semibold truncate text-gray-900 dark:text-gray-100">{sc.partyName}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100">{sc.seats}</td>
                    <td className="px-3 sm:px-4 py-3 text-right text-gray-600 dark:text-gray-400 font-medium hidden sm:table-cell">{sc.leadingSeats}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">{formatNumber(sc.totalVotes)}</td>
                    <td className="px-3 sm:px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400 hidden md:table-cell">{formatPercentage(sc.votePercentage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
  label, value, accent, suspended, icon,
}: {
  label: string; value: string | number; accent?: boolean; suspended?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 dark:border-slate-700/50 bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-slate-900 dark:via-slate-900/50 dark:to-slate-900 p-4 sm:p-5 text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-100/20 dark:to-slate-800/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative">
        {icon && (
          <div className={`flex justify-center mb-3 transition-all ${suspended ? 'text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300' : 'text-gray-600 dark:text-gray-400 group-hover:text-bd-green dark:group-hover:text-emerald-400'} group-hover:scale-110`}>
            {icon}
          </div>
        )}
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className={`text-xl sm:text-3xl font-black mt-2 ${accent ? 'text-bd-green dark:text-emerald-400' : suspended ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{value}</p>
      </div>
    </div>
  );
}
