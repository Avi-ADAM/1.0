<script>
  import Tile from '$lib/celim/tile.svelte';
  import { animate, signal, all } from '$lib/func/animation.ts';
  import {  onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { SendTo } from '$lib/send/sendTo.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';

  // פרמטרים מהנתיב
   let {data} = $props();
  
  // משתנים בסיסיים
  let colors = ["pink", "blue", "purple", "cyan", "indigo", "green", "yellow", "red", "gray"];
  let h = $state(0), w = $state(0), oldH = $state(0), oldW = $state(0);
  
  // מצב האפליקציה
  let negotiationId = $derived(data?.id || '0');
  let isNewNegotiation = $derived(negotiationId === '0');
  let negotiationData = $state(null);
  let loading = $state(false);
  let error = $state('');
  
  // נתוני דיון
  let currentTopic = $state('');
  let isTopicSet = $state(false);
  let isFirstPositionSet = $state(false);
  let userName = $state(page.data.un ? page.data.un : '');
  let userEmail = $state(page.data.email ? page.data.email : '');
  let firstPosition = $state({ heading: '', description: '' });
  let currentRound = $state(1);
  let maxRounds = $state(3);
  let showResults = $state(false);
  let showShareModal = $state(false);
  let shareUrl = $state('');
  
  // אנימציות
  const line = signal({ x: 2.5, y: 2.5, x2: 1.5, y2: 1.5, fill: 'blue' });
  const svg = signal({ x: -2, y: -2, w: 2, h: 2 });
  const text = signal({ count: 0, opacity: 0 });

  // נתוני הנקודות
  let points = $derived(negotiationData?.positions || []);

  // חישוב מיקומים ומרכז הכובד
  let centerOfMass = $derived(calculateCenterOfMass(points));
  let consensusLevel = $derived(calculateConsensusLevel(points));

  onMount(async () => {
    if (!isNewNegotiation) {
      await loadNegotiationData();
    }
    addLocation(points);
  });

  $effect(async () => {
    if (oldH == 0 && oldW == 0) {
      oldH = h;
      oldW = w;
    } else if (oldH != h || oldW != w) {
      all(
        svg.to({ x: 0, y: 0, w: w, h: h }, { duration: 10 }),
        line.to({ x: 0, y: 0, x2: w, y2: h, fill: '#ffff00' }, { duration: 10 })
      );
      oldH = h;
      oldW = w;
    }
  });

  animate(async () => {
    await svg.to({ x: 0, y: 0, w: w, h: h });
    all(line.to({ x: 0, y: 0, x2: w, y2: h, fill: 'pink' }));
    await text
      .to({ opacity: 1 }, { duration: 300 })
      .to({ count: 10_000 }, { duration: 600 });
  });

  // פונקציות GraphQL
  async function loadNegotiationData() {
    loading = true;
    error = '';
    
    try {
      const result = await sendToSer({ id: negotiationId }, '39GetNegotiation', 0, 0, false, fetch);
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (result.data?.negotiation?.data) {
        const attrs = result.data.negotiation.data.attributes;
        negotiationData = {
          id: result.data.negotiation.data.id,
          topic: attrs.topic,
          description: attrs.description,
          status: attrs.status,
          maxRounds: attrs.maxRounds,
          currentRound: attrs.currentRound,
          createdBy: attrs.creator?.data?.attributes,
          positions: attrs.positions?.data?.map(pos => ({
            id: pos.id,
            ...pos.attributes,
            voters: JSON.parse(pos.attributes.voters || '[]')
          })) || [],
          participants: attrs.participants?.data?.map(p => p.attributes) || []
        };
        
        currentTopic = negotiationData.topic;
        currentRound = negotiationData.currentRound;
        maxRounds = negotiationData.maxRounds;
        isTopicSet = true;
        isFirstPositionSet = negotiationData.positions.length > 0;
        
        addLocation(negotiationData.positions);
      } else {
        throw new Error('דיון לא נמצא');
      }
    } catch (err) {
      error = err.message;
      console.error('Error loading negotiation:', err);
    } finally {
      loading = false;
    }
  }

  async function createNegotiation() {
    loading = true;
    error = '';

    try {
      const result = await sendToSer({
          data: {
            topic: currentTopic,
            description: `דיון שנוצר על ידי ${userName}`,
            status: 'active',
            maxRounds: maxRounds,
            currentRound: 1,
            creator: page.data.uid ? page.data.uid : null ,
            createdByEmail: userEmail
          }
        },'40CreateNegotiation',0,0,false,fetch);
      
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (result.data?.createNegotiation?.data) {
        negotiationId = result.data.createNegotiation.data.id;
        negotiationData = {
          id: negotiationId,
          topic: currentTopic,
          positions: [],
          participants: [{ username: userName, email: userEmail }]
        };
        
        // עדכון URL
        if (browser) {
          goto(`/negotiation/${negotiationId}`, { replaceState: true });
        }
        
        isNewNegotiation = false;
        shareUrl = `${window.location.origin}/negotiation/${negotiationId}`;
        showShareModal = true;
      }
    } catch (err) {
      error = err.message;
      console.error('Error creating negotiation:', err);
    } finally {
      loading = false;
    }
  }

  async function addPositionToServer(positionData) {
    try {
      const result = await sendToSer({
          data: {
            ...positionData,
            negotiation: negotiationId,
            voters: JSON.stringify(positionData.voters || [])
          }
        },'41CreatePosition',0,0,false,fetch
      );

      return result.data?.createPosition?.data;
    } catch (err) {
      console.error('Error adding position:', err);
      throw err;
    }
  }

  async function updatePositionSupport(positionId, supporters, votes) {
    try {
      const result = await sendToSer({
            id: positionId,
            data: {
              voters: JSON.stringify(supporters),
              votes: votes
            }
          },'42UpdatePosition',
     0,0,false,fetch);

      return result;
    } catch (err) {
      console.error('Error updating position support:', err);
      throw err;
    }
  }

  // פונקציות עזר
  function calculateCenterOfMass(pointsArray) {
    if (pointsArray.length === 0) return { x: 50, y: 50 };
    
    let totalWeight = 0;
    let weightedX = 0;
    let weightedY = 0;
    
    pointsArray.forEach(point => {
      const weight = (point.voters?.length || 0) + 1;
      weightedX += point.location * weight;
      weightedY += point.location * weight;
      totalWeight += weight;
    });
    
    return {
      x: weightedX / totalWeight,
      y: weightedY / totalWeight
    };
  }

  function calculateConsensusLevel(pointsArray) {
    if (pointsArray.length <= 1) return 100;
    
    const distances = [];
    for (let i = 0; i < pointsArray.length - 1; i++) {
      for (let j = i + 1; j < pointsArray.length; j++) {
        const dist = Math.abs(pointsArray[i].location - pointsArray[j].location);
        distances.push(dist);
      }
    }
    
    const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
    return Math.max(0, 100 - avgDistance);
  }

  function addLocation(pointsArr = []) {
    let length = pointsArr.length;
    if (length == 1) {
      pointsArr[0].location = 50;
      pointsArr[0].color = colors[0];
    } else if (length == 2) {
      pointsArr[0].location = 33.33;
      pointsArr[1].location = 66.666;
      pointsArr[0].color = colors[0];
      pointsArr[1].color = colors[1];
    } else if (length == 3) {
      pointsArr[0].location = 10;
      pointsArr[1].location = 50;
      pointsArr[2].location = 90;
      pointsArr[0].color = colors[0];
      pointsArr[1].color = colors[1];
      pointsArr[2].color = colors[2];
    } else if (length > 0) {
      let t = 10;
      let a = 80 / (length - 1);
      let counter = 0;
      for (let i = 0; i < pointsArr.length; i++) {
        pointsArr[i].location = t;
        t += a;
        pointsArr[i].color = colors[counter];
        counter < 8 ? counter += 1 : counter = 0;
      }
    }
    
    if (negotiationData) {
      negotiationData.positions = pointsArr;
    }
  }

  async function addPoint(location = "middle", length = 1, i = 3, customData = {}) {
    const newPoint = {
      heading: customData.heading || `עמדה ${length + 1}`,
      description: customData.description || 'תיאור העמדה',
      author: userName || 'משתמש אנונימי',
      authorEmail: userEmail || '',
      votes: 0,
      voters: [],
      intensity: customData.intensity || 5,
      tags: customData.tags || [],
      order: location == "top" ? 1 : location == "bottom" ? length + 1 : i + 1,
      location: 50 // ערך זמני
    };

    try {
      const serverPoint = await addPositionToServer(newPoint);
      
      if (serverPoint) {
        const pointWithId = {
          id: serverPoint.id,
          ...newPoint,
          hover: false,
          timestamp: new Date()
        };

        if (length == 1) {
          points[0].order = location == "bottom" ? 1 : 2;
          points.push(pointWithId);
        } else if (location == "top") {
          points.forEach(p => p.order += 1);
          points.push(pointWithId);
        } else if (location == "bottom") {
          points.push(pointWithId);
        } else {
          points.forEach(p => {
            if (p.order > i) p.order++;
          });
          points.push(pointWithId);
        }

        points = points.sort((a, b) => a.order - b.order);
        addLocation(points);
      }
    } catch (err) {
      error = 'שגיאה בהוספת עמדה חדשה';
    }
  }

  async function supportPoint(pointId) {
    const point = points.find(p => p.id === pointId);
    if (point && !point.voters.includes(userName)) {
      point.voters.push(userName);
      point.votes++;
      
      try {
        await updatePositionSupport(pointId, point.voters, point.votes);
        points = points; // trigger reactivity
      } catch (err) {
        // חזור למצב הקודם במקרה של שגיאה
        point.voters = point.voters.filter(s => s !== userName);
        point.votes--;
        error = 'שגיאה בתמיכה בעמדה';
      }
    }
  }

  function startNewRound() {
    if (currentRound < maxRounds) {
      currentRound++;
    } else {
      showResults = true;
    }
  }

  async function setTopic() {
    if (currentTopic.trim() && userName.trim()) {
      if (isNewNegotiation) {
        await createNegotiation();
      }
      isTopicSet = true;
    }
  }

  async function setFirstPosition() {
    if (firstPosition.heading.trim() && firstPosition.description.trim()) {
      await addPoint("middle", 0, 0, {
        heading: firstPosition.heading,
        description: firstPosition.description
      });
      
      isFirstPositionSet = true;
      setTimeout(() => {
        addLocation(points);
      }, 100);
    }
  }

  function resetSystem() {
    currentTopic = '';
    isTopicSet = false;
    isFirstPositionSet = false;
    firstPosition = { heading: '', description: '' };
    currentRound = 1;
    showResults = false;
    
    if (browser) {
      goto('/negotiation/0');
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('הקישור הועתק ללוח!');
    });
  }

  // מעקב אחר משתנים
  $effect(() => {
    for (let i = 0; i < points.length; i++) {
      const element = points[i];
      if (points[i + 1]) {
        points[i].distance = { sum: (points[i].location + points[i + 1].location) / 2 };
      }
    }
  });
