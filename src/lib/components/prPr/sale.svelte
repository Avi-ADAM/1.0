<script>
  import { SaleComponent } from '$lib/components/sales';
  import { idPr } from '../../stores/idPr.js';

  /**
   * @typedef {Object} Props
   * @property {any} [projectUsers]
   * @property {any} quant
   * @property {number} [each]
   * @property {boolean} [kindUlimit]
   * @property {any} maid
   * @property {'monthly' | 'yearly' | 'total' | 'unlimited'} [kindOf]
   * @property {(payload: { id: any; in: any; un: any; matana: any }) => void} [onDone] - Callback when the sale is successfully added.
   * @property {() => void} [onDoners] - Callback when the sale is successfully added (no updateMatanot).
   * @property {() => void} [onEror] - Callback when an error occurs.
   */

  /** @type {Props} */
  let {
    projectUsers = [],
    quant,
    each = $bindable(0),
    kindUlimit = false,
    kindOf = 'monthly',
    maid,
    onDone,
    onDoners,
    onEror
  } = $props();

</script>

<SaleComponent
  productId={maid}
  productName=""
  availableQuantity={quant}
  price={each}
  {kindOf}
  projectId={$idPr}
  {projectUsers}
  bind:each
  {kindUlimit}
  onDone={onDone}
  onDoners={onDoners}
  onError={onEror}
/>

