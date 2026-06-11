<script lang="ts">
  import { lang } from '$lib/stores/lang.js';

  interface Props {
    username?: string;
  }

  let { username = '' }: Props = $props();

  const t = {
    he: {
      hello: 'ברוכים הבאים',
      sub: 'ההרשמה הושלמה 🎉 עדיין אין כאן פעילות — ככה מתחילים בשלושה צעדים:',
      steps: [
        {
          icon: '🚀',
          title: 'בונים פרופיל או מקימים ריקמה',
          desc: 'כ־4 דקות — אפשר להעלות קורות חיים או אתר קיים וה־AI ימלא בשבילכם',
          href: '/onboard',
          cta: 'להתחלה'
        },
        {
          icon: '🤖',
          title: 'מכירים את Lev — העוזר החכם',
          desc: 'מנווט, פותח משימות ועונה על כל שאלה על המערכת',
          href: '/lev',
          cta: 'לשיחה עם Lev'
        },
        {
          icon: '✨',
          title: 'מספרים מה אתם רוצים ליצור',
          desc: "הקונסיירז' מפרק את הבקשה ומחבר אתכם לשותפים מתאימים",
          href: '/concierge',
          cta: 'לבקשה'
        }
      ]
    },
    en: {
      hello: 'Welcome',
      sub: "You're in 🎉 Nothing here yet — here's how to start in three steps:",
      steps: [
        {
          icon: '🚀',
          title: 'Build your profile or start a partnership',
          desc: 'About 4 minutes — upload a CV or a website and the AI fills it in for you',
          href: '/onboard',
          cta: 'Start'
        },
        {
          icon: '🤖',
          title: 'Meet Lev — the smart assistant',
          desc: 'Navigates, opens missions and answers any question about the system',
          href: '/lev',
          cta: 'Talk to Lev'
        },
        {
          icon: '✨',
          title: 'Tell us what you want to create',
          desc: 'The concierge breaks down your request and connects you with matching partners',
          href: '/concierge',
          cta: 'Make a request'
        }
      ]
    }
  };

  let labels = $derived(t[$lang as keyof typeof t] ?? t.he);
</script>

<section
  class="rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 shadow-lg"
>
  <h2 class="text-lg font-bold text-white">
    👋 {labels.hello}{username ? ` ${username}` : ''}!
  </h2>
  <p class="text-sm text-white/60 mt-1">{labels.sub}</p>

  <ol class="mt-4 space-y-2">
    {#each labels.steps as step, i (step.href)}
      <li>
        <a
          href={step.href}
          class="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 transition-all px-3 py-3 no-underline"
        >
          <span
            class="shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-bold flex items-center justify-center"
            >{i + 1}</span
          >
          <span class="text-xl shrink-0">{step.icon}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-semibold text-white">{step.title}</span>
            <span class="block text-xs text-white/50">{step.desc}</span>
          </span>
          <span
            class="shrink-0 text-xs font-bold text-white bg-white/10 border border-white/20 rounded-full px-3 py-1.5 whitespace-nowrap"
            >{step.cta}</span
          >
        </a>
      </li>
    {/each}
  </ol>
</section>
