<script>
import { Confetti } from "svelte-confetti";
import { fly } from 'svelte/transition';
import { lang } from '$lib/stores/lang';
let {
  username = "New Partner",
  projectName = "Amazing FreeMates Project",
  partnershipDetails = "Welcome to our collaborative network! This is the beginning of an exciting partnership.",
  onWelcomeClick = () => console.log("Welcome clicked!"),
  onChatClick = () => console.log("Chat clicked!"),
  onProjectClick = () => console.log("Project clicked!"),
  src = "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"
} = $props();

let isHovered = $state(false);
let showConfetti = $state(false);
let isScrolable = $state(true);

function handleCardClick() {
  showConfetti = true;
  onWelcomeClick?.();
  setTimeout(() => showConfetti = false, 20000);
}

function handleHover(enter) {
  isHovered = enter;
}

let texts = $derived({
  he: {
    welcome: `ברוך הבא ${username} לרקמה ${projectName}!`,
    partnership: `הצטרפת לרקמה ${projectName}`,
    enterProject: `לכניסה ל${projectName}`,
    chat: "צ'אט",
    celebrate: "חגיגה! 🎉",
    heartOf: "לב השותפות 💗"
  },
  en: {
    welcome: `Welcome ${username} to ${projectName}!`,
    partnership: `You joined ${projectName}`,
    enterProject: `Enter ${projectName} HQ`,
    chat: "Chat",
    celebrate: "Celebrate! 🎉",
    heartOf: "Heart of Partnership 💗"
  }
});

</script>

<div 
  class="welcome-card-container"
  role="button" 
  tabindex="0"
  onclick={handleCardClick}
  onmouseenter={() => handleHover(true)}
  onmouseleave={() => handleHover(false)}
  transition:fly|local={{y: 250, opacity: 0.9, duration: 2000}}
