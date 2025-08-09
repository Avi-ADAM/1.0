<script>

  /**
   * @typedef {Object} Props
   * @property {number} [width]
   * @property {number} [height]
   * @property {string} [color]
   * @property {string} [fill]
   * @property {boolean} [back]
   */

  /** @type {Props} */
  let {
    width = 23.7,
    height = 17.85,
    color = 'var(--barbi-pink)',
    fill = 'var(--gold)',
    back = false
  } = $props();
</script>

<svg
  class:rotate-180={back == true}
  viewBox="0 0 474.34627 357.28423"
  version="1.0"
  y="0"
  x="0"
  {width}
  {height}
  xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
  xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
  xmlns="http://www.w3.org/2000/svg"
  xmlns:svg="http://www.w3.org/2000/svg"
  xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:cc="http://creativecommons.org/ns#"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
>
  <path
    style:color
    style:fill
    style="fill-rule:evenodd;stroke:var(--barbi-pink);stroke-width:15.5px ; fill-opacity:1"
    d="m 245.4867,0.0062872 c -2.691,0.0801 -5.43464,0.92602 -7.76367,2.58399 h -0.008 L 3.0648323,175.11957 c -1.9122,1.4021 -3.08886004,3.754 -3.06446003906,6.125 0.0242999991,2.371 1.24896003906,4.6999 3.18946003906,6.0625 L 237.84998,352.49653 c 4.1817,3.2473 11.50327,6.59195 16.19727,3.66015 2.4974,-1.6471 3.82898,-4.8898 3.20898,-7.8164 l -21.28125,-101.16016 230.08985,23.93945 c 2.0789,0.21751 4.23786,-0.4842 5.79296,-1.88086 1.55511,-1.39666 2.48199,-3.46634 2.48829,-5.55664 v -157.9414 c 0.049,-10.531003 -8.87335,-11.915003 -16.03125,-11.000003 L 236.68592,117.78168 257.28553,13.621527 C 258.89711,4.5983372 252.3637,-0.1983628 245.4867,0.0062872 Z"
  />
</svg>
