<!-- src/lib/components/ThemeToggle.svelte -->
<script>
    import { theme, themeConfig, toggleTheme } from '$lib/stores/theme';
    
     let {size = 'md', variant = 'button', showLabel = true} = $props();
     // 'button', 'switch', 'dropdown'
     // 'sm', 'md', 'lg'
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
  </script>
  
  {#if variant === 'button'}
    <!-- Button Toggle -->
    <button
      onclick={toggleTheme}
      class="rounded-theme shadow-theme font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
             {sizes[size]}
             personal:bg-gradient-to-r personal:from-purple-500 personal:to-pink-500 personal:text-white personal:hover:from-purple-600 personal:hover:to-pink-600 personal:shadow-lg
             business:bg-gray-800 business:text-white business:hover:bg-gray-700 business:border business:border-gray-600"
    >
      {#if showLabel}
        <span class="flex items-center gap-2">
          <span>🎨</span>
          <span>עבור ל{$theme === 'personal' ? 'עסקי' : 'אישי'}</span>
        </span>
      {:else}
        <span>🎨</span>
      {/if}
    </button>
  
  {:else if variant === 'switch'}
    <!-- Switch Toggle -->
    <div class="flex items-center gap-3">
      {#if showLabel}
        <span class="text-sm font-medium text-theme-text">
          {$themeConfig.name}
        </span>
      {/if}
      
      <button
        onclick={toggleTheme}
        class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
               {$theme === 'personal' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'}"
        role="switch"
        aria-checked={$theme === 'personal'}
      >
        <span
          class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                 {$theme === 'personal' ? 'translate-x-6' : 'translate-x-1'}"
        />
      </button>
    </div>
  
  {:else if variant === 'dropdown'}
    <!-- Dropdown Toggle -->
    <div class="relative">
      <select
        bind:value={$theme}
        class="appearance-none rounded-theme shadow-theme px-4 py-2 pr-8 bg-theme-card text-theme-text border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all duration-200"
      >
        <option value="personal">🎨 אישי</option>
        <option value="business">💼 עסקי</option>
      </select>
      
      <!-- Dropdown Arrow -->
      <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-theme-muted">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  {/if}
  
  <style>
    /* Custom dropdown styling */
    select {
      background-image: none;
    }
    
    /* Animation for switch */
    @keyframes slideIn {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  </style>