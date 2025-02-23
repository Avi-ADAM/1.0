<script>
  import Lev from "../lev.svelte";

  
    let isShaking = $state(false);
    let showBurst = $state(false);
  
    const runFunction = async () => {
      isShaking = true;
      showBurst = false;
  
      // Simulate the function running
      await new Promise((resolve) => setTimeout(resolve, 2000));
  
      isShaking = false;
      showBurst = true;
  
      // Remove burst animation after it finishes
      setTimeout(() => {
        showBurst = false;
      }, 1000);
    };
  </script>
  <div class="container">
 
    <button
      class={`heart-btn ${isShaking ? 'shake' : ''} text-barbi hover:text-gold`}
      onclick={runFunction}
    >
      <Lev/>
    </button>
  
    <!-- Heart Burst -->
    {#if showBurst}
    <div class="bubble-container">
        {#each Array(20) as _, i}
          <div
            class="bubble-heart"
            style="--i: {i};"
          >
            💖
          </div>
        {/each}
      </div>
    {/if}
  
  </div>

<style>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 100%;
  background: #fff;
  overflow: hidden;
}

.heart-btn {
  font-size: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
}

.heart-btn.shake {
  animation: shake 0.5s infinite;
}

/* Shake Animation */
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-5px);
  }
  50% {
    transform: translateX(5px);
  }
  75% {
    transform: translateX(-5px);
  }
}

/* Bubble Container */
.bubble-container {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.bubble-heart {
  position: absolute;
  font-size: 1.5rem;
  animation: bubble 2s ease-out forwards;
  opacity: 0;
}

/* Bubble Animation */
@keyframes bubble {
  0% {
    transform: translate(0, 0) scale(0.5);
    opacity: 1;
  }
  50% {
    transform: translate(calc(var(--i) * 10px - 50px), calc(-30px - var(--i) * 5px)) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translate(calc(var(--i) * 20px - 100px), calc(-100px - var(--i) * 10px)) scale(0.8);
    opacity: 0;
  }
}

</style>