<script>
  import Daterange from './../../celim/ui/daterange.svelte';
  import Crtask from '$lib/components/prPr/tasks/crtask.svelte';
  import Plus from '$lib/celim/plus.svelte';
  import ExpandTask from '$lib/components/prPr/tasks/expandTask.svelte';
  import { mi, skil, ww, role } from './mi.js';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly, slide } from 'svelte/transition';
  import Close from '$lib/celim/close.svelte';
  import SveltyPicker from 'svelty-picker';
  import moment from 'moment';
  import { toast } from 'svelte-sonner';
  import { confettiStore } from '$lib/stores/confettiStore';
  import { onMount, untrack } from 'svelte';
  let myDate = '11:00';
  import MultiSelect from 'svelte-multiselect';
  import { lang } from '$lib/stores/lang.js';
  import Addnewro from '../addnew/addNewRole.svelte';
  import SkillSelector from '../ui/SkillSelector.svelte';
  import tr from '$lib/translations/tr.json';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { quintOut } from 'svelte/easing';
  import Expand from '$lib/celim/icons/expand.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import Button from '$lib/celim/ui/button.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import EditIcon from '$lib/celim/icons/editIcon.svelte';
  import Done from '$lib/celim/icons/done.svelte';
  import NumberInput from '$lib/celim/ui/input/numberInput.svelte';
  import Chooser from '$lib/celim/ui/chooser.svelte';
  import AddPerson from '$lib/celim/icons/addPerson.svelte';
  import LinkIcon from '$lib/celim/icons/linkIcon.svelte';
  import LinkToIcon from '$lib/celim/icons/linkToIcon.svelte';
  import ShiftsIcon from '$lib/celim/icons/shiftsIcon.svelte';
  import MobileModal from '$lib/celim/ui/mobileModal.svelte';
  import { page } from '$app/state';

  let {
    pu = [],
    vallues = [],
    onClose,
    newcontent = true,
    newcontentR = true,
    newcontentW = true,
    pn,
    pl,
    restime,
    id,
    userslength = 0,
    projectId,
    name = '',
    missionTemplates = [],
    processContext = null
  } = $props();
  let miData = $state([
    {
      selectedSkills: [],
      selectedRoles: [],
      selectedWorkways: [],
      descrip: '',
      id: 0,
      missionName: '',
      valph: 50,
      nhours: 1,
      iskvua: false,
      date: null,
      dates: null,
      myM: false,
      rishoni: [],
      publicklinks: ``,
      privatlinks: ``
    }
  ]);

  let error1 = null;
  let roles1 = $state($role);
  let gloading = $state(false);
  onMount(async () => {
    if (id !== 0) {
      gloading = true;
      miData[0].missionName = name;
      miData = miData;
      try {
        const result = await executeAction('getMissionForEdit', {
          missionId: String(id),
          lang: $lang,
        });
        if (result.success && result.data) {
          const d = result.data;
          miData[0].missionName = d.missionName;
          miData[0].descrip = d.descrip;
          miData[0].selectedSkills = d.skillNames;
          miData[0].selectedRoles = d.roleNames;
          miData[0].selectedWorkways = d.workwayNames;
          miData[0].id = parseInt(String(d.missionId), 10);
          miData = miData;
        }
      } catch (e) {
        error1 = e;
      } finally {
        gloading = false;
      }
    } else {
      miData[0].missionName = name;
      miData = miData;
      gloading = false;
    }

    if (id === 0 && name) {
      hydrateFromMissionName(name);
    }
  });

  $effect(() => {
    const nameToHydrate = miData[0].missionName;
    if (nameToHydrate) {
      untrack(() => hydrateFromMissionName(nameToHydrate));
    }
  });

  let lastHydratedValues = $state({
    descrip: '',
    skills: [],
    roles: [],
    workways: []
  });

  function hydrateFromMissionName(value) {
    if (!value) return;
    const template = missionTemplates.find(
      (t) => t.attributes.missionName.trim() === value.trim()
    );
    if (!template) return;

    // Store the template's Mission ID so createMission sends existingMissionId
    // instead of trying to create a duplicate (which hits the unique constraint)
    miData[0].id = parseInt(String(template.id), 10);

    const attributes = template.attributes;

    // Smart update for description
    const templateDescrip = attributes.descrip || '';
    const currentDescrip = miData[0].descrip || '';
    const isDescEmpty =
      !currentDescrip ||
      currentDescrip === '<p></p>' ||
      currentDescrip === '<p><br></p>';

    if (isDescEmpty || currentDescrip === lastHydratedValues.descrip) {
      miData[0].descrip = templateDescrip;
      lastHydratedValues.descrip = templateDescrip;
    }

    // Smart update for skills
    const templateSkills = (attributes.skills?.data || []).map((s) => {
      if ($lang === 'he' && s.attributes.localizations?.data?.[0]) {
        return s.attributes.localizations.data[0].attributes.skillName;
      }
      return s.attributes.skillName;
    });
    if (
      miData[0].selectedSkills.length === 0 ||
      JSON.stringify(miData[0].selectedSkills) ===
        JSON.stringify(lastHydratedValues.skills)
    ) {
      miData[0].selectedSkills = [...templateSkills];
      lastHydratedValues.skills = [...templateSkills];
    }

    // Smart update for roles
    const templateRoles = (attributes.tafkidims?.data || []).map((r) => {
      if ($lang === 'he' && r.attributes.localizations?.data?.[0]) {
        return r.attributes.localizations.data[0].attributes.roleDescription;
      }
      return r.attributes.roleDescription;
    });
    if (
      miData[0].selectedRoles.length === 0 ||
      JSON.stringify(miData[0].selectedRoles) ===
        JSON.stringify(lastHydratedValues.roles)
    ) {
      miData[0].selectedRoles = [...templateRoles];
      lastHydratedValues.roles = [...templateRoles];
    }

    // Smart update for workways
    const templateWorkways = (attributes.work_ways?.data || []).map((w) => {
      if ($lang === 'he' && w.attributes.localizations?.data?.[0]) {
        return w.attributes.localizations.data[0].attributes.workWayName;
      }
      return w.attributes.workWayName;
    });
    if (
      miData[0].selectedWorkways.length === 0 ||
      JSON.stringify(miData[0].selectedWorkways) ===
        JSON.stringify(lastHydratedValues.workways)
    ) {
      miData[0].selectedWorkways = [...templateWorkways];
      lastHydratedValues.workways = [...templateWorkways];
    }
  }

  function find_role_id(role_name_arr) {
    let arr = [];
    for (let j = 0; j < role_name_arr.length; j++) {
      for (let i = 0; i < roles1.length; i++) {
        if (roles1[i].attributes.roleDescription === role_name_arr[j]) {
          arr.push(roles1[i].id);
        }
      }
    }
    return arr;
  }

  function find_workway_id(workway_arr) {
    let arr = [];
    for (let j = 0; j < workway_arr.length; j++) {
      for (let i = 0; i < $ww.length; i++) {
        if ($ww[i].attributes.workWayName === workway_arr[j]) {
          arr.push($ww[i].id);
        }
      }
    }
    return arr;
  }

  function find_user_id(user_name_arr) {
    let id = 0;
    for (let i = 0; i < pu.length; i++) {
      if (pu[i].attributes.username === user_name_arr[0]) {
        id = pu[i].id;
      }
    }
    return id;
  }
  const placeholder = { he: 'סוג המשימה', en: 'mission type' };
  let selected = [];
  const placeholder1 = {
    he: 'בחירת כל הכישורים הרלוונטיים',
    en: 'choose more skills'
  };
  let skills2 = $state($skil);
  let roles = $state($role);
  let selected3;
  const placeholder5 = {
    he: 'בחירת תפקיד',
    en: 'choose mission role'
  };
  const pll = {
    he: 'בחירה של 1',
    en: 'choose FreeMates member'
  };

  function find_skill_id(skill_name_arr) {
    let arr = [];
    for (let j = 0; j < skill_name_arr.length; j++) {
      for (let i = 0; i < skills2.length; i++) {
        if (skills2[i].attributes.skillName === skill_name_arr[j]) {
          arr.push(skills2[i].id);
        }
      }
    }
    return arr;
  }
  async function increment() {
    loading = true;
    const element = miData[0];
    const skills = find_skill_id(element.selectedSkills);
    const work_ways = find_workway_id(element.selectedWorkways);
    const tafkidims = find_role_id(element.selectedRoles);

    let dateStart;
    let dateEnd;
    if (element.date && element.date !== 'undefined' && element.date !== null) {
      dateStart = moment(element.date, 'HH:mm DD/MM/YYYY').toISOString();
    }
    if (element.dates && element.dates !== 'undefined' && element.dates !== null) {
      dateEnd = moment(element.dates, 'HH:mm DD/MM/YYYY').toISOString();
    }

    // Determine assignedUserId:
    //   Branch 2 — multi-user, specific member: send their actual ID
    //   Branch 4 — solo self-assign: send 'self'; server always uses context.userId
    let assignedUserId;
    if (element.myM === true) {
      if (userslength > 1) {
        assignedUserId = String(element.rishon);
      } else {
        assignedUserId = 'self';
      }
    }

    try {
      const result = await executeAction('createMission', {
        projectId: String(projectId),
        existingMissionId: element.id !== 0 ? String(element.id) : undefined,
        missionName: element.missionName,
        descrip: element.descrip,
        skillIds: skills.map(String),
        roleIds: tafkidims.map(String),
        workwayIds: work_ways.map(String),
        vallueIds: (vallues || []).map(String),
        nhours: Number(element.nhours),
        valph: Number(element.valph),
        iskvua: element.iskvua,
        dateStart,
        dateEnd,
        publicklinks: element.publicklinks,
        privatlinks: element.privatlinks,
        spnot: element.spnot,
        assignedUserId,
        checklist: element.checklist || [],
        processId: processContext?.processId ? String(processContext.processId) : undefined,
      });
      if (result.success) {
        handleSuccess(result.data);
      } else {
        loading = false;
        error = true;
        toast.warning(er[$lang]);
      }
    } catch (e) {
      error1 = e;
      loading = false;
      error = true;
    }
  }

  let cencel = ' ביטול';
  let addS = false;
  let rishon = 0;
  let rishonves = 0;

  function shifter(a) {
    if (a == true) {
      isOpen = true;
      console.log('', days);
    }
  }

  async function addW(id, mid, e) {
    if (e) if (e.type === 'add') console.log(id);
    newnew(id);
  }
  let tt = [];

  function addnew(event) {
    const newOb = event.skob;
    const newN = event.skob.attributes.skillName;
    const newValues = skills2;
    newValues.push(newOb);
    skills2 = newValues;
    const mid = event.mid;
    const y = miData.map((c) => c.id);
    const index = y.indexOf(mid);
    miData[index].selectedSkills.push(newN);
    miData = miData;
    mi.set(miData);
  }

  function addnewrole(event) {
    const newOb = event.skob;
    const newN = event.skob.attributes.roleDescription;
    const newValues = roles;
    newValues.push(newOb);
    roles = newValues;
    const mid = event.mid;
    const y = miData.map((c) => c.id);
    const index = y.indexOf(mid);
    miData[index].selectedRoles.push(newN);
    miData = miData;
  }
  //add new workway option
  async function newnew(selectedWorkways) {
    for (let i = 0; i < selectedWorkways.length; i++) {
      if (
        !$ww.map((c) => c.attributes.workWayName).includes(selectedWorkways[i])
      ) {
        try {
          const result = await executeAction('createWorkWay', {
            workWayName: selectedWorkways[i],
          });
          if (result.success && result.data) {
            const newOb = {
              id: result.data.id,
              attributes: { workWayName: result.data.workWayName }
            };
            const newValues = $ww;
            newValues.push(newOb);
            ww.set(newValues);
          }
        } catch (err) {
          console.log('Failed to create workway:', err);
        }
      }
    }
  }
  let searchText = $state(``);

  let isOpen = $state(false);
  const closer = () => {
    isOpen = false;
  };
  let addn = $derived({
    he: `יצירת והוספת: "${searchText}"`,
    en: `Create "${searchText}"`
  });
  const perho = { he: 'לשעה', en: 'per hour' };
  const hourss = { he: 'שעות', en: 'hours' };
  const monhly = { he: 'בחודש', en: 'per month' };
  const total = { he: 'סך הכל', en: 'total' };
  const isshi = {
    he: 'האם זו משימת משמרות?',
    en: 'is it shifts mission? '
  };
  const editsi = {
    he: 'עריכת סידור המשמרות',
    en: 'edit shifts'
  };
  let days = $state([
    {
      name: {
        he: 'ראשון',
        en: 'Sunday'
      },
      id: 1,
      st: '11:00',
      cl: '17:00',
      shiftp: 1,
      shifts: [
        {
          st: '11:00',
          cl: '17:00',
          ii: 1
        }
      ]
    },
    {
      name: {
        he: 'שני',
        en: 'Monday'
      },
      id: 2,
      st: '11:00',
      cl: '17:00',
      shiftp: 1,
      shifts: [
        {
          st: '11:00',
          cl: '17:00',
          ii: 1
        }
      ]
    },
    {
      name: {
        he: 'שלישי',
        en: 'Tuesday'
      },
      id: 3,
      st: '11:00',
      cl: '17:00',
      shiftp: 1,
      shifts: [
        {
          st: '11:00',
          cl: '17:00',
          ii: 1
        }
      ]
    },
    {
      name: {
        he: 'רביעי',
        en: 'Wednesday'
      },
      id: 4,
      st: '11:00',
      cl: '17:00',
      shiftp: 1,
      shifts: [
        {
          st: '11:00',
          cl: '17:00',
          ii: 1
        }
      ]
    },
    {
      name: {
        he: 'חמישי',
        en: 'Thursday'
      },
      id: 5,
      st: '11:00',
      cl: '17:00',
      shiftp: 1,
      shifts: [
        {
          st: '11:00',
          cl: '17:00',
          ii: 1
        }
      ]
    },
    {
      name: {
        he: 'שישי',
        en: 'Friday'
      },
      id: 6,
      st: '11:00',
      cl: '17:00',
      shiftp: 1,
      shifts: [
        {
          st: '11:00',
          cl: '17:00',
          ii: 1
        }
      ]
    },
    {
      name: {
        he: 'שבת',
        en: 'Saturday'
      },
      id: 7,
      st: null,
      cl: null,
      shiftp: 0,
      shifts: []
    }
  ]);
  const headingd = {
    he: 'יום בשבוע',
    en: 'week day'
  };
  const headinga = {
    he: 'שעת פתיחה',
    en: 'opening hour'
  };
  const headingb = {
    he: 'שעת סגירה',
    en: 'closing hour'
  };
  const headingc = {
    he: 'מספר המשמרות',
    en: 'number of shifts'
  };
  const headinge = {
    he: 'שעת פתיחת משמרת',
    en: 'starting hour for shift'
  };
  const headingf = {
    he: 'שעת סגירת משמרת',
    en: 'finishing hour for shift'
  };
  const headingr = {
    he: 'כמה במשמרת הזו',
    en: 'shift partisipant number'
  };
  const iskvua = {
    he: 'האם זו משימה קבועה?',
    en: 'is that a constant mission?'
  };
  const iskvu = {
    he: 'משימה קבועה',
    en: 'constant mission'
  };
  const iskvuFl = {
    he: 'משימה חד פעמית',
    en: 'one time mission'
  };
  const hmh = {
    he: ' כמה שעות זה אמור לקחת בסך הכל?',
    en: 'how many hours should it take?'
  };
  const hms = {
    he: 'כמה שעות בחודש?',
    en: 'how many hours per month'
  };
  const htt = {
    he: 'מספר השעות',
    en: 'number of hours'
  };
  const leho = {
    he: 'לחודש:',
    en: 'per month:'
  };
  const acti = {
    he: 'פרסום',
    en: 'publish'
  };
  const er = {
    he: 'אם הבעיה נמשכת baruch@1lev1.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל  ',
    en: 'error: please try again, if the problem continue contact at baruch@1lev1.com'
  };
  const removeMission = {
    he: 'הסרת המשימה שנבחרה',
    en: 'remove this mission'
  };
  const nama = { he: 'שם', en: 'name' };
  const des = { he: 'תיאור', en: 'decription' };
  let shift = $state([
    {
      ii: 1
    }
  ]);
  let shifts = $state(1);

  function shifterr(o) {
    //todo reduce and adding 2 together, not to mention v a l i d a t i o n
    days[o].shifts.push({
      st: '11:00',
      cl: '17:00',
      ii: 1
    });
    days = days;

    for (let i = 0; i < days.length; i++) {
      if (days[i].shiftp > shifts) {
        shifts = days[i].shiftp;
        shift = [
          ...Array(shifts)
            .fill(0)
            .map((x) => ({
              ii: ''
            }))
        ];
      }
    }
    shift = shift;
    console.log(days, shift);
  }

  function kova() {}
  const nom = {
    he: 'חסר ברשימה, ניתן להוסיפו עם הכפתור "הוספת כישור חדש" למטה',
    en: 'Missing, you can use the "Add new Skill" button bellow to add it'
  };
  const requireSkills = {
    he: 'כישורים נדרשים:',
    en: 'required skills:'
  };
  const checklistH = {
    he: 'רשימת מטלות',
    en: 'checklist'
  };
  const requiredRoles = {
    he: 'הגדרת תפקיד:',
    en: 'role assigned:'
  };
  const requiredWW = {
    he: 'דרכי עבודה מבוקשות:',
    en: 'ways of work for the mission:'
  };
  const cm = {
    he: 'משימות שנבחרו',
    en: 'choosen missions'
  };

  let error = $state(false),
    success = $state(false),
    loading = $state(false);
  const successMsg = {
    he: 'המשימה פורסמה בהצלחה!',
    en: 'Mission published successfully!'
  };

  function handleSuccess(md) {
    loading = false;
    success = true;
    confettiStore.trigger();
    toast.success(successMsg[$lang]);
    onClose?.({ md });
  }

  const tri = tr;
  let wid = $state(0);
  //TODO: כמות לכל משימה עד אינסוף
  let dialog = $state(1);
  let misid = $state(0);
  let itemid = $state(0);
  let editdata = $state(-1);
  function hover() {}
  let dateE = $state(false);
  let descripE = $state(false);
  let missionNameE = $state(id === 0);
  let valphE = $state(false);
  let ske = $state(false);
  let roleE = $state(false);
  let wwe = $state(false);
  let assignE = $state(false);
  let shiftE = $state(false);
  let publinkE = $state(false);
  let mislinkE = $state(false);
  function disout() {}
