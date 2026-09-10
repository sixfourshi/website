'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Activity,
  Calendar,
  TrendingUp,
  Trophy,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle2,
  HelpCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  BarChart3,
  Copy,
  Check,
  Shield,
  Layers,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { showToast, copyToClipboard } from './Toast';
import { ClearLogsModal } from './ClearLogsModal';
import {
  formatExecutionCount,
  type ExecutionLog,
  type ExecutionAnalytics,
} from '@/lib/execution-types';

const GAME_COLORS = [
  '#38bdf8', // Azure
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#64748b', // Slate
];

interface ExecutionLogsTabProps {
  initialAnalytics?: ExecutionAnalytics;
  initialLogs?: ExecutionLog[];
}

export function ExecutionLogsTab({
  initialAnalytics,
  initialLogs = [],
}: ExecutionLogsTabProps) {
  const [analytics, setAnalytics] = useState<ExecutionAnalytics | null>(initialAnalytics || null);
  const [logs, setLogs] = useState<ExecutionLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Timeframe for Over Time Chart: '7days' | '30days' | 'all'
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | 'all'>('30days');

  // Filters for recent logs table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'supported' | 'unknown'>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Clear modal
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch / refresh data
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const res = await fetch('/api/executions?limit=100');
      if (!res.ok) {
        throw new Error('Failed to load telemetry analytics.');
      }
      const data = await res.json();
      if (data?.analytics) {
        setAnalytics(data.analytics);
      }
      if (Array.isArray(data?.logs)) {
        setLogs(data.logs);
      }
      if (!isSilent) {
        showToast('Analytics refreshed successfully.', 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Error refreshing execution analytics.', 'error');
    } finally {
      if (!isSilent) setRefreshing(false);
    }
  }, []);

  // Initial load if not provided
  useEffect(() => {
    if (!initialAnalytics) {
      fetchData(true);
    }
  }, [initialAnalytics, fetchData]);

  // Handle clearing logs
  const handleClearLogs = async (clearType: 'all' | 'older_7_days' | 'older_30_days') => {
    try {
      const res = await fetch('/api/executions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to clear execution logs.');
      }
      showToast(data.message || 'Execution logs cleared.', 'success');
      await fetchData(true);
    } catch (err: any) {
      showToast(err?.message || 'Error clearing logs.', 'error');
      throw err;
    }
  };

  // Copy helper
  const handleCopy = async (text: string, id: string, label: string) => {
    const success = await copyToClipboard(text, `${label} copied!`);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Extract unique games for the filter dropdown
  const uniqueGames = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.gameName));
    if (analytics?.executionsByGame) {
      analytics.executionsByGame.forEach((g) => set.add(g.name));
    }
    return Array.from(set).sort();
  }, [logs, analytics]);

  // Chart 1: Daily timeline filtered by selected timeframe
  const chartTimeline = useMemo(() => {
    if (!analytics?.dailyTimeline) return [];
    if (timeframe === '7days') {
      return analytics.dailyTimeline.slice(-7);
    }
    if (timeframe === '30days') {
      return analytics.dailyTimeline.slice(-30);
    }
    // All time
    return analytics.dailyTimeline;
  }, [analytics, timeframe]);

  // Chart 2: Executions by game (top 5 + Other if more)
  const chartGames = useMemo(() => {
    if (!analytics?.executionsByGame || analytics.executionsByGame.length === 0) {
      return [];
    }
    const items = [...analytics.executionsByGame];
    if (items.length <= 6) {
      return items.map((item, i) => ({
        ...item,
        fill: GAME_COLORS[i % GAME_COLORS.length],
      }));
    }

    const top5 = items.slice(0, 5).map((item, i) => ({
      ...item,
      fill: GAME_COLORS[i % GAME_COLORS.length],
    }));
    const otherCount = items.slice(5).reduce((sum, it) => sum + it.count, 0);
    top5.push({
      name: 'Other',
      count: otherCount,
      percentage: Math.round((otherCount / (analytics.totalExecutions || 1)) * 100),
      fill: GAME_COLORS[5],
    });
    return top5;
  }, [analytics]);

  // Filter logs for table
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by game
    if (selectedGame !== 'all') {
      result = result.filter(
        (l) => l.gameName.toLowerCase() === selectedGame.toLowerCase()
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      result = result.filter((l) => l.status === selectedStatus);
    }

    // Filter by date
    if (selectedDateFilter !== 'all') {
      const now = Date.now();
      if (selectedDateFilter === 'today') {
        const todayStr = new Date().toISOString().slice(0, 10);
        result = result.filter((l) => l.timestamp.startsWith(todayStr));
      } else if (selectedDateFilter === '7days') {
        const cutoff = now - 7 * 24 * 60 * 60 * 1000;
        result = result.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
      } else if (selectedDateFilter === '30days') {
        const cutoff = now - 30 * 24 * 60 * 60 * 1000;
        result = result.filter((l) => new Date(l.timestamp).getTime() >= cutoff);
      }
    }

    // Keyword search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (l) =>
          l.gameName.toLowerCase().includes(q) ||
          String(l.placeId).includes(q) ||
          String(l.universeId).includes(q) ||
          l.sessionId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, selectedGame, selectedStatus, selectedDateFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGame, selectedStatus, selectedDateFilter]);

  const totalExecutions = analytics?.totalExecutions || 0;
  const executionsToday = analytics?.executionsToday || 0;
  const executionsLast7Days = analytics?.executionsLast7Days || 0;
  const mostExecutedGame = analytics?.mostExecutedGame;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-azure-500/10 text-azure-400 border border-azure-500/20">
              <Activity size={16} />
            </span>
            <h2 className="font-display text-xl font-bold text-white">Execution Logs &amp; Telemetry</h2>
            <span className="rounded-full border border-azure-500/30 bg-azure-950/40 px-2.5 py-0.5 text-[11px] font-semibold text-azure-300">
              {formatExecutionCount(totalExecutions)} Total
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time telemetry reported by Roblox executors launching the universal loader.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchData(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-azure-500/40 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh execution metrics"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-azure-400' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-3.5 py-2 text-xs font-medium text-red-300 hover:bg-red-950/40 hover:border-red-500/50 transition-colors cursor-pointer"
            title="Clear detailed execution logs"
          >
            <Trash2 size={14} />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* 4 TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Executions */}
        <div className="rounded-2xl border border-azure-500/30 bg-gradient-to-br from-[#070e24] to-[#040817] p-5 shadow-glow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Executions</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-azure-500/10 text-azure-400 border border-azure-500/20">
              <Activity size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-white tracking-tight">
              {formatExecutionCount(totalExecutions)}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({totalExecutions.toLocaleString()} exact)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Cumulative launches across all games &amp; executors
          </p>
        </div>

        {/* Card 2: Executions Today */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-[#070e24] to-[#040817] p-5 shadow-glow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Executions Today</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-emerald-300 tracking-tight">
              {formatExecutionCount(executionsToday)}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({executionsToday.toLocaleString()} runs)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Activity recorded since midnight UTC
          </p>
        </div>

        {/* Card 3: Executions Last 7 Days */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#070e24] to-[#040817] p-5 shadow-glow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Last 7 Days</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-purple-300 tracking-tight">
              {formatExecutionCount(executionsLast7Days)}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              ({executionsLast7Days.toLocaleString()} runs)
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Past 7 calendar days activity
          </p>
        </div>

        {/* Card 4: Most-Executed Game */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-[#070e24] to-[#040817] p-5 shadow-glow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Most-Executed Game</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy size={16} />
            </span>
          </div>
          <div className="mt-3">
            <div className="font-display text-xl font-bold text-amber-300 truncate" title={mostExecutedGame?.name || 'None'}>
              {mostExecutedGame ? mostExecutedGame.name : 'None yet'}
            </div>
            <p className="mt-1 text-xs font-mono text-slate-400">
              {mostExecutedGame ? `${mostExecutedGame.count.toLocaleString()} executions` : 'Awaiting first telemetry event'}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Highest launch volume experience
          </p>
        </div>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART 1: Executions Over Time (2 cols on large screen) */}
        <div className="lg:col-span-2 rounded-2xl border border-azure-500/20 bg-[#070e24] p-5 shadow-lg flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-azure-400" />
                <h3 className="font-display text-sm font-bold text-white">Executions Over Time</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Daily execution frequency recorded by telemetry</p>
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-line bg-surface/60 p-1">
              <button
                type="button"
                onClick={() => setTimeframe('7days')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === '7days'
                    ? 'bg-azure-500 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('30days')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === '30days'
                    ? 'bg-azure-500 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  timeframe === 'all'
                    ? 'bg-azure-500 text-white shadow-glow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Time
              </button>
            </div>
          </div>

          {/* Chart Canvas or Empty State */}
          <div className="h-64 w-full pt-2">
            {totalExecutions === 0 ? (
              <div className="h-full w-full rounded-xl border border-line/40 bg-surface/20 flex flex-col items-center justify-center text-center p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-azure-500/10 text-azure-400 border border-azure-500/20 mb-3">
                  <Activity size={24} />
                </span>
                <h4 className="text-sm font-semibold text-white">No Executions Recorded Yet</h4>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Telemetry events will populate this graph automatically as players launch the universal loader in Roblox.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#1e293b' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#070e24',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#ffffff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    }}
                    itemStyle={{ color: '#38bdf8' }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600 }}
                    formatter={(value: any) => [`${value} executions`, 'Launches']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#execGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Executions by Game (1 col) */}
        <div className="rounded-2xl border border-azure-500/20 bg-[#070e24] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={16} className="text-emerald-400" />
              <h3 className="font-display text-sm font-bold text-white">Executions by Game</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Volume breakdown per Roblox experience</p>
          </div>

          <div className="h-64 w-full">
            {totalExecutions === 0 || chartGames.length === 0 ? (
              <div className="h-full w-full rounded-xl border border-line/40 bg-surface/20 flex flex-col items-center justify-center text-center p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                  <BarChart3 size={24} />
                </span>
                <h4 className="text-sm font-semibold text-white">No Game Data Yet</h4>
                <p className="mt-1 text-xs text-slate-400">
                  Game names will appear here once executions start arriving.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartGames}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <XAxis type="number" stroke="#64748b" fontSize={10} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#94a3b8"
                    fontSize={11}
                    width={90}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => (val.length > 12 ? `${val.slice(0, 12)}…` : val)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#070e24',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#ffffff',
                    }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} executions (${item.payload.percentage}%)`,
                      item.payload.name,
                    ]}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                    {chartGames.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED EXECUTION LOGS TABLE */}
      <div className="rounded-2xl border border-line bg-[#070e24] shadow-xl overflow-hidden">
        {/* Table Header & Search/Filter Toolbar */}
        <div className="p-5 border-b border-line space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-bold text-white">Recent Execution Telemetry</h3>
              <p className="text-xs text-slate-400">
                Detailed events with Place ID, Universe ID, and resolution status
              </p>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} matching logs
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search game, place ID, universe..."
                className="w-full rounded-xl border border-line bg-[#040817] py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-azure-500 focus:outline-none"
              />
            </div>

            {/* Game Filter */}
            <div>
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full rounded-xl border border-line bg-[#040817] px-3 py-2 text-xs text-white focus:border-azure-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Games</option>
                {uniqueGames.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="w-full rounded-xl border border-line bg-[#040817] px-3 py-2 text-xs text-white focus:border-azure-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="supported">Supported Games Only</option>
                <option value="unknown">Unknown Games Only</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value as any)}
                className="w-full rounded-xl border border-line bg-[#040817] px-3 py-2 text-xs text-white focus:border-azure-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-surface/60 text-slate-400 border border-line mb-3">
                <Activity size={24} />
              </span>
              <p className="text-sm font-semibold text-white">No matching execution logs found</p>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                {logs.length === 0
                  ? 'No executions have been reported yet. They will appear here when executors run the universal loader.'
                  : 'Try clearing your search query or adjusting your filters.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-[#040817]/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Game Name</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Place ID</th>
                  <th className="px-4 py-3.5">Universe ID</th>
                  <th className="px-4 py-3.5">Session ID</th>
                  <th className="px-5 py-3.5 text-right">Execution Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs text-slate-300">
                {paginatedLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const isSupported = log.status === 'supported';
                  const isSessionCopied = copiedId === log.sessionId;
                  const isPlaceCopied = copiedId === String(log.placeId);

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-surface/30 transition-colors"
                    >
                      {/* Game Name */}
                      <td className="px-5 py-3.5 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[220px]" title={log.gameName}>
                            {log.gameName}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isSupported ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
                            <CheckCircle2 size={12} />
                            <span>Supported Game</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-medium text-amber-400">
                            <HelpCircle size={12} />
                            <span>Unknown Game</span>
                          </span>
                        )}
                      </td>

                      {/* Place ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-300">
                        <button
                          type="button"
                          onClick={() => handleCopy(String(log.placeId), String(log.placeId), 'Place ID')}
                          className="inline-flex items-center gap-1.5 hover:text-azure-300 transition-colors cursor-pointer group"
                          title="Click to copy Place ID"
                        >
                          <span>{log.placeId}</span>
                          {isPlaceCopied ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Universe ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-400">
                        {log.universeId && log.universeId > 0 ? log.universeId : '—'}
                      </td>

                      {/* Session ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(log.sessionId, log.sessionId, 'Session ID')}
                          className="inline-flex items-center gap-1.5 hover:text-azure-300 transition-colors cursor-pointer group"
                          title="Click to copy full Session ID"
                        >
                          <span className="text-[11px]">
                            {log.sessionId.length > 14
                              ? `${log.sessionId.slice(0, 8)}…${log.sessionId.slice(-4)}`
                              : log.sessionId}
                          </span>
                          {isSessionCopied ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover:opacity-100 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-mono text-[11px] text-slate-400">
                        <div>
                          {dateObj.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {dateObj.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {filteredLogs.length > pageSize && (
          <div className="p-4 border-t border-line flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Page <span className="font-semibold text-white">{currentPage}</span> of{' '}
              <span className="font-semibold text-white">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface/40 px-3 py-1.5 text-xs text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Clear Logs Confirmation Modal */}
      <ClearLogsModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleClearLogs}
        totalLogs={logs.length}
      />
    </div>
  );
}
