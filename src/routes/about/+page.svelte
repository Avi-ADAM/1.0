<script>
  /**
   * "About the agreement" — the oldest page on the site, and the last one
   * whose prose was written straight into the markup (PLAN_EN_READINESS
   * stage 5.1). Every word now comes from the `about` namespace in all five
   * locales, and the direction follows the reader instead of a fixed `rtl`.
   */
  import { t, isRtl } from '$lib/translations';
</script>

<svelte:head>
  <title>{$t('about.title')} · 1💗1</title>
</svelte:head>

<div class="body" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="welcome" dir={$isRtl ? 'rtl' : 'ltr'}>
    <picture>
      <source
        srcset="https://res.cloudinary.com/love1/image/upload/v1639246150/%D7%A9%D7%9C%D7%95%D7%9D_ej69q7.jpg"
        type="image/webp"
      />
      <img
        src="https://res.cloudinary.com/love1/image/upload/v1639246150/%D7%A9%D7%9C%D7%95%D7%9D_ej69q7.jpg"
        alt={$t('about.imageAlt')}
      />
    </picture>
  </div>

  <div class="intro" dir={$isRtl ? 'rtl' : 'ltr'}>
    <p class="pre-line">{$t('about.intro1')}</p>
    <p>{$t('about.intro2')}</p>
    <p>{$t('about.intro3')}</p>
    <p>{$t('about.contact', { email: 'baruch@1lev1.com' })}</p>
    <p>
      {$t('about.aboutPrefix')}
      <a
        target="_blank"
        rel="noopener noreferrer"
        class="text-gold hover:text-mturk"
        href="https://shalom.1lev1.world">1💗1</a
      >
    </p>
  </div>

  <div class="rabi" dir={$isRtl ? 'rtl' : 'ltr'}>
    <strong>{$t('about.prayerTitle')}</strong>
    <div class="prayer-text">{$t('about.prayerBody')}</div>
  </div>

  <div class="fli" dir={$isRtl ? 'rtl' : 'ltr'}>
    <span class="sec">
      <div class="link-row">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.facebook.com/onehHart1"
          class="text-barbi"
        >
          {$t('about.linkFacebook')}
          <img
            class="lnk-icon"
            height="32"
            width="32"
            alt="Facebook"
            src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"
          />
        </a>
      </div>
      <div class="link-row">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://www.facebook.com/worldnonviolent"
          class="text-barbi"
        >
          {$t('about.linkTreaty')}
          <img
            class="lnk-icon"
            height="32"
            width="32"
            alt="Facebook"
            src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png"
          />
        </a>
      </div>
      <div class="th">
        <div class="link-row">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://opensea.io/1love1"
            class="text-barbi"
          >
            {$t('about.linkNft')}
            <img
              class="lnk-icon"
              height="32"
              width="32"
              alt="NFT"
              src="https://res.cloudinary.com/love1/image/upload/v1640604252/nft-sign-svgrepo-com_a5xvx7.svg"
            />
          </a>
        </div>
      </div>
    </span>
    <span class="sec">
      <div class="link-row">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://payboxapp.page.link/mXnKCtYiWADBgAcB8"
          class="text-barbi"
        >
          {$t('about.linkDonate')}
          <img
            id="pb"
            class="lnk-icon"
            height="32"
            width="64"
            alt="PayBox"
            src="https://res.cloudinary.com/love1/image/upload/v1641485170/PBr_hdbfuv.png"
          />
        </a>
      </div>
      <div class="th">
        <div class="link-row">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://discord.gg/DNaMwrXzyS"
            class="text-barbi"
          >
            {$t('about.linkDiscord')}
            <img
              class="lnk-icon"
              height="32"
              width="64"
              alt="Discord"
              src="https://res.cloudinary.com/love1/image/upload/v1641482980/discord-seeklogo.com_tkftet.svg"
            />
          </a>
        </div>
      </div>
    </span>
  </div>
</div>

<style>
  .body {
    height: 100vh;
    width: 100vw;
    background-color: black !important;
    overflow-y: scroll;
  }
  #pb {
    height: 32px;
    width: 72px;
  }
  .welcome {
    position: relative;
    width: 100vw;
    align-items: center;
    aspect-ratio: 9/1;
  }
  .welcome img {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    display: block;
  }
  .intro {
    padding: 1vh 8vw 0 8vw;
    text-align: center;
    font-size: 100%;
    color: var(--barbi-pink);
    width: 100vw;
  }
  .intro p {
    margin: 0 0 0.6em 0;
  }
  .pre-line {
    white-space: pre-line;
  }
  .prayer-text {
    white-space: pre-line;
    line-height: 1.6;
    margin-top: 0.5em;
  }
  .fli {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .sec {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .th {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
  }
  .link-row {
    white-space: nowrap;
    padding: 5px;
  }
  .lnk-icon {
    vertical-align: middle;
  }
  @media (min-width: 620px) {
    .body {
      min-height: 100vh;
      max-height: 100vh;
      width: 100vw;
      background-color: black !important;
      color: black !important;
    }
    .welcome {
      aspect-ratio: 7/1;
    }
    .sec {
      flex-direction: row;
    }
  }
  @media (min-width: 840px) {
    .welcome {
      position: relative;
      width: 100vw;
      align-items: center;
      aspect-ratio: 5/1;
    }
    .fli {
      flex-direction: row;
    }
  }
  .rabi {
    color: rgb(21, 203, 209);
    font-family: 'StamSefarad', serif;
    text-align: center;
    font-size: 100%;
    padding: 1vh 4vw 1vh 4vw;
  }
</style>