>
  <!-- Confetti Effect -->
  {#if showConfetti}
     <div
          style="
position: fixed;
top: 50px;
left: 0;
height: 100vh;
width: 100vw;
display: flex;
justify-content: center;
pointer-events: none;
z-index: 9999;"
        >
          <Confetti
            rounded
            size="30"
            x={[-5, 5]}
            y={[-5, 5]}
            delay={[0, 50]}
            amount="200"
            duration="20000"
            colorArray={[
              'url(https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png)'
            ]}
            fallDistance="100vh"
          /><!--colorRange={[0, 120]}-->
          <Confetti
            noGravity
            x={[-5, 5]}
            y={[-5, 5]}
            delay={[550, 550]}
            duration="15000"
            amount="2000"
            colorRange={[120, 240]}
            fallDistance="100vh"
          />
          <Confetti
            noGravity
            x={[-5, 5]}
            y={[-5, 5]}
            delay={[1000, 1050]}
            duration="15000"
            amount="200"
            colorRange={[240, 360]}
            fallDistance="100vh"
          />
          <Confetti
            x={[-5, 5]}
            y={[0, 0.1]}
            delay={[500, 2000]}
            duration="15000"
            amount="200"
          />
        </div>
  {/if}
  <!-- Card Header with Sparkle SVG -->
  <div class="card-header">
    <div class="sparkle-container">
      <svg 
        class="sparkle-svg {isHovered ? 'hovered' : ''}" 
        viewBox="-1 0 59 58" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Sparkle Groups with Animation -->
        {#each Array(10) as _, groupIndex}
          <g class="spark-group group-{groupIndex + 1}" transform="rotate({18 * groupIndex}) translate(29, 30)">
            <path class="spark spark-1" d="M25.9,45.8 c-0.6-0.3-1-0.9-0.9-1.6l0.8-5.2 c0.1-0.8,0.9-1.4,1.7-1.2 c0.8,0.1,1.4,0.9,1.2,1.7L28,44.6 c-0.1,0.8-0.9,1.4-1.7,1.2 C26.2,45.9,26.1,45.8,25.9,45.8z"/>
            <path class="spark spark-2" d="M25.4,51.8 c0.8,0.1,1.6-0.4,1.7-1.2l0-0.2c0.1-0.8-0.4-1.6-1.3-1.7 c-0.8-0.1-1.6,0.4-1.7,1.3l0,0.2 c-0.1,0.7,0.3,1.3,0.8,1.6 C25.1,51.7,25.3,51.8,25.4,51.8z"/>
            <path class="spark spark-3" d="M26.3,55.5 c0.1-0.8-0.4-1.6-1.2-1.7 c-0.8-0.1-1.6,0.4-1.7,1.2l0,0.2 c-0.1,0.7,0.3,1.3,0.9,1.6c0.1,0.1,0.3,0.1,0.4,0.1 c0.8,0.1,1.6-0.4,1.7-1.2L26.3,55.5z"/>
          </g>
        {/each}
        
        <!-- Center Circle -->
        <circle cx="28.5" cy="28.5" r="28" class="center-circle"/>
        
        <!-- Logo Image -->
        <defs>
          <clipPath id="circle-clip">
            <circle cx="28.5" cy="28.5" r="28" />
          </clipPath>
        </defs>
        <image href={src} x="0.5" y="0.5" height="56" width="56" clip-path="url(#circle-clip)" />
      </svg>
    </div>
    
    <div class="header-info">
      <div class="celebration-badge">
        {texts[$lang].celebrate}
      </div>
      <h2 class="welcome-title">{texts[$lang].welcome}</h2>
      <div class="heart-subtitle">{isHovered ? texts[$lang].heartOf : texts[$lang].welcome}</div>
    </div>
  </div>

  <!-- Card Body -->
  <div class="card-body">
    <div class="partnership-details">
      <p class="details-text">{partnershipDetails}</p>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons">
      <button 
        class="btn-primary sparkle-btn"
        onclick={onProjectClick}
      >
        <span>{texts[$lang].enterProject}</span>
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
      
      <button 
        class="btn-secondary"
        onclick={onChatClick}
      >
        <span>{texts[$lang].chat}</span>
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
.welcome-card-container {
  position: relative;
  max-width: 500px;
  width: 100%;
  background: linear-gradient(135deg, #FFF5A5 0%, #FFD4DA 25%, #99D2E4 50%, #5bf875 75%, #5efaf2 100%);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  z-index: 1;
}

.welcome-card-container:hover {
  transform: scale(1.02);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.confetti-particle {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: confettiFall 3s ease-out forwards;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100px) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(500px) rotate(720deg);
    opacity: 0;
  }
}

.card-header {
  display: flex;
  align-items: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sparkle-container {
  margin-right: 1.5rem;
}

.sparkle-svg {
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 0 10px rgba(255, 0, 146, 0.3));
}

.sparkle-svg.hovered {
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.spark {
  animation: sparkle 3s infinite;
}

.spark-1 { animation-delay: 0.1s; }
.spark-2 { animation-delay: 0.2s; }
.spark-3 { animation-delay: 0.3s; }

@keyframes sparkle {
  0% { 
    fill: #5efaf2;
    stroke: #FFF5A5;
    opacity: 1;
  }
  25% { 
    fill: #FFF5A5;
    stroke: #FFD4DA;
    opacity: 0.8;
  }
  50% { 
    fill: #FFD4DA;
    stroke: #99D2E4;
    opacity: 1;
  }
  75% { 
    fill: #99D2E4;
    stroke: #5bf875;
    opacity: 0.8;
  }
  100% {
    fill: #5bf875;
    stroke: #5efaf2;
    opacity: 1;
  }
}

.center-circle {
  fill: rgba(255, 245, 165, 0.9);
  stroke: #FF0092;
  stroke-width: 2;
  animation: pulse 3s infinite;
}

@keyframes pulse {
  0% {  
    stroke: #FFF5A5;
    fill: #5efaf2; 
  }
  25% { 
    stroke: #FFD4DA;
    fill: #FFF5A5; 
  }
  50% { 
    stroke: #99D2E4;
    fill: #FFD4DA; 
  }
  75% { 
    stroke: #5bf875;
    fill: #99D2E4; 
  }
  100% {
    stroke: #5efaf2;
    fill: #5bf875; 
  }
}

.username-text, .partnership-text, .project-text {
  fill: #FF0092;
  font-size: 10px;
  font-weight: bold;
  stroke: #FFF5A5;
  stroke-width: 0.5px;
  paint-order: stroke fill;
}

.header-info {
  flex: 1;
}

.celebration-badge {
  display: inline-block;
  background: linear-gradient(45deg, #FF0092, #FFD700);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.welcome-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #FF0092;
  margin: 0.5rem 0;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.heart-subtitle {
  color: #5bf875;
  font-weight: bold;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.card-body {
  padding: 2rem;
  background: rgba(255, 255, 255, 0.95);
}

.partnership-details {
  margin-bottom: 2rem;
}

.details-text {
  color: #666;
  line-height: 1.6;
  font-size: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
}

.btn-primary {
  background: linear-gradient(45deg, #FF0092, #FFD700);
  color: white;
  flex: 1;
  min-width: 200px;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(255, 0, 146, 0.3);
}

.sparkle-btn {
  position: relative;
  overflow: hidden;
}

.sparkle-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: rotate(45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
}

.btn-secondary {
  background: linear-gradient(45deg, #99D2E4, #5efaf2);
  color: #FF0092;
  min-width: 120px;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(94, 250, 242, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 640px) {
  .card-header {
    flex-direction: column;
    text-align: center;
  }
  
  .sparkle-container {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .sparkle-svg {
    width: 100px;
    height: 100px;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn-primary, .btn-secondary {
    min-width: auto;
  }
}
</style>
