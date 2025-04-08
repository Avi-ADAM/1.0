<script context="module">
  import { sendToSer } from '$lib/send/sendToSer.svelte';
    // Function to start (or resume) the timer for a mission
    /**
     * Starts a timer for tracking activities
     * @param {Object} activeTimer - The active timer object to be started
     * @param {string} missionID - The ID of the mission associated with the timer
     * @param {string} uId - User ID
     * @param {string} pId - Project ID
     * @param {number} [timerId=0] - Optional timer ID, defaults to 0
     * @param {boolean} [isSer=false] - Flag indicating if this is a server operation, defaults to false
     * @param {Function} fetch - Fetch function for making HTTP requests
     * @returns {Promise<void>}
     */
    export async function startTimer(activeTimer,missionID,uId,pId,timerId=0,isSer=false,fetch) {
    // Ensure we have the mission data
    console.log(activeTimer,missionID,uId,pId,timerId,isSer);

   
    // Case 1: No active timer exists – create one
    if (timerId == 0) {
      const x = await sendToSer({missionId: missionID, start:new Date().toISOString(), userId:uId, projectId: pId},'33CreateTimer',null,null,isSer,fetch).then((x) => {
        console.log("Created new timer:", x.data);
        return x.data.createTimer.data;
      });
      return x;
      }else if (timerId != 0 && activeTimer.data.attributes && !activeTimer.data.attributes.isActive) {
      //get old timers json and update it with the new start time
      let timers = activeTimer.data.attributes.timers;
      timers.push({ start: new Date().toISOString() }); 
      const x = await sendToSer({timerId: timerId,isActive: true, newStart: new Date().toISOString(), timers: timers},'34UpdateTimer',null,null,isSer,fetch).then((x) => {
        console.log("Resumed timer:", x.data);
        return x.data.updateTimer.data;
      });
      return x;
    }else {
      console.log("Timer is already active");
      return activeTimer.data;
    }
  }
 

  // פונקציה לשליפת נתוני המשימה והטיימר
  async function fetchMission() {
    const query = `
      query GetMissionsOnProgress($id: ID!) {
        usersPermissionsUser(id: $id) {
          data {
            attributes {
              mesimabetahaliches(filters: { finnished: { ne: true }, forappruval: { ne: true } }) {
                data {
                  id
                  attributes {
                    name
                    howmanyhoursalready
                    activeTimer {
                      data {
                        id
                        attributes {
                          start
                          totalTime
                          isActive
                          timers {
                            start
                            stop
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
    const variables = { id: userId };
    const res = await fetch('/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const { data } = await res.json();
    // מציאת המשימה הרלוונטית לפי missionId – התאימו לפי מבנה הנתונים שלכם
    const missions = data.usersPermissionsUser.data.attributes.mesimabetahaliches.data;
    let  mission = missions.find((m /** @type any*/) => m.id === missionId);

    // אם קיימת הפעלה קודמת, מאתחלים את הטיימר
    if (mission) {
      timer = mission.attributes.activeTimer?.data;0
      if (timer) {rotate(90)
        accumulatedTime = timer.attributes.totalTime || 0;
        intervals = timer.attributes.timers || [];
      }
    }
  }


  // עצירת הטיימר: מסיימים את האינטרוול הפעיל ומעדכנים את הזמן המצטבר
 export async function stopTimer(timer,fetch,isSer=false) {
  console.log(timer);
    if (timer && timer.attributes.isActive) {
      const now = new Date().toISOString();
      let intervals = timer.attributes.timers;
      // נניח שהאינטרוול הפעיל הוא האחרון במערך
      const lastInterval = intervals[intervals.length - 1];
      console.log(lastInterval);
      if (lastInterval ) {//&& !lastInterval.stop
        const startTime = new Date(lastInterval.start);
        const stopTime = new Date(now);
        intervals[intervals.length - 1].stop = now;
        // חישוב משך הזמן באינטרוול (בשעות)
        const duration = (stopTime.getTime() - startTime.getTime()) / 1000 / 60 / 60;
        let accumulatedTime = timer.attributes.totalHours || 0;
        // עדכון הזמן המצטבר
        accumulatedTime += duration;

        const response = await sendToSer(
        {
          timerId: timer.id,
          isActive: false, 
          totalHours: accumulatedTime, 
          timers: intervals
        },
        '34UpdateTimer',
        null,
        null,
        isSer,
        fetch
      );
      
      console.log("Stopped timer:", response.data);
      return response.data.updateTimer.data;
    }
    }
  }
  export async function handleClearSingle(index, timer,fetch,isSer=false) {
  let timers = [...timer.attributes.activeTimer.data.attributes.timers];
  let total = timer.attributes.activeTimer.data.attributes.totalTime;
  let newTotal = total - (timers[index].stop - timers[index].start);
  timers.splice(index, 1);

const x = await sendToSer({
    timerId: timer.attributes.activeTimer.data.id,
    isActive: false,
    totalHours: newTotal,
    timers
  },'34UpdateTimer',null,null,isSer,fetch).then((x) => {
    console.log("Updated timer:", x.data);
    return x.data.updateTimer.data;
  });
  return x;
}

export async function handleClearAll(timer,fetch,isSer=false) {

const x = await sendToSer({
    timerId: timer.attributes.activeTimer.data.id,
    isActive: false,
    totalHours: 0,
    timers: []
  },'34UpdateTimer',null,null,isSer,fetch).then((x) => {
    console.log("Updated timer:", x.data);
    return x.data.updateTimer.data;
  });
  return x;
}

export async function updateTimer(timer,whatToUpdate,params= {},fetch,isSer=false) {
  // Update the timer in your backend
  switch (whatToUpdate) {
    case 'timers':

    const oldLap = params.oldLap;
      const newLap = params.newLap;
      const index = params.index;

      // Create a clean copy of the timers array without frontend-only fields
      let timers = [...timer.attributes.timers].map((t) => {
        const { isEditing, editStart, editStop, ...cleanTimer } = t; // Remove unnecessary fields
        return cleanTimer;
      });

      // Update the specific timer entry
      timers[index] = { ...timers[index], start: newLap.start, stop: newLap.stop };

      // Calculate the new total time
      const totalTime =
        timer.attributes.totalHours -
        ((new Date(oldLap.stop).getTime() - new Date(oldLap.start).getTime())  / 1000 / 60 / 60) +
        ((new Date(newLap.stop).getTime() - new Date(newLap.start).getTime() ) / 1000 / 60 / 60) ;
      console.log('Total time:', totalTime);
      console.log('Timers:', timers);
      // Send the updated data to the backend
      const response = await sendToSer(
        {
          timerId: timer.id,
          isActive: timer.attributes.isActive,
          totalHours: totalTime,
          timers, // Send the cleaned timers array
        },
        '34UpdateTimer',
        null,
        null,
        isSer,
        fetch
      ).then((x) => {
        console.log('Updated timer:', x.data);
        return x.data.updateTimer.data;
      });

      return response;
    case 'tasks':
      //make the arr to be of string instead of numbers
      const tasksArr = params.selectedTaskIds.map((x) => x.toString());
            // Send the updated data to the backend
        const responseT = await sendToSer(
        {
          timerId: timer.id,
          tasks: tasksArr
        },
        '34UpdateTimer',
        null,
        null,
        isSer,
        fetch
      ).then((x) => {
        console.log('Updated timer:', x.data);
        return x.data.updateTimer.data;
      });

      return responseT;
      break;
  }
}
  // ניקוי האינטרוול האחרון: מסירים את ההפעלה האחרונה ומעדכנים את הזמן הכולל
  async function clearLastInterval() {
    // ניתן לבצע ניקוי רק אם הטיימר במצב עצור ויש לפחות אינטרוול אחד שסיים את הפעולה
    if (timer && !timer.attributes.isActive && intervals.length > 0) {
      const lastInterval = intervals[intervals.length - 1];
      if (lastInterval && lastInterval.start && lastInterval.stop) {
        const startTime = new Date(lastInterval.start);
        const stopTime = new Date(lastInterval.stop);
        const duration = (stopTime.getTime() - startTime.getTime()) / 1000;
        const newTotal = accumulatedTime - duration;

        // הנחה: יש לכם מוטציה שמסירה את האינטרוול האחרון (למשל באמצעות פעולת pop)
        const mutation = `
          mutation ClearLastInterval($timerId: ID!, $newTotal: Float!) {
            updateTimer(id: $timerId, input: {
              data: {
                totalTime: $newTotal,
                timers: {
                  pop: {}
                }
              }
            }) {
              data {
                id
                attributes {
                  totalTime
                  timers {
                    start
                    stop
                  }
                }
              }
            }
          }
        `;
        const variables = {
          timerId: timer.id,
          newTotal
        };
        const res = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: mutation, variables })
        });
        const result = await res.json();
        timer = result.data.updateTimer.data;
        intervals = timer.attributes.timers;
        accumulatedTime = newTotal;
      }
    }
  }
export function saveTimer(){
          let newHours = mission.data.howmanyhoursalready + accumulatedTime;
          const y = sendToSer({mId: mission.data.id,howmanyhoursalready: newHours
          },'11saveTimer',null,null,isSer,fetch ).then((y) => {
            console.log("Stopped timer:", y.data);
          });
}
</script>

