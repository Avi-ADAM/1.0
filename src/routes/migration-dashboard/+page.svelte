<script lang="ts">
  import { onMount } from 'svelte';
  
  interface MetricsSummary {
    totalRequests: number;
    qidsRequests: number;
    actionRequests: number;
    migrationPercentage: number;
    errorRates: {
      qids: number;
      action: number;
    };
    avgResponseTimes: {
      qids: number;
      action: number;
    };
    actionBreakdown: {
      [actionKey: string]: {
        qids: number;
        action: number;
        migrated: boolean;
      };
    };
  }
  
  let summary: MetricsSummary | null = null;
  let loading = true;
  let error: string | null = null;
  let period = 3600000; // 1 hour default
  let autoRefresh = true;
  let refreshInterval: number;
  
  const periodOptions = [
    { label: '15 minutes', value: 900000 },
    { label: '1 hour', value: 3600000 },
    { label: '6 hours', value: 21600000 },
    { label: '24 hours', value: 86400000 },
    { label: '7 days', value: 604800000 }
  ];
  
  async function fetchMetrics() {
    try {
      loading = true;
      error = null;
      
      const response = await fetch(`/api/migration-metrics?period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        summary = result.data.summary;
      } else {
        error = result.error?.message || 'Failed to fetch metrics';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
  
  function startAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    
    if (autoRefresh) {
      refreshInterval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    }
  }
  
  onMount(() => {
    fetchMetrics();
    startAutoRefresh();
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });
  
  $: {
    // Restart auto-refresh when autoRefresh changes
    startAutoRefresh();
  }
  
  $: {
    // Fetch new data when period changes
    if (!loading) {
      fetchMetrics();
    }
  }
  
  function getStatusColor(percentage: number): string {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    if (percentage >= 25) return 'text-orange-600';
    return 'text-red-600';
  }
  
  function getErrorRateColor(rate: number): string {
    if (rate <= 1) return 'text-green-600';
    if (rate <= 5) return 'text-yellow-600';
    if (rate <= 10) return 'text-orange-600';
    return 'text-red-600';
  }
  
  function getResponseTimeColor(oldTime: number, newTime: number): string {
    const improvement = ((oldTime - newTime) / oldTime) * 100;
    if (improvement >= 20) return 'text-green-600';
    if (improvement >= 0) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<div class="min-h-screen bg-gray-50 p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        Migration Dashboard
      </h1>
      <p class="text-gray-600">
        Track the migration from QIDS to Action System
      </p>
    </div>
    
    <!-- Controls -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium text-gray-700">
            Time Period:
          </label>
          <select
            bind:value={period}
            class="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {#each periodOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="flex items-center gap-4">
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              bind:checked={autoRefresh}
              class="rounded"
            />
            Auto-refresh (30s)
          </label>
          
          <button
            on:click={fetchMetrics}
            disabled={loading}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
    
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{error}</p>
      </div>
    {/if}
    
    {#if summary}
      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- Total Requests -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Total Requests</h3>
          <p class="text-3xl font-bold text-gray-900">{summary.totalRequests}</p>
        </div>
        
        <!-- Migration Progress -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Migration Progress</h3>
          <p class="text-3xl font-bold {getStatusColor(summary.migrationPercentage)}">
            {summary.migrationPercentage.toFixed(1)}%
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {summary.actionRequests} / {summary.totalRequests} using new system
          </p>
        </div>
        
        <!-- QIDS Requests -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">QIDS (Old)</h3>
          <p class="text-3xl font-bold text-gray-900">{summary.qidsRequests}</p>
          <p class="text-xs {getErrorRateColor(summary.errorRates.qids)} mt-1">
            {summary.errorRates.qids.toFixed(2)}% error rate
          </p>
        </div>
        
        <!-- Action Requests -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">Action System (New)</h3>
          <p class="text-3xl font-bold text-gray-900">{summary.actionRequests}</p>
          <p class="text-xs {getErrorRateColor(summary.errorRates.action)} mt-1">
            {summary.errorRates.action.toFixed(2)}% error rate
          </p>
        </div>
      </div>
      
      <!-- Performance Comparison -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Performance Comparison</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Response Times -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-3">Average Response Time</h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">QIDS (Old)</span>
                  <span class="font-medium">{summary.avgResponseTimes.qids}ms</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full"
                    style="width: {Math.min(100, (summary.avgResponseTimes.qids / 1000) * 100)}%"
                  ></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">Action System (New)</span>
                  <span class="font-medium {getResponseTimeColor(summary.avgResponseTimes.qids, summary.avgResponseTimes.action)}">
                    {summary.avgResponseTimes.action}ms
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-green-600 h-2 rounded-full"
                    style="width: {Math.min(100, (summary.avgResponseTimes.action / 1000) * 100)}%"
                  ></div>
                </div>
              </div>
              
              {#if summary.avgResponseTimes.qids > 0}
                <p class="text-xs text-gray-500 mt-2">
                  {summary.avgResponseTimes.action < summary.avgResponseTimes.qids ? '✓' : '✗'}
                  {Math.abs(((summary.avgResponseTimes.qids - summary.avgResponseTimes.action) / summary.avgResponseTimes.qids) * 100).toFixed(1)}%
                  {summary.avgResponseTimes.action < summary.avgResponseTimes.qids ? 'faster' : 'slower'}
                </p>
              {/if}
            </div>
          </div>
          
          <!-- Error Rates -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 mb-3">Error Rates</h3>
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">QIDS (Old)</span>
                  <span class="font-medium {getErrorRateColor(summary.errorRates.qids)}">
                    {summary.errorRates.qids.toFixed(2)}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-red-600 h-2 rounded-full"
                    style="width: {Math.min(100, summary.errorRates.qids)}%"
                  ></div>
                </div>
              </div>
              
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-600">Action System (New)</span>
                  <span class="font-medium {getErrorRateColor(summary.errorRates.action)}">
                    {summary.errorRates.action.toFixed(2)}%
                  </span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-red-600 h-2 rounded-full"
                    style="width: {Math.min(100, summary.errorRates.action)}%"
                  ></div>
                </div>
              </div>
              
              {#if summary.errorRates.qids > 0}
                <p class="text-xs text-gray-500 mt-2">
                  {summary.errorRates.action < summary.errorRates.qids ? '✓' : '✗'}
                  {Math.abs(summary.errorRates.qids - summary.errorRates.action).toFixed(2)}%
                  {summary.errorRates.action < summary.errorRates.qids ? 'improvement' : 'regression'}
                </p>
              {/if}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Action Breakdown -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Action Breakdown</h2>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action Key
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  QIDS
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action System
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each Object.entries(summary.actionBreakdown) as [actionKey, data]}
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {actionKey}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    {#if data.migrated}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Migrated
                      </span>
                    {:else}
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Not Migrated
                      </span>
                    {/if}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {data.qids}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {data.action}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {data.qids + data.action}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else if loading}
      <div class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-500">Loading metrics...</p>
      </div>
    {/if}
  </div>
</div>
