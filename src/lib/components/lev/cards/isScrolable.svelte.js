export let isScrolable = $state({ value: false });
import { isMobileOrTablet } from "$lib/utilities/device";
export function toggleScrollable() {
    if (isMobileOrTablet()) {
      isScrolable.value = !isScrolable.value;
      console.log('isScrolable', isScrolable.value);
    }
}    