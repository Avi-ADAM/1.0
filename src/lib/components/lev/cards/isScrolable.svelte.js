export let isScrolable = $state({ value: false });
import { isMobileOrTablet } from "$lib/utilities/device";
export function toggleScrollable() {
      isScrolable.value = !isScrolable.value;
      console.log('isScrolable', isScrolable.value);
}    