</script>

<!-- טעינה -->
{#if loading}
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white p-8 rounded-lg shadow-xl">
    <div class="flex items-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
      <span>טוען...</span>
    </div>
  </div>
</div>
{/if}

<!-- שגיאה -->
{#if error}
<div class="fixed top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
  <strong>שגיאה:</strong> {error}
  <button class="float-right" onclick={() => error = ''}>×</button>
</div>
{/if}

<div style="height:100vh;width:100vw;background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
  
  <!-- הגדרת נושא -->
  {#if !isTopicSet}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold mb-4 text-center text-gray-800">
          {isNewNegotiation ? 'הגדרת נושא הדיון' : 'הצטרף לדיון'}
        </h2>
        
        {#if !isNewNegotiation && negotiationData}
          <div class="mb-4 p-4 bg-blue-50 rounded">
            <h3 class="font-bold text-blue-800">נושא הדיון:</h3>
            <p class="text-blue-700">{negotiationData.topic}</p>
          </div>
        {/if}
        
        <input 
          bind:value={userName}
          placeholder="שם המשתמש שלך"
          class="w-full p-3 border rounded mb-4"
        />
        <input 
          bind:value={userEmail}
          placeholder="אימייל (אופציונלי)"
          type="email"
          class="w-full p-3 border rounded mb-4"
        />
        
        {#if isNewNegotiation}
          <textarea 
            bind:value={currentTopic}
            placeholder="תאר את הנושא שברצונך לדון בו..."
            class="w-full p-3 border rounded mb-4 h-32"
          ></textarea>
        {/if}
        
        <button 
          onclick={setTopic}
          class="w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600 transition-colors"
          disabled={!userName.trim() || (isNewNegotiation && !currentTopic.trim())}
        >
          {isNewNegotiation ? 'המשך להגדרת עמדה' : 'הצטרף לדיון'}
        </button>
      </div>
    </div>
  {/if}

  <!-- מודל שיתוף -->
  {#if showShareModal}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold mb-4 text-center text-gray-800">הדיון נוצר בהצלחה!</h2>
        <p class="mb-4 text-center">שתף את הקישור הזה עם אחרים כדי שיוכלו להצטרף:</p>
        <div class="flex mb-4">
          <input 
            value={shareUrl}
            readonly
            class="flex-1 p-3 border rounded-l bg-gray-50"
          />
          <button 
            onclick={copyToClipboard}
            class="px-4 py-3 bg-blue-500 text-white rounded-r hover:bg-blue-600"
          >
            העתק
          </button>
        </div>
        <button 
          onclick={() => showShareModal = false}
          class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 transition-colors"
        >
          המשך לדיון
        </button>
      </div>
    </div>
  {/if}

  <!-- הגדרת עמדה ראשונית -->
  {#if isTopicSet && !isFirstPositionSet && isNewNegotiation}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h2 class="text-2xl font-bold mb-4 text-center text-gray-800">הגדר את עמדתך הראשונית</h2>
        <p class="text-gray-600 mb-4 text-center">נושא: <strong>{currentTopic}</strong></p>
        <input 
          bind:value={firstPosition.heading}
          placeholder="כותרת העמדה שלך"
          class="w-full p-3 border rounded mb-4"
        />
        <textarea 
          bind:value={firstPosition.description}
          placeholder="תאר את עמדתך בפירוט..."
          class="w-full p-3 border rounded mb-4 h-32"
        ></textarea>
        <button 
          onclick={setFirstPosition}
          class="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600 transition-colors"
          disabled={!firstPosition.heading.trim() || !firstPosition.description.trim()}
        >
          התחל דיון
        </button>
      </div>
    </div>
  {/if}

  <!-- תצוגת תוצאות -->
  {#if showResults}
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <h2 class="text-2xl font-bold mb-4 text-center text-gray-800">תוצאות הדיון</h2>
        <div class="mb-4">
          <p><strong>נושא:</strong> {currentTopic}</p>
          <p><strong>מספר עמדות:</strong> {points.length}</p>
          <p><strong>רמת הסכמה:</strong> {consensusLevel.toFixed(1)}%</p>
          <p><strong>מרכז הכובד:</strong> {centerOfMass.x.toFixed(1)}%, {centerOfMass.y.toFixed(1)}%</p>
        </div>
        <div class="flex gap-4">
          <button 
            onclick={resetSystem}
            class="flex-1 bg-green-500 text-white p-3 rounded hover:bg-green-600 transition-colors"
          >
            התחל דיון חדש
          </button>
          <button 
            onclick={() => showResults = false}
            class="flex-1 bg-gray-500 text-white p-3 rounded hover:bg-gray-600 transition-colors"
          >
            חזור לתצוגה
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- פאנל מידע עליון -->
  {#if isTopicSet}
  <div class="absolute top-0 left-0 right-0 bg-white bg-opacity-90 p-4 shadow-md z-10">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-gray-800">{currentTopic}</h1>
        <p class="text-sm text-gray-600">סבב {currentRound} מתוך {maxRounds}</p>
        {#if !isNewNegotiation}
          <p class="text-xs text-gray-500">קוד דיון: {negotiationId}</p>
        {/if}
      </div>
      <div class="text-right">
        <p class="text-sm">רמת הסכמה: <span class="font-bold text-green-600">{consensusLevel.toFixed(1)}%</span></p>
        <p class="text-sm">עמדות: {points.length}</p>
        <button 
          onclick={() => { shareUrl = `${window.location.href}`; showShareModal = true; }}
          class="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-1 hover:bg-blue-600"
        >
          שתף
        </button>
      </div>
    </div>
  </div>
  {/if}

  <!-- התצוגה הראשית -->
  <div style="height:100%;width:100%;padding-top:80px;">
    <div
      style="height:100%;width:100%;display:flex;align-items:center;justify-content:center;"
      bind:clientHeight={h}
      bind:clientWidth={w}
    >
      {#key w, points, h}
        <svg style="height:100%;width:100%;" viewBox="{$svg.x} {$svg.y} {$svg.w} {$svg.h}">
          
          <!-- הקו הראשי -->
          <line
            x1={$line.x} y1={$line.y} x2={$line.x2} y2={$line.y2}
            stroke={$line.fill} fill='#fff' width="2" stroke-width="2"
          />
          
          <!-- מרכז הכובד -->
          <circle
            cx={(w/100)*centerOfMass.x}
            cy={(h/100)*centerOfMass.y}
            r="15"
            fill="gold"
            stroke="orange"
            stroke-width="3"
            opacity="0.8"
          />
          <text 
            x={(w/100)*centerOfMass.x} 
            y={(h/100)*centerOfMass.y + 5}
            text-anchor="middle"
            font-size="12"
            fill="black"
            font-weight="bold"
          >מרכז</text>

          <!-- הנקודות -->
          {#each points as point, i}
            <g>
              <!-- העיגול -->
              <circle
                onmouseenter={() => (point.hover = true)}
                onmouseleave={() => (point.hover = false)}
                onclick={() => supportPoint(point.id)}
                role="button"
                tabindex="0"
                class:fill-yellow-200={point.color == "yellow"}
                class:fill-pink-200={point.color == "pink"}
                class:fill-red-200={point.color == "red"}
                class:fill-green-200={point.color == "green"}
                class:fill-blue-200={point.color == "blue"}
                class:fill-gray-200={point.color == "gray"}
                class:fill-indigo-200={point.color == "indigo"}
                class:fill-purple-200={point.color == "purple"}
                r={20 + (point.votes || 0) * 2}
                cx={(w/100)*point.location}
                cy={(h/100)*point.location}
                stroke="black"
                stroke-width="2"
                style="cursor: pointer;"
              />
              
              <!-- מספר התמיכות -->
              <text 
                x={(w/100)*point.location} 
                y={(h/100)*point.location + 5}
                text-anchor="middle"
                font-size="12"
                fill="black"
                font-weight="bold"
              >{point.votes || 0}</text>

              <!-- כרטיס המידע -->
              <foreignObject
                y={((h/100)*point.location)-30}
                x={point.location <= 50 ? ((w/100)*point.location)+40 : ((w/100)*point.location)-200}
                width="200"
                height="120"
              >
                <div
                  role="contentinfo"
                  onmouseenter={() => (point.hover = true)}
                  onmouseleave={() => (point.hover = false)}
                  class="bg-white rounded-lg shadow-lg p-3 border-2"
                  class:border-blue-400={point.hover}
                  class:border-gray-200={!point.hover}
                >
                  <Tile
                    big={point.hover}
                    sm={point.hover}
                    word={point.heading} 
                    bg={point.color || "red"}
                  />
                  <p class="text-xs text-gray-500">תמיכות: {point.voters?.length || 0}</p>
                </div>
              </foreignObject>

              <!-- כפתורי הוספה בין נקודות -->
              {#if points[i + 1] != null}
                <foreignObject
                  x={(w/100)*(point.location + points[i + 1].location)/2 - 25}
                  y={(h/100)*(point.location + points[i + 1].location)/2 - 25}
                  width="50"
                  height="50"
                >
                  <button 
                    onclick={() => addPoint("middle", points.length, point.order)}
                    class="w-full h-full bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg"
                    title="הוסף עמדה כאן"
                  >➕</button>
                </foreignObject>
              {/if}
            </g>
          {/each}

          <!-- כפתורי הוספה בקצוות -->
          <foreignObject
            x={points.length > 2 ? 3*(w/100) : 16*(w/100)}
            y={points.length > 2 ? 3*(h/100) : 16*(h/100)}
            width="50"
            height="50"
          >
            <button 
              onclick={() => addPoint("top", points.length)}
              class="w-full h-full bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors shadow-lg"
              title="הוסף עמדה בראש"
            >⬆️➕</button>
          </foreignObject>

          <foreignObject
            x={points.length > 2 ? 94*(w/100) : 84*(w/100)}
            y={points.length > 2 ? 94*(h/100) : 84*(h/100)}
            width="50"
            height="50"
          >
            <button 
              onclick={() => addPoint("bottom", points.length)}
              class="w-full h-full bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
              title="הוסף עמדה בסוף"
            >⬇️➕</button>
          </foreignObject>
        </svg>
      {/key}
    </div>
  </div>

  <!-- פאנל בקרה תחתון -->
  {#if isTopicSet}
  <div class="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 shadow-md">
    <div class="flex justify-center gap-4">
      <button 
        onclick={startNewRound}
        class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        disabled={currentRound >= maxRounds}
      >
        {currentRound < maxRounds ? `עבור לסבב ${currentRound + 1}` : 'הצג תוצאות'}
      </button>
      <button 
        onclick={resetSystem}
        class="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
      >
        איפוס
      </button>
      <button 
        onclick={() => { shareUrl = `${window.location.href}`; showShareModal = true; }}
        class="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
      >
        שתף דיון
      </button>
    </div>
  </div>
  {/if}
</div>

<style>
  .fill-wow {
    fill: cyan;
  }
  
  /* אנימציות חלקות */
  circle {
    transition: all 0.3s ease;
  }
  
  circle:hover {
    transform: scale(1.1);
  }
  
  button {
    transition: all 0.2s ease;
  }
  
  button:hover {
    transform: scale(1.05);
  }
  
  /* עיצוב מותאם לעברית */
  input, textarea {
    direction: rtl;
    text-align: right;
  }
  
  /* אנימציית טעינה */
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  .animate-spin {
    animation: spin 1s linear infinite;
  }
</style>
