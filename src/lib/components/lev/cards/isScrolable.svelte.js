export let isScrolable = $state({ value: true });
import { isMobileOrTablet } from "$lib/utilities/device";
export function toggleScrollable() {
    if (isMobileOrTablet()) {
      isScrolable.value.update((prev) => !prev);
    }
}