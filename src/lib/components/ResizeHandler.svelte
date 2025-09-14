<script>
  import { useThrelte } from '@threlte/core'
  import { onMount } from 'svelte'
  
  let { size } = $props()
  
  const { renderer, camera, invalidate } = useThrelte()
  
  function updateSize() {
    if (renderer && size && size.width && size.height) {
      renderer.setSize(size.width, size.height)
      
      if (camera && camera.isPerspectiveCamera) {
        camera.aspect = size.width / size.height
        camera.updateProjectionMatrix()
      }
      
      invalidate()
    }
  }
  
  // Run on mount to handle initial sizing
  onMount(() => {
    // Use a small delay to ensure renderer is ready
    setTimeout(updateSize, 10)
    console.log("size updated",size)
  })
  
  // Watch for size changes and manually resize the renderer
  $effect(() => {
    updateSize()
  })
</script>