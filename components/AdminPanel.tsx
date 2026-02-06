'use client';

/* Admin Result Entry Panel
   Division → District → Constituency cascade selector
   MCQ-style vote entry per party
   Auto-calculates totals, percentages, winner, margin */

import { useState, useMemo, useCallback, type FormEvent } from 'react';
import type { Party, AdminUser, Result } from '@/types';
import { divisions, getConstituencyId, getConstituencyName, type DivisionData, type DistrictData } from '@/data/divisions';
import { saveResult, getResultByConstituency, getCandidatesByConstituency } from '@/lib/firestore';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface Props {
  parties: Party[];
  adminUser: AdminUser;
  onLogout: () => void;
}

interface VoteInput {
  partyId: string;
  votes: number;
}

export default function AdminPanel({ parties, adminUser, onLogout }: Props) {
  // Cascade selectors
  const [divisionId, setDivisionId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [constituencyNum, setConstituencyNum] = useState<number | null>(null);

  // Vote entries
  const [voteInputs, setVoteInputs] = useState<VoteInput[]>([]);
  const [status, setStatus] = useState<'partial' | 'completed'>('partial');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [existingResult, setExistingResult] = useState<Result | null>(null);

  // Active district/constituency lookup
  const activeDivision = useMemo<DivisionData | null>(
    () => divisions.find(d => d.id === divisionId) || null,
    [divisionId]
  );

  const activeDistrict = useMemo<DistrictData | null>(
    () => activeDivision?.districts.find(d => d.id === districtId) || null,
    [activeDivision, districtId]
  );

  const constituencyId = useMemo(
    () => (districtId && constituencyNum !== null ? getConstituencyId(districtId, constituencyNum) : null),
    [districtId, constituencyNum]
  );

  const constituencyName = useMemo(
    () => (districtId && constituencyNum !== null ? getConstituencyName(districtId, constituencyNum) : ''),
    [districtId, constituencyNum]
  );

  // When constituency is selected, load existing result and init vote inputs
  const loadConstituency = useCallback(async (cId: string) => {
    setMessage(null);
    try {
      const result = await getResultByConstituency(cId);
      setExistingResult(result);

      // Init vote inputs from existing or blank
      const inputs: VoteInput[] = parties.map(p => ({
        partyId: p.id,
        votes: result?.partyVotes[p.id] || 0,
      }));
      setVoteInputs(inputs);
      if (result?.status) setStatus(result.status as 'partial' | 'completed');
    } catch {
      // Init blank
      setVoteInputs(parties.map(p => ({ partyId: p.id, votes: 0 })));
      setExistingResult(null);
    }
  }, [parties]);

  // Handle cascade changes
  const handleDivisionChange = (val: string) => {
    setDivisionId(val);
    setDistrictId('');
    setConstituencyNum(null);
    setVoteInputs([]);
    setExistingResult(null);
    setMessage(null);
  };

  const handleDistrictChange = (val: string) => {
    setDistrictId(val);
    setConstituencyNum(null);
    setVoteInputs([]);
    setExistingResult(null);
    setMessage(null);
  };

  const handleConstituencyChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    setConstituencyNum(num);
    const cId = getConstituencyId(districtId, num);
    loadConstituency(cId);
  };

  // Update vote count
  const updateVote = (partyId: string, value: string) => {
    const votes = parseInt(value, 10) || 0;
    setVoteInputs(prev => prev.map(v => (v.partyId === partyId ? { ...v, votes } : v)));
  };

  // Totals & calculations
  const totalVotes = useMemo(() => voteInputs.reduce((s, v) => s + v.votes, 0), [voteInputs]);

  const calculated = useMemo(() => {
    const sorted = [...voteInputs].sort((a, b) => b.votes - a.votes);
    const winnerId = sorted[0]?.votes > 0 ? sorted[0].partyId : null;
    const margin = sorted.length >= 2 ? sorted[0].votes - sorted[1].votes : sorted[0]?.votes || 0;
    return { winnerId, margin, sorted };
  }, [voteInputs]);

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!constituencyId) return;

    setSaving(true);
    setMessage(null);

    try {
      const partyVotes: Record<string, number> = {};
      voteInputs.forEach(v => { partyVotes[v.partyId] = v.votes; });

      await saveResult({
        constituencyId,
        partyVotes,
        status,
        adminUid: adminUser.uid,
      });

      setMessage({ type: 'success', text: `Result saved for ${constituencyName}` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Admin header */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 shadow-soft">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Result Entry</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Logged in as {adminUser.displayName || adminUser.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          Logout
        </button>
      </div>

      {/* Cascade Selectors */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-soft">
        {/* Division */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Division</label>
          <select
            value={divisionId}
            onChange={e => handleDivisionChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:border-bd-green dark:focus:border-emerald-400 focus:ring-2 focus:ring-bd-green/20 dark:focus:ring-emerald-400/20 transition-all"
          >
            <option value="">Select Division</option>
            {divisions.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* District */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">District</label>
          <select
            value={districtId}
            onChange={e => handleDistrictChange(e.target.value)}
            disabled={!divisionId}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:border-bd-green dark:focus:border-emerald-400 focus:ring-2 focus:ring-bd-green/20 dark:focus:ring-emerald-400/20 disabled:bg-gray-50 dark:disabled:bg-slate-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-all"
          >
            <option value="">Select District</option>
            {activeDivision?.districts.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Constituency */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Constituency</label>
          <select
            value={constituencyNum ?? ''}
            onChange={e => handleConstituencyChange(e.target.value)}
            disabled={!districtId}
            className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:border-bd-green dark:focus:border-emerald-400 focus:ring-2 focus:ring-bd-green/20 dark:focus:ring-emerald-400/20 disabled:bg-gray-50 dark:disabled:bg-slate-900 disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-all"
          >
            <option value="">Select Constituency</option>
            {activeDistrict?.constituencies.map(num => (
              <option key={num} value={num}>
                {getConstituencyName(districtId, num)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 rounded-lg px-4 py-3 text-sm border shadow-sm ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Vote Entry Form */}
      {constituencyId && voteInputs.length > 0 && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-soft-lg">
          {/* Constituency header */}
          <div className="border-b border-gray-100 dark:border-slate-800 px-6 py-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{constituencyName}</h2>
            {existingResult && (
              <p className="text-sm text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Existing result found — editing will overwrite
              </p>
            )}
          </div>

          {/* MCQ-style party list */}
          <div className="divide-y divide-gray-50 dark:divide-slate-800">
            {parties.map(party => {
              const input = voteInputs.find(v => v.partyId === party.id);
              const votes = input?.votes || 0;
              const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              const isLeading = calculated.winnerId === party.id && votes > 0;

              return (
                <div
                  key={party.id}
                  className={`flex items-center gap-4 px-6 py-3.5 transition-colors ${
                    isLeading ? 'bg-green-50/50 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Party symbol + color */}
                  <span className="text-xl">{party.symbol}</span>
                  <span
                    className="h-3.5 w-3.5 flex-shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: party.color }}
                  />

                  {/* Party name */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {party.shortName}
                      {isLeading && <span className="ml-2 text-xs font-medium text-green-600 dark:text-emerald-400">● Leading</span>}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{party.name}</p>
                  </div>

                  {/* Vote input */}
                  <input
                    type="number"
                    min="0"
                    value={votes || ''}
                    onChange={e => updateVote(party.id, e.target.value)}
                    placeholder="0"
                    className="w-28 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-right text-sm font-semibold text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:border-bd-green dark:focus:border-emerald-400 focus:ring-2 focus:ring-bd-green/20 dark:focus:ring-emerald-400/20 transition-all"
                  />

                  {/* Percentage */}
                  <span className="w-16 text-right text-sm font-medium text-gray-500 dark:text-gray-400">
                    {formatPercentage(pct)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary footer */}
          <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-5 bg-gray-50 dark:bg-slate-800/50">
              <div className="mb-4 grid grid-cols-3 gap-3 sm:gap-4 text-center">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Votes</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100 mt-1">{formatNumber(totalVotes)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Winner</p>
                <p className="font-bold text-lg mt-1" style={{ color: parties.find(p => p.id === calculated.winnerId)?.color }}>
                  {parties.find(p => p.id === calculated.winnerId)?.shortName || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Margin</p>
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100 mt-1">{formatNumber(calculated.margin)}</p>
              </div>
            </div>

            {/* Status selector + Submit */}
            <div className="flex items-center gap-3">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'partial' | 'completed')}
                className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:border-bd-green dark:focus:border-emerald-400 focus:ring-2 focus:ring-bd-green/20 dark:focus:ring-emerald-400/20 transition-all"
              >
                <option value="partial">Counting (Partial)</option>
                <option value="completed">Declared (Final)</option>
              </select>

              <button
                type="submit"
                disabled={saving || totalVotes === 0}
                className="flex-1 rounded-lg bg-bd-green dark:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-bd-green/90 dark:hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {saving ? 'Saving...' : existingResult ? 'Update Result' : 'Save Result'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Empty state */}
      {!constituencyId && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 p-16 text-center shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Select a constituency above to enter results</p>
        </div>
      )}
    </div>
  );
}
