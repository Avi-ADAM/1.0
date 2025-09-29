import { sendToSer } from './../send/sendToSer.js';
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
      // Clean the timers array to only include 'start' and 'stop' properties
      let timers = activeTimer.data.attributes.timers.map(t => ({ start: t.start, stop: t.stop }));
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
  const timersForMutation = timers.map(t => ({
    start: t.start,
    stop: t.stop
}));
const x = await sendToSer({
    timerId: timer.attributes.activeTimer.data.id,
    isActive: false,
    totalHours: newTotal,
    timers: timersForMutation
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
    start: "null",
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

      // Create a clean copy of the timers array with only the properties required by the backend
      const timers = timer.attributes.timers.map((t, i) => {
        if (i === index) {
          // For the updated timer, use the new data
          return { start: newLap.start, stop: newLap.stop };
        }
        // For all other timers, just keep their start and stop times
        return { start: t.start, stop: t.stop };
      });

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
          body: JSON.stringify({ query, variables })
        });
        const result = await res.json();
        timer = result.data.updateTimer.data;
        intervals = timer.attributes.timers;
        accumulatedTime = newTotal;
      }
    }
  }
/**
 * מחשב את סך כל השעות מתוך מערך של timers
 * @param {Array} timers - מערך של אובייקטי timers עם start ו-stop
 * @returns {number} - סך כל השעות שהצטברו
 */
export function calculateTotalHours(timers) {
  if (!timers || !Array.isArray(timers) || timers.length === 0) {
    return 0;
  }
  
  let totalMilliseconds = 0;
  
  // עובר על כל הרשומות במערך ומחשב את הזמן הכולל
  for (const timerEntry of timers) {
    if (timerEntry.start && timerEntry.stop) {
      // חישוב הזמן בין ההתחלה לסיום במילישניות
      const startTime = new Date(timerEntry.start).getTime();
      const stopTime = new Date(timerEntry.stop).getTime();
      
      if (!isNaN(startTime) && !isNaN(stopTime) && stopTime > startTime) {
        totalMilliseconds += (stopTime - startTime);
      }
    }
  }
  
  // המרה משניות לשעות (חלוקה ב-3600000 מילישניות בשעה)
  return totalMilliseconds / 1000 / 60 / 60;
}

/**
 * שומר את הטיימר ומעדכן את המשימה בתהליך עם השעות החדשות
 * @param {Object} timer - אובייקט הטיימר
 * @param {string} missionID - מזהה המשימה בתהליך
 * @param {Function} fetch - פונקציית fetch לביצוע קריאות רשת
 * @param {boolean} [isSer=false] - האם מדובר בקריאת שרת
 * @param {Array} [tasks=null] - מערך של מזהי מטלות לקישור לטיימר (אופציונלי)
 * @returns {Promise<Object>} - אובייקט עם התוצאות של עדכון הטיימר והמשימה בתהליך
 */
export async function saveTimer(timer, missionID, fetch, isSer=false, tasks=null) {
  try {
    if (!timer || !missionID) {
      console.error("חסרים פרמטרים לשמירת הטיימר");
      return null;
    }

    // שלב 1: עדכן את הטיימר להיות במצב "נשמר" ואם יש מטלות, קשר אותן לטיימר
    const updateParams = {
      timerId: timer.attributes.activeTimer.data.id,
      isActive: false,
      saved: true
    };

    // אם יש מטלות, הוסף אותן לפרמטרים של העדכון
    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
      updateParams.tasks = tasks.map(taskId => taskId.toString());
      console.log("מקשר מטלות לטיימר:", updateParams.tasks);
    }

    const timerUpdateResponse = await sendToSer(
      updateParams,
      '34UpdateTimer',
      null,
      null,
      isSer,
      fetch
    );
    
    console.log("טיימר סומן כנשמר:", timerUpdateResponse.data);
    
    // שלב 2: חשב את כמות השעות המצטברת מהטיימר
    // אפשרות 1: לקחת את ערך totalHours מהטיימר (כפי שחושב על ידי השרת)
    let totalHours = timer.attributes.activeTimer.data.attributes.totalHours || 0;
    
    // אפשרות 2: לחשב מחדש את הזמן הכולל מתוך מערך ה-timers
    // במקרה שאנחנו לא סומכים על ערך totalHours או רוצים לוודא את דיוק החישוב
    if (timer.attributes.activeTimer.data.attributes.timers && Array.isArray(timer.attributes.activeTimer.data.attributes.timers)) {
      const calculatedHours = calculateTotalHours(timer.attributes.activeTimer.data.attributes.timers);
      
      // אם יש הבדל משמעותי בין החישובים, הדפס אזהרה
      if (Math.abs(calculatedHours - totalHours) > 0.01) {
        console.warn(
          `אזהרה: הבדל בחישוב השעות - 
           totalHours מהטיימר: ${totalHours}, 
           חישוב מתוך מערך ה-timers: ${calculatedHours}`
        );
      }
      
      // בחר את הערך המדויק יותר (אפשר להחליט להשתמש תמיד בחישוב המקומי)
      totalHours = calculatedHours;
    }

    
    let currentHours = 0;
    
    try {
      // בדיקה אם יש לנו כבר את השעות הקיימות בתוך הטיימר
      if (timer.attributes.hasOwnProperty('howmanyhoursalready')) {
        currentHours = timer.attributes.howmanyhoursalready || 0;
        console.log("נמצאו שעות קיימות בטיימר:", currentHours);
      } else {
        // אם אין, ננסה לקבל את זה מהשרת
        // (אפשר גם לא להשתמש בזה ופשוט להסתמך על מה שיש בשרת)
        console.log(`נדרש לבדוק שעות קיימות למשימה ${missionID}`);
      }
    } catch (e) {
      console.warn("שגיאה בקבלת שעות קיימות:", e);
    }
    
    // הוסף את השעות החדשות לשעות הקיימות
    const totalHoursToSave = totalHours + currentHours;
    console.log(`סך הכל שעות לשמירה: ${totalHoursToSave} (${totalHours} חדשות + ${currentHours} קיימות)`);
    
    // שלב 3: עדכן את המשימה בתהליך - הוסף את השעות לשעות הקיימות ואפס את הטיימר הפעיל
    const missionUpdateResponse = await sendToSer(
      {
        mId: missionID,
        howmanyhoursalready: totalHoursToSave,
        stname: "saved", 
        x: 0,
      },
      '11saveTimer',
      null,
      null,
      isSer,
      fetch
    );
    
    console.log("משימה עודכנה עם שעות חדשות:", missionUpdateResponse.data);
    
    return {
      timer: timerUpdateResponse.data?.updateTimer?.data || null,
      mission: missionUpdateResponse.data?.updateMesimabetahalich?.data || null
    };
  } catch (error) {
    console.error("שגיאה בשמירת הטיימר:", error);
    return null;
  }
}
