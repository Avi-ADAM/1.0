<script>
  import Header from '$lib/components/header/header.svelte';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import Close from '$lib/celim/close.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Tile from '$lib/celim/tile.svelte';

  // ייבוא הקומפוננטה החדשה (נניח שהיא באותה תיקייה או בתיקיית הקומפוננטות)
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';

  let { data } = $props();
  let projectId = data.projectId;
  let project = data.projectData;
  let isRegisteredUser = data.isRegisteredUser;

  let projectUsers = project?.attributes?.user_1s?.data || [];
  let projecto = project?.attributes?.open_missions?.data || [];
  let vallues = $state(project?.attributes?.vallues?.data || []);

  // תמונה - בדיקת תקינות
  let srcP = project?.attributes?.profilePic?.data
    ? project.attributes.profilePic.data.attributes.formats?.thumbnail?.url ||
      project.attributes.profilePic.data.attributes.url
    : null;

  let linkP = project?.attributes?.linkToWebsite;
  let githublink = project?.attributes?.githubLink;
  let fblink = project?.attributes?.fblink;
  let discordlink = project?.attributes?.discordLink;
  let twiterlink = project?.attributes?.twiterLink;

  const showl = { he: '🎁 הצגת התוצרים שלנו', en: '🎁 Our Products' };
  let show = $state(false);

  // טיפול בתרגום ערכים
  $effect(() => {
    if ($lang == 'he' && vallues.length > 0) {
      for (let i = 0; i < vallues.length; i++) {
        if (vallues[i].attributes.localizations.data.length > 0) {
          vallues[i].attributes.valueName =
            vallues[i].attributes.localizations.data[0].attributes.valueName;
        }
      }
    }
  });

  function us(x) {
    goto(`/user/${x}`);
  }

  function mesima(x) {
    goto(`/availableMission/${x}`);
  }

  // משתנה לרוחב המסך
  let w = $state(0);
  let isMobile = $derived(w < 640);

  // טקסטים
  const texts = {
    joinTitle: { he: 'הצטרפו לריקמה הזו', en: 'Join this FreeMate' },
    joinDesc: {
      he: 'כדי לקחת חלק פעיל, לראות את כל המידע וליצור שיתופי פעולה, מומלץ להירשם.',
      en: 'To participate, view full info and collaborate, please register.'
    },
    login: { he: 'התחברות / הרשמה', en: 'Login / Register' },
    values: { he: '✨ הערכים שלנו', en: '✨ Our Values' },
    missions: { he: '🚀 משימות פנויות', en: '🚀 Open Missions' },
    team: { he: 'הצוות', en: 'The Team' },
    visit: { he: 'בקרו באתר', en: 'Visit Website' }
  };

  let pageTitle = $derived({
    he: `1💗1 | ${project?.attributes?.projectName || 'ריקמה'}`,
    en: `1💗1 | ${project?.attributes?.projectName || 'FreeMate'}`
  });
</script>

<svelte:head>
  <title>{pageTitle[$lang]}</title>
</svelte:head>

