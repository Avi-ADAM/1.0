<!--
  A QR code drawn as one SVG path, made in the browser (qrcode-generator) —
  no image service sees the visitor's link. Error correction M: big enough for
  a phone held a step away from the screen to read through glare.
-->
<script>
  import qrcode from 'qrcode-generator';

  /** @type {{ value: string, label: string, size?: number }} */
  let { value, label, size = 320 } = $props();

  const QUIET = 3;

  let drawn = $derived.by(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value, 'Byte');
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (qr.isDark(r, c)) d += `M${c + QUIET} ${r + QUIET}h1v1h-1z`;
      }
    }
    return { d, box: n + QUIET * 2 };
  });
</script>

<svg
  class="qr"
  width={size}
  height={size}
  viewBox="0 0 {drawn.box} {drawn.box}"
  role="img"
  aria-label={label}
  shape-rendering="crispEdges"
>
  <rect width={drawn.box} height={drawn.box} fill="#fff" />
  <path d={drawn.d} fill="#2a1a10" />
</svg>

<style>
  .qr {
    display: block;
    border-radius: 1.25rem;
    box-shadow:
      0 0 0 6px #fff,
      0 0 0 10px var(--ex-gold, #d4a12a),
      0 24px 60px rgba(58, 36, 24, 0.18);
  }
</style>