</script>

<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
  <div
    style="z-index: 700;"
    transition:fly|local={{ y: 450, opacity: 0.5, duration: 1000 }}
  >
    <DialogContent
      aria-label="form"
      class={dialog === 2 ? 'formi' : 'contenti'}
    >
      {#if dialog == 1}
        <div
          style="z-index: 400; overflow-x: auto;"
          dir={$lang == 'he' ? 'rtl' : 'ltr'}
          class="d"
        >
          <button
            class=" hover:bg-barbi text-mturk rounded-full"
            onclick={closer}
            ><Close />
          </button>
          <table
            dir={$lang == 'he' ? 'rtl' : 'ltr'}
            class="d"
            style="overflow-x: auto; font-size: 95%;"
          >
            <caption class="sm:text-right md:text-center text-right">
              <h1 class="md:text-center text-2xl md:text-2xl font-bold">
                {editsi[$lang]}
              </h1>
            </caption>
            <thead>
              <tr class="gg">
                <th class="gg ddd">{headingd[$lang]}</th>
                {#each days as day}
                  <td class="gg" style="font-size: 1rem">{day.name[$lang]}</td>
                {/each}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th class="ddd">{headinga[$lang]}</th>
                {#each days as day}
                  <td
                    ><SveltyPicker
                      inputClasses="form-control"
                      format="hh:ii"
                      bind:value={day.st}
                    ></SveltyPicker>
                  </td>
                {/each}
              </tr>
              <tr>
                <th class="ddd">{headingb[$lang]}</th>
                {#each days as day}
                  <td
                    ><SveltyPicker
                      inputClasses="form-control"
                      format="hh:ii"
                      bind:value={day.cl}
                    ></SveltyPicker></td
                  >
                {/each}
              </tr>
              <tr>
                <th class="ddd">{headingc[$lang]}</th>
                {#each days as day, i}
                  <td>
                    <div dir={$lang == 'he' ? 'rtl' : 'ltr'} class="textinput">
                      <input
                        type="number"
                        id={`shif${i}`}
                        onchange={() => shifterr(i)}
                        name="parti"
                        bind:value={day.shiftp}
                        class="input"
                        required
                      />
                      <label for={`shif${i}`} class="label"
                        >{headingc[$lang]}</label
                      >
                      <span class="line"></span>
                    </div></td
                  >
                {/each}
              </tr>

              {#each shift as shi, t}
                <tr>
                  <th class="ddd">{headinge[$lang]} {t + 1}</th>
                  {#each days as day, i}
                    {#if day.shifts[t] != undefined}
                      <td
                        ><SveltyPicker
                          inputClasses="form-control"
                          format="hh:ii"
                          bind:value={day.shifts[t].st}
                        ></SveltyPicker></td
                      >
                    {:else}
                      <td></td>
                    {/if}
                  {/each}
                </tr>
                <tr>
                  <th class="ddd">{headingf[$lang]} {t + 1}</th>
                  {#each days as day, i}
                    {#if day.shifts[t] != undefined}
                      <td
                        ><SveltyPicker
                          inputClasses="form-control"
                          format="hh:ii"
                          bind:value={day.shifts[t].cl}
                        ></SveltyPicker></td
                      >
                    {:else}
                      <td></td>
                    {/if}
                  {/each}
                </tr>
                <tr>
                  <th class="ddd">{headingr[$lang]} {t + 1}</th>
                  {#each days as day, i}
                    {#if day.shifts[t] != undefined}
                      <td style="font-size: 3rem">
                        <div
                          dir={$lang == 'he' ? 'rtl' : 'ltr'}
                          class="textinput"
                        >
                          <input
                            type="number"
                            id={`part${i}`}
                            name="part"
                            bind:value={day.shifts[t].ii}
                            class="input"
                            required
                          />
                          <label for={`part${i}`} class="label"
                            >{headingr[$lang]}</label
                          >
                          <span class="line"></span>
                        </div>
                      </td>
                    {:else}
                      <td></td>
                    {/if}
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else if dialog === 2}
        <Crtask
          {misid}
          fromMis={true}
          {editdata}
          onAdd={(e) => {
            const data = e.data;
            const id = e.id;
            const isEdit = e.isEdit;
            console.log(isEdit);
            if (!miData[0].checklist) {
              miData[0].checklist = [];
            }
            if (isEdit == true) {
              console.log(':here', itemid);
              miData[0].checklist.splice(itemid, 1);
            }
            miData[0].checklist.push(data);
            miData = miData;
            isOpen = false;
            dialog = 1;
          }}
        />
      {:else if dialog === 3}
        <div
          dir={$lang != 'he' ? 'ltr' : 'rtl'}
          style="  overflow-x: auto; background: linear-gradient(to right, #25c481, #25b7c4);background: -webkit-linear-gradient(left, #25c481, #25b7c4); "
        >
          <ExpandTask
            tasks={itemid != -1
              ? [miData[misid].checklist[itemid]]
              : miData[misid].checklist}
            onAdd={() => (dialog = 2)}
          />
        </div>
      {/if}
    </DialogContent>
  </div>
</DialogOverlay>

<div
  bind:clientWidth={wid}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class=" d sm:pt-4 w-full"
>
  <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
    </div>-->
  <div class=" py-3">
    <div
      class="  bg-transparent rounded-b lg:rounded-b-none lg:rounded-r p-4 leading-normal"
    >
      <div class="mb-8">
        <div class="  mb-2">
          <div class="px-2">
            {#if missionNameE == false}
              <h2
                class="text-barbi text-{$lang == 'en'
                   ? 'left'
                   : 'right'}  font-bold text-xl lg:text-4xl underline"
              >
                {miData[0].missionName}<button
                  onclick={() => (missionNameE = true)}><EditIcon /></button
                >
              </h2>
            {:else}
              <div class="flex flex-col">
                <input
                  type="text"
                  bind:value={miData[0].missionName}
                  list="mission-name-options"
                  class="bg-pink-950/30 border border-gold rounded-xl p-3 text-white focus:border-gold outline-none transition-all shadow-sm"
                />
                <datalist id="mission-name-options">
                  {#each missionTemplates as template (template.id)}
                    <option value={template.attributes.missionName}></option>
                  {/each}
                </datalist>
              </div>
              <button onclick={() => (missionNameE = false)}><Done /></button>
            {/if}
            {#if gloading == false}
              <h3
                class="text-barbi
            text-{$lang == 'en' ? 'left' : 'right'} 
            font-bold text-lg lg:text-2xl underline"
              >
                <mark>{tri?.common?.description[$lang]}:</mark><button
                  onclick={() => (descripE = !descripE)}
                  >{#if descripE}<Done />{:else}<EditIcon />{/if}</button
                >
              </h3>
              {#if descripE}
                <RichText bind:outpot={miData[0].descrip} />
              {:else if miData[0].descrip}
                <RichText
                  outpot={miData[0].descrip}
                  sml={true}
                  editable={false}
                />
              {/if}
            {/if}
            <!----   <h3 class="text-barbi font-bold text-lg lg:text-2xl underline ">
            {tri?.mission?.specialNotes[$lang]}</h3>
    <RichText bind:outpot={miData[0].spnot} editable={spnotE}/>-->

            <p
              style="line-height: 1;"
              class="text-md flex items-center lg:text-2xl {dateE
                ? 'm-0'
                : ' m-5'} lg:m-5"
            >
              <img
                class=" {dateE
                  ? 'hidden'
                  : 'w-6 mx-2'} lg:block lg:w-12 lg:mx-2"
                src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                alt="howmuch"
              />
              <Daterange
                onEdit={() => (dateE = true)}
                onEditStop={() => (dateE = false)}
                dir={$lang == 'he' ? 'rtl' : 'ltr'}
                bind:start={miData[0].date}
                bind:finnish={miData[0].dates}
              />
            </p>
            <div
              class="md:text-xl text-lg md:flex-row {valphE
                ? 'flex-col'
                : ''} justify-start text-barbie flex items-center space-x-2 lg:text-2xl m-5"
            >
              <img
                class="w-12 lg:w-24"
                src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
                alt="howmuch"
              />
              <span class="text-barbie">
                {#if valphE == false}
                  {miData[0].valph.toLocaleString('en-US', {
                    maximumFractionDigits: 2
                  })}
                {:else}
                  <NumberInput bind:value={miData[0].valph} />{/if}
                {perho[$lang]}
              </span><span> ✖ </span><span
                >{#if valphE == false}
                  {miData[0].nhours.toLocaleString('en-US', {
                    maximumFractionDigits: 2
                  })}
                {:else}
                  <NumberInput bind:value={miData[0].nhours} />
                {/if}
                {hourss[$lang]}
                {miData[0].iskvua ? monhly[$lang] : total[$lang]}
              </span> <span> = </span>
              <span
                >{(miData[0].nhours * miData[0].valph).toLocaleString('en-US', {
                  maximumFractionDigits: 2
                })}
                {miData[0].iskvua ? monhly[$lang] : total[$lang]}
              </span>
              {#if valphE}
                <span
                  >{iskvua[$lang]}
                  <Chooser
                    bind:checked={miData[0].iskvua}
                    tr={iskvu}
                    fl={iskvuFl}
                  /></span
                >
              {/if}
              <button onclick={() => (valphE = !valphE)}>
                {#if valphE}<Done />{:else}<EditIcon />{/if}</button
              >
            </div>
            <div class="my-2">
              <mark class="text-barbi text-sm lg:text-2xl"
                >{checklistH[$lang]}:</mark
              >
              {#key miData}
                {#if miData[0].checklist}
                  <ul transition:slide={{ duration: 1000, easing: quintOut }}>
                    {#each miData[0].checklist as datai, t}
                      <li>
                        <div
                          class="flex flex-row space-x-2 items-start border-y-2 border-y-mturk"
                        >
                          <span class="p-1">✅</span>
                          <h2 class="md:text-xl p-1">{datai.shem}</h2>
                          <button
                            class="bg-gold p-0.5 m-0.5 rounded text-barb"
                            onclick={() => {
                              dialog = 3;
                              misid = miData[0].id;
                              itemid = t;
                              isOpen = true;
                            }}
                            title={tri?.mission?.seechecklist[$lang]}
                          >
                            <Expand /></button
                          >

                          <button
                            onclick={() => {
                              dialog = 2;
                              misid = miData[0].id;
                              itemid = t;
                              editdata = datai;
                              isOpen = true;
                            }}
                            class="bg-gold p-0.5 m-0.5 rounded">🖍️</button
                          >
                          <button
                            onclick={() => {
                              miData[0].checklist.splice(t, 1);
                              miData = miData;
                            }}
                            class="bg-gold p-0.5 m-0.5 rounded">✖️</button
                          >
                        </div>
                      </li>
                    {/each}
                  </ul>

                  <button
                    onclick={() => {
                      dialog = 3;
                      misid = miData[0].id;
                      itemid = -1;
                      isOpen = true;
                    }}
                    title={tri?.mission?.seechecklist[$lang]}
                  >
                    <Expand /></button
                  >
                  <!--expand list of items with checkmark as list counter and x for deliting-->
                {/if}
                <button
                  title=" {tri?.mission?.checklistadd[$lang]}"
                  onclick={() => {
                    dialog = 2;
                    misid = miData[0].id;
                    editdata = -1;
                    itemid = -1;
                    isOpen = true;
                  }}><Plus /></button
                >
              {/key}
            </div>
            <div class="my-2">
              <mark class="text-barbi text-sm lg:text-2xl"
                >{requireSkills[$lang]}:</mark
              >
              <button onclick={() => (ske = !ske)}
                >{#if ske}<Done />{:else}<EditIcon />{/if}</button
              >
              {#if !ske}
                {#if miData[0].selectedSkills.length > 0}
                  <div
                    class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 lg:p-4"
                  >
                    {#each miData[0].selectedSkills as skill}
                      <p>
                        <Tile
                          sm={wid > 555 ? true : false}
                          big={wid > 555 ? true : false}
                          pink={true}
                          word={skill}
                        />
                      </p>
                    {/each}
                  </div>
                {/if}
              {:else if page.data.isDesktop}
                <div
                  class="border border-gold flex w-full lg:p-4 flex-row justify-center align-middle p-2"
                >
                  <SkillSelector
                    bind:selectedSkills={miData[0].selectedSkills}
                    placeholder={placeholder1[$lang]}
                    autoCreate={true}
                  />
                </div>
              {:else}
                <MobileModal
                  onClose={() => (ske = false)}
                  bind:isOpen={ske}
                  title={placeholder1[$lang]}
                >
                  <div
                    class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2"
                  >
                    <SkillSelector
                      bind:selectedSkills={miData[0].selectedSkills}
                      placeholder={placeholder1[$lang]}
                      autoCreate={true}
                    />
                    <button onclick={() => (ske = false)}><Done /></button>
                  </div>
                </MobileModal>
              {/if}
            </div>
            <div class="my-2">
              <mark class="text-sm text-barbi lg:text-2xl"
                >{requiredRoles[$lang]}</mark
              >
              <button onclick={() => (roleE = !roleE)}
                >{#if roleE}<Done />{:else}<EditIcon />{/if}</button
              >
              {#if !roleE}
                {#if miData[0].selectedRoles.length > 0}
                  <div
                    class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle d cd p-2"
                  >
                    {#each miData[0].selectedRoles as rol}
                      <p
                        onmouseenter={() =>
                          hover({ he: 'תפקיד מבוקש', en: 'requested role' })}
                        onmouseleave={() => hover('0')}
                        class="m-0"
                        style="text-shadow:none;"
                      >
                        <Tile
                          sm={wid > 555 ? true : false}
                          big={wid > 555 ? true : false}
                          word={rol}
                          wow={true}
                        />
                      </p>
                    {/each}
                  </div>
                {/if}
              {:else if page.data.isDesktop}
                <div
                  class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2"
                >
                  <MultiSelect
                    outerDivClass="!bg-gold !text-barbi"
                    inputClass="!bg-gold !text-barbi"
                    liSelectedClass="!bg-barbi !text-gold"
                    --sms-open-z-index={10000}
                    loading={newcontentR}
                    bind:selected={miData[0].selectedRoles}
                    onchange={() => (miData = miData)}
                    onadd={(event) => console.log(event)}
                    placeholder={placeholder5[$lang]}
                    options={$role.map((c) => c.attributes.roleDescription)}
                  />
                  <Addnewro mid={miData[0].id} onAddnewrole={addnewrole} />
                </div>
              {:else}
                <MobileModal
                  onClose={() => (roleE = false)}
                  bind:isOpen={roleE}
                  title={placeholder5[$lang]}
                >
                  <div
                    class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2"
                  >
                    <MultiSelect
                      outerDivClass="!bg-gold !text-barbi"
                      inputClass="!bg-gold !text-barbi"
                      liSelectedClass="!bg-barbi !text-gold"
                      --sms-open-z-index={10000}
                      loading={newcontentR}
                      bind:selected={miData[0].selectedRoles}
                      onchange={() => (miData = miData)}
                      onadd={(event) => console.log(event)}
                      placeholder={placeholder5[$lang]}
                      options={$role.map((c) => c.attributes.roleDescription)}
                    />
                    <Addnewro mid={miData[0].id} onAddnewrole={addnewrole} />
                    <button onclick={() => (roleE = false)}><Done /></button>
                  </div>
                </MobileModal>
              {/if}
            </div>
            <div class="my-2">
              <mark class="text-sm lg:text-2xl text-barbi"
                >{requiredWW[$lang]}</mark
              >
              <button onclick={() => (wwe = !wwe)}
                >{#if wwe}<Done />{:else}<EditIcon />{/if}</button
              >
              {#if !wwe}
                {#if miData[0].selectedWorkways.length > 0}
                  <div
                    class="border border-gold flex sm:flex-row flex-wrap lg:p-4 justify-center align-middle d cd p-2"
                  >
                    {#each miData[0].selectedWorkways as rol}
                      <p
                        onmouseenter={() =>
                          hover({
                            he: 'דרכי עבודה מבוקשות',
                            en: 'ways of work for the mission'
                          })}
                        onmouseleave={() => hover('0')}
                        class="m-0"
                        style="text-shadow:none;"
                      >
                        <Tile
                          bg="gold"
                          sm={wid > 555 ? true : false}
                          big={wid > 555 ? true : false}
                          word={rol}
                        />
                      </p>
                    {/each}
                  </div>
                {/if}
              {:else if page.data.isDesktop}
                <div
                  class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2"
                >
                  <MultiSelect
                    outerDivClass="!bg-gold !text-barbi"
                    inputClass="!bg-gold !text-barbi"
                    liSelectedClass="!bg-barbi !text-gold"
                    --sms-open-z-index={10000}
                    createOptionMsg={addn[$lang]}
                    allowUserOptions={true}
                    bind:searchText
                    loading={newcontentW}
                    bind:selected={miData[0].selectedWorkways}
                    placeholder={placeholder[$lang]}
                    options={$ww.map((c) => c.attributes.workWayName)}
                    onchange={(e) => {
                      addW(miData[0].selectedWorkways, miData[0].id, e);
                    }}
                  />
                </div>
              {:else}
                <MobileModal
                  onClose={() => (wwe = false)}
                  bind:isOpen={wwe}
                  title={placeholder[$lang]}
                >
                  <div
                    class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2"
                  >
                    <MultiSelect
                      outerDivClass="!bg-gold !text-barbi"
                      inputClass="!bg-gold !text-barbi"
                      liSelectedClass="!bg-barbi !text-gold"
                      --sms-open-z-index={10000}
                      createOptionMsg={addn[$lang]}
                      allowUserOptions={true}
                      bind:searchText
                      loading={newcontentW}
                      bind:selected={miData[0].selectedWorkways}
                      placeholder={placeholder[$lang]}
                      options={$ww.map((c) => c.attributes.workWayName)}
                      onchange={(e) => {
                        addW(miData[0].selectedWorkways, miData[0].id, e);
                      }}
                    />
                    <button onclick={() => (wwe = false)}><Done /></button>
                  </div>
                </MobileModal>
              {/if}
            </div>
            <div>
              {#if assignE}
                {#if userslength > 1}
                  <mark>{tri?.mission?.assingTo[$lang]}</mark>
                  <p>{tri?.mission?.assingHelp[$lang]}</p>
                  <MultiSelect
                    outerDivClass="!bg-gold !text-barbi"
                    inputClass="!bg-gold !text-barbi"
                    liSelectedClass="!bg-barbi !text-gold"
                    --sms-open-z-index={10000}
                    bind:selected={miData[0].rishoni}
                    placeholder={pll[$lang]}
                    options={pu.map((c) => c.attributes.username)}
                    maxSelect={1}
                    onchange={function () {
                      miData[0].rishon = find_user_id(miData[0].rishoni);
                      miData[0].myM = true;
                    }}
                  />
                {:else}
                  <mark>{tri?.mission?.assingToMe[$lang]}</mark>
                  <p>{tri?.mission?.assingHelp[$lang]}</p>
                  <input
                    bind:checked={miData[0].myM}
                    type="checkbox"
                    id="tomeC"
                    name="tome"
                    value="tome"
                    onclick={() => { miData[0].rishon = 'self'; }}
                  />
                  <label for="tome">{tri?.mission?.assingToMe[$lang]}</label>
                {/if}
                <button
                  title={tri?.mission?.assingTo[$lang] +
                    ' ' +
                    tri?.mission?.assingHelp[$lang]}
                  onclick={() => (assignE = !assignE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  ><Done /></button
                >
              {/if}
            </div>
            <div>
              {#if publinkE}
                <mark>{tri?.mission?.publicLinks[$lang]}</mark>
                <TextInput
                  bind:text={miData[0].publicklinks}
                  lebel={tri?.mission?.publicLinks}
                />
                <button
                  onclick={() => (publinkE = !publinkE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  title={tri?.mission?.publicLinks[$lang]}><Done /></button
                >
              {/if}
            </div>
            <div>
              {#if mislinkE}
                <mark>{tri?.mission?.linkToMission[$lang]}</mark>
                <TextInput
                  bind:text={miData[0].privatlinks}
                  lebel={tri?.mission?.linkToMission}
                />
                <button
                  onclick={() => (mislinkE = !mislinkE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  title={tri?.mission?.linkToMission[$lang]}><Done /></button
                >
              {/if}
            </div>
            <div>
              {#if shiftE}
                <input
                  bind:checked={miData[0].isshif}
                  type="checkbox"
                  id="isss"
                  name="is"
                  value="no"
                  onchange={() => shifter(miData[0].isshif)}
                />
                <label for="isss"><mark>{isshi[$lang]}</mark></label>
                {#if miData[0].isshif == true}
                  <button onclick={() => shifter(miData[0].isshif)}
                    >{editsi[$lang]}</button
                  >
                {/if}
                <button
                  onclick={() => (shiftE = !shiftE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  title={isshi[$lang]}><Done /></button
                >
              {/if}
            </div>
            <div
              class="flex flex-row items-center justify-start my-4 space-x-3"
            >
              {#if !publinkE}
                <button
                  onclick={() => (publinkE = !publinkE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  title={tri?.mission?.publicLinks[$lang]}><LinkIcon /></button
                >{/if}
              {#if !assignE}<button
                  title={tri?.mission?.assingTo[$lang] +
                    ' ' +
                    tri?.mission?.assingHelp[$lang]}
                  onclick={() => (assignE = !assignE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  ><AddPerson /></button
                >{/if}
              {#if !mislinkE}<button
                  onclick={() => (mislinkE = !mislinkE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  title={tri?.mission?.linkToMission[$lang]}
                  ><LinkToIcon /></button
                >{/if}
              {#if !shiftE}
                <button
                  onclick={() => (shiftE = !shiftE)}
                  class="w-5 h-5 hover:scale-125 text-mturk rounded-full"
                  title={isshi[$lang]}><ShiftsIcon /></button
                >{/if}
            </div>
            <div class="align-self-end justify-items-end">
              <Button
                text={acti}
                onClick={increment}
                {loading}
                {success}
                {error}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- <div class="dd md:items-center  rounded p-4">
    <div class="body items-center d">
      <table dir={$lang == 'he' ? 'rtl' : 'ltr'}>
      
       
       
         add to server real private link in addition to linkto mission-<tr>
          <th>{tri?.mission?.privatLinks[$lang]}</th>
          {#each miData as data, i}
          <td>
              <div dir="{$lang == "he" ? "rtl" : "ltr"}" class='textinput'>
                  <input type="text"  id="link" name="link"    bind:value={data.privatlinks} class='input' required>
                  <label for="link" class='label'>{tri?.mission?.privatLinks[$lang]}</label>
                  <span class='line'></span>
              </div>
          </td>
          {/each}
      </tr>-->

<!--<tr style="display:none" id="doneC" >
      <th>ביצעתי כבר את המשימה</th>
      {#each miData as data, i}
      <td>
        <input 
        bind:checked={data.done} 
        type="checkbox" id="done" name="done" value="done" onclick={()=> myMissionH()}>
        <label for="done">ביצעתי כבר את המשימה</label>
      </td>
      {/each}
    </tr><tr style="display:none" id="hoursC">
      <th>כמה שעות זה לקח לי? </th>
      {#each miData as data, i}
      <td>        <div dir="{$lang == "he" ? "rtl" : "ltr"}" class='textinput'>
  <input type="number" placeholder="0" id="hours" name="hours"   bind:value={data.nhours} class='input' required>
  <label for="hours" class='label'>כמה שעות זה לקח לי? </label>
  <span class='line'></span>
</div>
      </td>
      {/each}
    </tr><tr style="display:none" id="vallueperhourC">
      <th>כמה שווה שעה? </th>
      {#each miData as data, i}
      <td>
                           <div dir="{$lang == "he" ? "rtl" : "ltr"}" class='textinput'>
  <input type="number"  id="vallueperhour" name="vallueperhour" placeholder="0"
                                           bind:value={data.valph} class='input' required>
  <label for="vallueperhour" class='label'>כמה שווה שעה? </label>
  <span class='line'></span>
</div>
      </td>
      {/each}
  </tr>
      </table>
    </div>
    <div>-->

<!--confety-->

<style>
  .ddd {
    position: sticky;
    right: 1px;
  }

  :global([data-svelte-dialog-content].contenti) {
    background-color: rgba(rgb(247, 250, 36), 0.5);
    width: 90vw;
  }

  @media (min-width: 768px) {
    :global([data-svelte-dialog-content].contenti) {
      width: 90vw;
    }
  }

  :global([data-svelte-dialog-content].formi) {
    background-color: #000000;
    background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
    background-size: 400% 400%;
    -webkit-animation: AnimationName 13s ease infinite;
    -moz-animation: AnimationName 13s ease infinite;
    animation: AnimationName 3s ease infinite;
    width: 80vw;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].formi) {
      background-color: #000000;
      background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
      background-size: 400% 400%;
      -webkit-animation: AnimationName 13s ease infinite;
      -moz-animation: AnimationName 13s ease infinite;
      animation: AnimationName 13s ease infinite;
      width: 50vw;
    }
  }
  textarea::-webkit-resizer {
    border-width: 8px;
    border-style: solid;
    border-color: transparent transparent var(--barbi-pink) var(--barbi-pink);
  }

  .gg {
    position: sticky;
    top: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggd {
    position: sticky;
    bottom: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr {
    position: sticky;
    top: 77px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);
  }

  .ggr:hover,
  .gg:hover,
  .ggd:hover {
    background: var(--barbi-pink);
  }

  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .body {
    overflow-x: auto;
    overflow-y: auto;
    height: 110vh;
    width: 96vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  table,
  th,
  td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
  }

  table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;
  }

  th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }

  td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }

  th:hover {
    background: var(--barbi-pink);
  }

  td:hover {
    background: rgb(132, 241, 223);
  }

  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--barbi-pink);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  #check table {
    table-layout: fixed;
  }
  .tbl-header {
    position: sticky;
    background-color: rgba(255, 255, 255, 0.3);
  }
  .tbl-content {
    max-height: calc(94vh - 173px);
    margin-top: 0px;
    overflow-y: auto;
    overflow-x: hidden;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  #check th {
    padding: 2px 1px;
    text-align: center;
    font-weight: 500;
    font-family: gan, powerr;
    color: #fff;
    text-transform: uppercase;
  }
  #check td {
    padding: 1px;
    text-align: center;
    vertical-align: middle;
    font-weight: 300;
    font-size: 12px;
    color: var(--barbi-pink);
    border-bottom: solid 1px rgba(255, 255, 255, 0.1);
  }
  .label {
    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--barbi-pink);
    user-select: none;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 11px;
    color: #2196f3;
    top: 0;
  }
</style>