{#if isRegisteredUser}
  <Header />
{/if}

{#if project}
  <!-- Main Container: Deep Gold/Pink Gradient Background -->
  <div
    bind:clientWidth={w}
    class="min-h-screen bg-gradient-to-br from-[#1a0515] via-[#2c0b1e] to-[#120f26] text-white overflow-y-auto overflow-x-hidden font-sans"
  >
    <div dir="rtl" class="max-w-4xl mx-auto px-4 py-8 pb-32 relative">
      <!-- 1. Hero Section with Authority Badge -->
      <div
        class="flex flex-col items-center justify-center mb-8 animate-fade-in-up"
      >
        <!-- The Badge Component -->
        <div class="mb-6 drop-shadow-[0_0_25px_rgba(255,215,0,0.3)]">
          <AuthorityBadge
            logoSrc={srcP}
            projectName={project.attributes.projectName}
            memberCount={projectUsers.length}
            size={isMobile ? 220 : 230}
            goldColor="#FFD700"
            darkGoldColor="#9F6808"
            pinkGlow={true}
          />
        </div>

        <!-- Social Links (Glassy container) -->
        <div
          class="flex gap-4 p-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-lg mb-6"
        >
          {#if discordlink}
            <a
              target="_blank"
              href={discordlink}
              class="social-btn group"
              title="Discord"
            >
              <img
                src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg"
                alt="Discord"
              />
            </a>
          {/if}
          {#if linkP}
            <a
              target="_blank"
              href={linkP}
              class="social-btn group text-gold"
              title={texts.visit[$lang]}
            >
              <!-- Website Icon -->
              <svg
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 512 512"
                xml:space="preserve"
              >
                <path
                  style="fill:#D6E5F6;"
                  d="M488.727,31.03H23.273C10.42,31.03,0,41.45,0,54.303v403.394c0,12.854,10.42,23.273,23.273,23.273
	h465.455c12.853,0,23.273-10.418,23.273-23.273V54.303C512,41.45,501.58,31.03,488.727,31.03z"
                />
                <path
                  style="fill:#A4C6EC;"
                  d="M488.727,31.03H256V480.97h232.727c12.853,0,23.273-10.418,23.273-23.273V54.303
	C512,41.45,501.58,31.03,488.727,31.03z"
                />
                <path
                  style="fill:#385C8E;"
                  d="M488.727,31.03H23.273C10.42,31.03,0,41.45,0,54.303v93.091c0,12.854,10.42,23.273,23.273,23.273
	h465.455c12.853,0,23.273-10.418,23.273-23.273V54.303C512,41.45,501.58,31.03,488.727,31.03z"
                />
                <path
                  style="fill:#1D3366;"
                  d="M488.727,31.03H256v139.636h232.727c12.853,0,23.273-10.418,23.273-23.273V54.303
	C512,41.45,501.58,31.03,488.727,31.03z"
                />
                <rect
                  x="395.636"
                  y="54.303"
                  style="fill:#FFFFFF;"
                  width="93.091"
                  height="93.122"
                />
                <path
                  style="fill:#1D3366;"
                  d="M488.727,170.695h-93.091c-12.853,0-23.273-10.42-23.273-23.273V54.303
	c0-12.851,10.42-23.273,23.273-23.273h93.091C501.58,31.03,512,41.452,512,54.303v93.119
	C512,160.275,501.58,170.695,488.727,170.695z M418.909,124.149h46.545V77.576h-46.545V124.149z"
                />
              </svg>
            </a>
          {/if}
          {#if twiterlink}
            <a target="_blank" href={twiterlink} class="social-btn group">
              <img
                src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg"
                alt="Twitter"
              />
            </a>
          {/if}
          {#if githublink}
            <a target="_blank" href={githublink} class="social-btn group">
              <img
                src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg"
                alt="GitHub"
              />
            </a>
          {/if}
          {#if fblink}
            <a target="_blank" href={fblink} class="social-btn group">
              <img
                src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"
                alt="Facebook"
              />
            </a>
          {/if}
        </div>
      </div>

      <!-- 2. Unregistered User Invitation (Gold & Pink Card) -->
      {#if !isRegisteredUser}
        <div
          class="mb-10 mx-2 p-6 rounded-2xl bg-gradient-to-r from-pink-900/80 to-purple-900/80 border border-gold/40 shadow-[0_0_15px_rgba(255,0,174,0.3)] text-center relative overflow-hidden"
        >
          <div
            class="absolute top-0 right-0 w-20 h-20 bg-gold/20 rounded-full blur-2xl"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-20 h-20 bg-barbi/20 rounded-full blur-2xl"
          ></div>

          <h2
            class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-l from-gold via-white to-gold mb-2"
          >
            {texts.joinTitle[$lang]}
          </h2>
          <p class="text-gray-200 mb-6 max-w-lg mx-auto leading-relaxed">
            {texts.joinDesc[$lang]}
          </p>
          <a
            href="/"
            class="inline-block px-8 py-3 rounded-full bg-gradient-to-r from-gold via-[#d4af37] to-[#b8860b] text-black font-bold shadow-lg hover:scale-105 transition-transform hover:shadow-gold/50"
          >
            {texts.login[$lang]}
          </a>
        </div>
      {/if}

      <!-- 3. Description -->
      {#if project.attributes.publicDescription}
        <div class="glass-panel mb-8 text-center">
          <RichText
            editable={false}
            outpot={project.attributes.publicDescription}
          />
        </div>
      {/if}

      <!-- 4. Team Members (Circular Avatars with Gold Rings) -->
      {#if projectUsers.length > 0}
        <div class="mb-10 text-center">
          <h3 class="section-title mb-4">{texts.team[$lang]}</h3>
          <div dir="ltr" class="flex flex-wrap justify-center gap-2">
            {#each projectUsers as user}
              <button
                onclick={() => us(user.id)}
                class="relative transition-transform hover:-translate-y-1 group"
                title={user.attributes.username}
              >
                <div
                  class="w-12 h-12 rounded-full border-2 border-gold p-0.5 bg-black/50 overflow-hidden shadow-md group-hover:shadow-gold/50"
                >
                  <img
                    class="w-full h-full rounded-full object-cover"
                    src={user.attributes.profilePic.data
                      ? user.attributes.profilePic.data.attributes.url
                      : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
                    alt={user.attributes.username}
                  />
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <!-- 5. Values & Missions Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <!-- Values -->
        {#if vallues.length > 0}
          <div
            class="glass-panel flex flex-col items-center border-t-4 border-t-gold"
          >
            <h2 class="text-xl font-bold text-gold mb-4 drop-shadow-md">
              {texts.values[$lang]}
            </h2>
            <div class="flex flex-wrap justify-center gap-2">
              {#each vallues as vallue}
                <div class="transform hover:scale-105 transition-transform">
                  <Tile
                    bg="gold"
                    sm={true}
                    big={true}
                    word={vallue.attributes.valueName}
                  />
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Missions -->
        <div
          class="glass-panel flex flex-col items-center border-t-4 border-t-barbi"
        >
          <h3 class="text-xl font-bold text-barbi mb-4 drop-shadow-md">
            {texts.missions[$lang]}
          </h3>
          <div class="flex flex-wrap justify-center gap-2 w-full">
            {#if projecto.length > 0}
              {#each projecto as om}
                <button
                  onclick={() => mesima(om.id)}
                  class="transform hover:scale-105 transition-transform"
                >
                  <Tile
                    bg="wow"
                    sm={true}
                    big={true}
                    word={om.attributes.name}
                  />
                </button>
              {/each}
            {:else}
              <p class="text-gray-400 text-sm">אין משימות פתוחות כרגע</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- 6. Products / Gifts -->
      {#if project.attributes.matanotofs?.data?.length > 0}
        <div class="text-center">
          {#if !show}
            <button class="cta-button-pink" onclick={() => (show = true)}>
              {showl[$lang]}
            </button>
          {:else}
            <div class="glass-panel mt-4 animate-fade-in relative">
              <button
                class="absolute top-2 right-2 text-white/50 hover:text-white"
                onclick={() => (show = false)}
              >
                <Close />
              </button>

              <h3 class="text-2xl text-gold mb-6 font-bold">{showl[$lang]}</h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {#each project.attributes.matanotofs.data as matanot}
                  <div
                    class="bg-black/40 rounded-xl p-4 border border-white/10 hover:border-gold/50 transition-colors"
                  >
                    <p class="text-lg font-semibold text-white mb-2">
                      {matanot.attributes.name}
                    </p>
                    <p class="text-barbi font-bold text-xl mb-2">
                      {matanot.attributes.price}
                    </p>
                    <a
                      href="/gift/{matanot.id}"
                      class="text-sm underline text-gold hover:text-white"
                      >לפרטים ורכישה</a
                    >
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <!-- Loading State -->
  <div
    class="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#1a0515] via-[#2c0b1e] to-[#120f26]"
  >
    <RingLoader size="200" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  </div>
{/if}

<style>
  /* Custom utility classes within scope */
  :global(body) {
    background-color: #0f0f0f;
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  }

  .text-gold {
    color: #ffd700;
  }
  .text-barbi {
    color: #ff00ae;
  }
  .bg-gold {
    background-color: #ffd700;
  }
  .bg-barbi {
    background-color: #ff00ae;
  }
  .border-gold {
    border-color: #ffd700;
  }
  .border-barbi {
    border-color: #ff00ae;
  }

  .social-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    background-color: rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
  }
  .social-btn:hover {
    background-color: rgba(255, 215, 0, 0.2);
    transform: scale(1.1);
  }
  .social-btn img,
  .social-btn svg {
    width: 1.5rem;
    height: 1.5rem;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }

  .section-title {
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    position: relative;
    display: inline-block;
  }

  .cta-button-pink {
    background: linear-gradient(135deg, #ff00ae 0%, #be185d 100%);
    color: white;
    font-weight: bold;
    padding: 0.75rem 2rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 15px rgba(255, 0, 174, 0.3);
    transition: all 0.3s;
  }
  .cta-button-pink:hover {
    box-shadow: 0 0 20px rgba(255, 0, 174, 0.6);
    transform: translateY(-2px);
  }

  /* Animation Utils */
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
