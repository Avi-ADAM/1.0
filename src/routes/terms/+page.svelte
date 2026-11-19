<script>
  import { resolve } from '$app/paths';
</script>

<svelte:head>
  <title>Terms of service | 1lev1</title>
  <meta
    name="description"
    content="Terms of service for the 1lev1 platform and its AI assistant connector."
  />
  <link rel="canonical" href="https://www.1lev1.com/terms" />
</svelte:head>

<article class="terms-wrap">
  <header>
    <p class="eyebrow">1lev1 terms of service</p>
    <h1>Use 1lev1 with care and mutual consent</h1>
    <p class="updated">Last updated: November 19, 2026</p>
  </header>

  <section>
    <h2>1. The service</h2>
    <p>
      1lev1 is a platform for people who create, work and share value together through consent-based
      partnerships called rikmas. These terms apply to the 1lev1 website, apps, public API and AI assistant
      connector (MCP).
    </p>
  </section>

  <section>
    <h2>2. Your account and your information</h2>
    <p>
      Keep your account credentials and API keys private. You are responsible for activity performed through
      your account and for ensuring that information you add is accurate and that you have the right to share it.
      You may revoke an API key or disconnect an AI assistant at any time in Settings.
    </p>
  </section>

  <section>
    <h2>3. Partners and consent</h2>
    <p>
      Work hours, shares, proposals, votes and profit-split records can affect other members of a rikma. Use
      1lev1 honestly and respect the consent process for shared decisions. Do not use the service to impersonate
      someone, misrepresent work, evade another member's consent, or interfere with another person's access.
    </p>
  </section>

  <section>
    <h2>4. AI assistants and MCP</h2>
    <p>
      When you connect an AI assistant, it can act with the permissions of the account and API key you give it.
      Review its work before approving a shared change. The connector is designed to prepare proposals and route
      consequential shared decisions to the people affected; it does not replace your judgment or any agreement
      between partners.
    </p>
  </section>

  <section>
    <h2>5. Acceptable use</h2>
    <p>
      Do not use 1lev1 to break the law, harm people, transmit malicious code, compromise security, scrape data
      without permission, or disrupt the service. We may limit or suspend access that threatens people, the
      service or its users.
    </p>
  </section>

  <section>
    <h2>6. Availability and changes</h2>
    <p>
      We work to keep 1lev1 available and accurate, but the service is provided as available and may change over
      time. We may update these terms; the date above will change when we do. Continued use after an update means
      you accept the updated terms to the extent allowed by law.
    </p>
  </section>

  <section>
    <h2>7. Contact</h2>
    <p>
      Questions, concerns or reports can be sent to
      <a href="mailto:notifications@1lev1.com">notifications@1lev1.com</a>. Our handling of personal information
      is described in the <a href={resolve('/privacy')}>Privacy Policy</a>.
    </p>
  </section>
</article>

<style>
  .terms-wrap {
    max-width: 46rem;
    margin: 0 auto;
    padding: 3rem 1.25rem 5rem;
    color: var(--text);
    font-size: 1.02rem;
    line-height: 1.8;
  }

  header {
    margin-bottom: 2.5rem;
  }

  .eyebrow {
    margin: 0 0 0.5rem;
    color: var(--barbi-pink);
    font-size: 0.85rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  h1,
  h2 {
    color: var(--gold);
    font-weight: 800;
  }

  h1 {
    margin: 0 0 0.5rem;
    font-size: clamp(1.7rem, 5vw, 2.4rem);
    line-height: 1.25;
  }

  h2 {
    margin: 0 0 0.75rem;
    font-size: clamp(1.2rem, 3vw, 1.45rem);
    line-height: 1.35;
  }

  .updated {
    margin: 0;
    color: var(--tm, #94a3b8);
    font-size: 0.9rem;
  }

  section {
    margin-bottom: 2.25rem;
  }

  p {
    margin: 0;
  }

  a {
    color: var(--gold);
    text-decoration: underline;
  }
</style>
