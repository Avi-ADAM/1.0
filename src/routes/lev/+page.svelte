<script>
    import {nutifi } from '$lib/func/nutifi.svelte'
    import Yahalomim from '$lib/components/lev/yahalomim.svelte'
import { addToast } from 'as-toast';
import Mesima from '$lib/components/lev/mesima.svelte'
import {sendEror} from '$lib/func/sendEror.svelte'
import {
    betha
} from '../../lib/components/lev/storess/betha.js'
import {
    RingLoader
} from 'svelte-loading-spinners'
import Cardsui from '../../lib/components/lev/cards/cards.svelte'
import Tooltip from './../../lib/celim/tooltip.svelte';
import Coinsui from "../../lib/components/lev/coinui.svelte"
import {
    onMount
} from 'svelte';
import {
    goto
} from '$app/navigation';
import {
    isEqual
} from 'lodash';
import Rikma from '../../lib/components/lev/rikma.svelte'
import Hevel from '../../lib/components/lev/hevel.svelte'
import {
    DialogOverlay,
    DialogContent
} from 'svelte-accessible-dialog';
import {
    fly
} from 'svelte/transition';
import Levchat from '../../lib/components/lev/levchat.svelte'
import {
    lang,
    doesLang,
    langUs
} from '$lib/stores/lang.js'

let low = true;

let isOpen = false;
//  import Viewport from 'svelte-viewport-info'
let idL;
let meData = [];
let miData = [];
let token;
let askedarr = [];
let declineddarr = [];
let d = [];
let sk = [];
let dictids = {};
let dictasked = [];
let askedcoin = [];
let error1 = null;
let mtaha = [];
let pmashd = 17;
let mashs = 17;
let maap = 13;
let sug = 13
let pen = 13
let ask = 13;
let halu = 1;
let wel = 17;
let askma = 13;
let beta = 13
let des = 17
let fia = 17;
let fiapp = [];
let askedm = [];
let askm = 17;
let ma = 13;
let wegets = [];
let arr1 = []

function close() {
    if (mode !== 4) {
        isOpen = false;
    }
}
let eizeish, eizep
let mode = 0;

function user(event) {
    isOpen = false
    eizeish = event.detail.id
    mode = 1
    isOpen = true
}

function chat(event) {
    isOpen = false
    //eizeish = event.detail.id
    mode = 3
    isOpen = true
}

function proj(event) {
    isOpen = false
    eizep = event.detail.id
    mode = 2
    isOpen = true
}
let eizeme;
function mesima(event) {
    isOpen = false
    eizeme = event.detail.id
    mode = 5
    isOpen = true
}
function txx(na){
  let tx = 680
  if (na.length < 10 ){
    tx = 440
  } else if (na.length < 20){ 
    tx = 580
  } else if (na.length < 28){ 
    tx = 680
  } else if (na.length > 28){ 
    tx = 780
  }
  return (tx)
}
function mesimabetahalicha(data) {
    const mtahan = data.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data;
   
    for (let i = 0; i < mtahan.length; i++) {
        mtaha[i] = {...mtahan[i].attributes};
            mtaha[i].id = mtahan[i].id
            mtaha[i].tx = txx(mtahan[i].attributes.name)
            mtaha[i].ani = "mtaha"
            mtaha[i].azmi = "mesima"      
            mtaha[i].pl = 0 + i
            mtaha[i].usernames = data.data.usersPermissionsUser.data.attributes.username
            mtaha[i].noofpu = getProjectData(mtahan[i].attributes.project.data.id,"noof")
            mtaha[i].projectName = getProjectData(mtahan[i].attributes.project.data.id,"pn")
            mtaha[i].src = getProjectData(mtahan[i].attributes.project.data.id,"pp")
       
        }
            mtaha = mtaha

    beta = mtaha.length;
    localStorage.setItem("beta", beta);
    if (!isEqual(mtaha, mtahaold) && counter > 1) {
        if (mtahaold.length < mtaha.length) {
            const usernames =  data.data.usersPermissionsUser.data.attributes.username;
            const rikn = getProjectData(mtaha[mtaha.length - 1].project.data.id,"pn")
            let text = `שלום ${usernames} !יש לך משימה חדשה לביצוע ברקמת ${rikn}`;
            let linkop = "lev"      
            nutifi("1💗1 משימה חדשה",text,linkop )
        }
    }

}

function gvots(data) {
    for (let k = 0; k < data.length; k++) {
        const x = data[k].users //בעיה לפעמים זה vots
        data[k].uids = [];
        for (let z = 0; z < x.length; z++) {
            data[k].uids.push(x[z].users_permissions_user.id);
            data[k].what = [];
            data[k].what.push(x[z].what);
        }
    }

    for (let t = 0; t < data.length; t++) {
        const allid = data[t].uids;
        const myid = data[t].myid;
        data[t].already = false;
        data[t].noofusersOk = 0;
        data[t].noofusersNo = 0;
        data[t].whyno = [];
        data[t].whyes = [];
        data[t].mypos = null;
        if (allid.includes(myid)) {
            data[t].already = true;
            data[t].pl = 20;
            for (let l = 0; l < data[t].users.length; l++) {
                if (data[t].users[l].users_permissions_user.id === myid)
                    fiapp[t].mypos = fiapp[t].users[l].what;
            }
        }

        for (let r = 0; r < fiapp[t].users.length; r++) {
            if (fiapp[t].users[r].what === true) {
                fiapp[t].noofusersOk += 1;
                fiapp[t].whyes.push(fiapp[t].users[r].why)
            } else if (fiapp[t].users[r].what === false) {
                fiapp[t].noofusersNo += 1;
                fiapp[t].whyno.push(fiapp[t].users[r].why)
            }
        }

        const noofusersWaiting = fiapp[t].noof - fiapp[t].users.length;
        fiapp[t].noofusersWaiting = noofusersWaiting;
    }
}

function ishursium(dati) {
    const start = dati.data.usersPermissionsUser.data.attributes.projects_1s.data
    const myid = dati.data.usersPermissionsUser.data.id;
    for (let i = 0; i < start.length; i++) {
        for (let j = 0; j < start[i].attributes.finiapruvals.data.length; j++) {
            const rt = letters(start[i].attributes.finiapruvals.data[j].attributes.missname);
            let src22 = getProjectData(start[i].id,"upic",start[i].attributes.finiapruvals.data[j].attributes.users_permissions_user.data.id);
           console.log(start[i].attributes.finiapruvals.data[j].attributes.users_permissions_user.data.id)
            fiapp.push({
                uid: start[i].attributes.finiapruvals.data[j].attributes.users_permissions_user.data.id,
                username: getProjectData(start[i].id,"un",start[i].attributes.finiapruvals.data[j].attributes.users_permissions_user.data.id),
                src: src22,
                hearotMeyuchadot: start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich.data.attributes.hearotMeyuchadot,
                missionDetails: start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich.data.attributes.descrip,
                nhours: start[i].attributes.finiapruvals.data[j].attributes.noofhours,
                mId: start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich.data.id,
                perhour: start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich.data.attributes.perhour,
                missId: start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich.data.attributes.mission.data.id,
                // deadline: start[i].asks[j].open_mission.sqadualed,
                openName: start[i].attributes.finiapruvals.data[j].attributes.missname,
                omid: start[i].attributes.finiapruvals.data[j].id,
                askId: start[i].attributes.finiapruvals.data[j].id,
                why: start[i].attributes.finiapruvals.data[j].attributes.why,
                whatt: start[i].attributes.finiapruvals.data[j].attributes.what,
                users: start[i].attributes.finiapruvals.data[j].attributes.vots,
                name: rt[0],
                stylef: rt[1],
                st: rt[2],
                projectId: start[i].attributes.finiapruvals.data[j].attributes.project.data.id,
                projectName: getProjectData(start[i].id,"pn"),
                noof: getProjectData(start[i].id,"noof"),
                src2: getProjectData(start[i].id,"pp"),
                myid: myid,
                ani: "fiapp",
                azmi: "ishrur",
                pl: -2
            });
        }
  console.log("ishursium",fiapp)
    }
    for (let k = 0; k < fiapp.length; k++) {
        const x = fiapp[k].users
        fiapp[k].uids = [];
        for (let z = 0; z < x.length; z++) {
            fiapp[k].uids.push(x[z].users_permissions_user.data.id);
            fiapp[k].what = [];
            fiapp[k].what.push(x[z].what);
        }
    }

    for (let t = 0; t < fiapp.length; t++) {
        const allid = fiapp[t].uids;
        const myid = fiapp[t].myid;
        fiapp[t].already = false;
        fiapp[t].noofusersOk = 0;
        fiapp[t].noofusersNo = 0;
        fiapp[t].whyno = [];
        fiapp[t].whyes = [];
        fiapp[t].mypos = null;
        if (allid.includes(myid)) {
            fiapp[t].already = true;
            fiapp[t].pl += 20;

            for (let l = 0; l < fiapp[t].users.length; l++) {
                if (fiapp[t].users[l].users_permissions_user.id === myid)
                    fiapp[t].mypos = fiapp[t].users[l].what;
            }
        }

        for (let r = 0; r < fiapp[t].users.length; r++) {
            if (fiapp[t].users[r].what === true) {
                fiapp[t].noofusersOk += 1;
                fiapp[t].whyes.push(fiapp[t].users[r].why)
            } else if (fiapp[t].users[r].what === false) {
                fiapp[t].noofusersNo += 1;
                fiapp[t].whyno.push(fiapp[t].users[r].why)
            }
        }

        const noofusersWaiting = fiapp[t].noof - fiapp[t].users.length;
        fiapp[t].noofusersWaiting = noofusersWaiting;
    }
    fiapp = fiapp
    fia = fiapp.length;
    localStorage.setItem("fia", fia);
    //createD()
}

function crMaap(hh) {
    const start = hh.data.usersPermissionsUser.data.attributes.projects_1s.data
    const myid = hh.data.usersPermissionsUser.data.id;
    for (let i = 0; i < start.length; i++) {
        if (start[i].attributes.maaps.data) {
            for (let j = 0; j < start[i].attributes.maaps.data.length; j++) {
                if (start[i].attributes.maaps.data.length > 0) {
                    const rt = letters(start[i].attributes.maaps.data[j].attributes.sp.data.attributes.name);
                    const y = start[i].attributes.maaps.data[j].attributes
                    const v = y.sp.data.attributes
                    let src27 = ""
                    if (v.users_permissions_user.data.attributes.profilePic.data != null){
                        src27 = v.users_permissions_user.data.attributes.profilePic.data.attributes.formats.thumbnail.url
                    }
                    wegets.push({
                        uid: v.users_permissions_user.data.id,
                        username: v.users_permissions_user.data.attributes.username,
                        src: src27,
                        myp: v.myp,
                        spid: y.sp.data.id,
                        omid: y.open_mashaabim.data.id,
                        askId: start[i].attributes.maaps.data[j].id,
                        users: y.vots,
                        hm: v.unit,
                        openName: v.name,
                        easy: y.open_mashaabim.data.attributes.easy,
                        price: y.open_mashaabim.data.attributes.price,
                        sqadualed: y.open_mashaabim.data.attributes.sqadualed,
                        sqadualedf: y.open_mashaabim.data.attributes.sqadualedf,
                        spnot: y.open_mashaabim.data.attributes.spnot,
                        kindOf: y.open_mashaabim.data.attributes.kindOf,
                        name: rt[0],
                        stylef: rt[1],
                        st: rt[2],
                        projectId: start[i].id,
                        projectName: getProjectData(start[i].id,"pn"),
                        noof: getProjectData(start[i].id,"noof"),
                        src2: getProjectData(start[i].id,"pp"),
                        myid: myid,
                        ani: "wegets",
                        azmi: "ishrur",
                        pl: -1 + y.vots.length
                    });
                }
            }
        }
    }
    console.log("a")
    for (let k = 0; k < wegets.length; k++) {
        const x = wegets[k].users
        wegets[k].uids = [];
        for (let z = 0; z < x.length; z++) {
            wegets[k].uids.push(x[z].users_permissions_user.id);
            wegets[k].what = [];
            wegets[k].what.push(x[z].what);
        }
    }
    for (let t = 0; t < wegets.length; t++) {
        const allid = wegets[t].uids;
        const myid = wegets[t].myid;
        wegets[t].already = false;
        wegets[t].noofusersOk = 0;
        wegets[t].noofusersNo = 0;
        wegets[t].whyno = [];
        wegets[t].whyes = [];
        wegets[t].mypos = null;
        if (allid.includes(myid)) {
            wegets[t].already = true;
            for (let l = 0; l < wegets[t].users.length; l++) {
                if (wegets[t].users[l].users_permissions_user.data.id === myid)
                    wegets[t].mypos = wegets[t].users[l].what;
            }
        }

        for (let r = 0; r < wegets[t].users.length; r++) {
            if (wegets[t].users[r].what === true) {
                wegets[t].noofusersOk += 1;
                wegets[t].whyes.push(wegets[t].users[r].why)
            } else if (wegets[t].users[r].what === false) {
                wegets[t].noofusersNo += 1;
                wegets[t].whyno.push(wegets[t].users[r].why)
            }
        }

        const noofusersWaiting = wegets[t].noof - wegets[t].users.length;
        wegets[t].noofusersWaiting = noofusersWaiting;

    }
    wegets = wegets
    maap = wegets.length;
    localStorage.setItem("maap", maap);
}
let orech;
let adder = [];
let check;
let wi = 125

function createD() {
    //  console.log('Viewport Width x Height:     ',Viewport.Width+'x'+Viewport.Height)
    //     if (Viewport.Width >= 1640){
    //        check = 15
    //    } else if (Viewport.Width >= 1240){
    //        check = 12
    //    } else if (Viewport.Width >= 950){
    //        check = 9
    //    } else {
    //        check = 6
    //    }
    //    if (Viewport.Height >= 840 && Viewport.Height < 1040){
    //     if (Viewport.Width >= 1640){
    //        check = 25
    //    } else if (Viewport.Width >= 1240){
    //        check = 20
    //    } else if (Viewport.Width >= 950){
    //        check = 15
    //    } else {
    //        check = 10
    //    }
    //    } else if (Viewport.Height >= 1040){
    //      if (Viewport.Width >= 1640){
    //        check = 35
    //    } else if (Viewport.Width >= 1240){
    //        check = 28
    //    } else if (Viewport.Width >= 950){
    //        check = 21
    //    } else {
    //        check = 14
    //    }  
    //    }
    //    if (Viewport.Width >= 550){
    //        wi = 75;
    //    }
    check = 4
    orech = arr1.lenght;
    if (orech < check && adder.length === 0) {
        for (let i = orech; i < check; i++) {
            adder.push(
                `<svg class="svggg" viewBox="0 0 100 100" >
  <circle fill="none" id="d" cx="50" cy="50" r="50"/>
 </svg>`
            )
        }
        adder = adder
    }
}
async function createasked(da) {
    const start = da.data.usersPermissionsUser.data.attributes.projects_1s.data
    for (let i = 0; i < start.length; i++) {
        console.log(start[i])
        for (let j = 0; j < start[i].attributes.asks.data.length; j++) {
            const rt = letters(start[i].attributes.asks.data[j].attributes.open_mission.data.attributes.name);
            let src21 = getProjectData(start[i].attributes.asks.data[j].attributes.project.data.id,"pp");
            let src22 = "";
            if (start[i].attributes.asks.data[j].attributes.users_permissions_user.data.attributes.profilePic.data !== null) {
                src22 = start[i].attributes.asks.data[j].attributes.users_permissions_user.data.attributes.profilePic.data.attributes.formats.thumbnail.url ?? "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"
            }
            let t = start[i].attributes.asks.data[j].attributes
            dictasked.push({
                uid: t.users_permissions_user.data.id,
                username: t.users_permissions_user.data.attributes.username,
                src: src22,
                email: t.users_permissions_user.data.attributes.email,
                publicklinks: t.open_mission.data.attributes.publicklinks,
                privatlinks: t.open_mission.data.attributes.privatlinks,
                hearotMeyuchadot: t.open_mission.data.attributes.hearotMeyuchadot,
                missionDetails: t.open_mission.data.attributes.descrip,
                nhours: t.open_mission.data.attributes.noofhours,
                perhour: t.open_mission.data.attributes.perhour,
                role: t.open_mission.data.attributes.tafkidims,
                missId: t.open_mission.data.attributes.mission.data.id,
                deadline: t.open_mission.data.attributes.sqadualed,
                openName: t.open_mission.data.attributes.name,
                omid: t.open_mission.data.id,
                askId: start[i].attributes.asks.data[j].id,
                users: t.vots,
                decid: t.open_mission.data.attributes.declined.data,
                name: rt[0],
                stylef: rt[1],
                st: rt[2],
                projectId: t.project.data.id,
                projectName: getProjectData(t.project.data.id,"pn"),
                noof: getProjectData(t.project.data.id,"noof"),
                src2: src21,
                myid: da.data.usersPermissionsUser.data.id,
                pid: getProjectData(t.project.data.id,"uids"),
                ani: "askedcoin",
                azmi: "ziruf",
                pl: 1 + i + j
                //   uid: start[i].asks[j].users[k].id,
                //  omid: start[i].open_missions[j].id,
                //  project: start[i].id
            });
        }

    }
    dictasked = dictasked
    if (dictasked.length > 0) {
        for (let k = 0; k < dictasked.length; k++) {
            const x = dictasked[k].users
            dictasked[k].uids = [];
            dictasked[k].what = [];
            for (let z = 0; z < x.length; z++) {
                dictasked[k].uids.push(x[z].users_permissions_user.data.id);
                dictasked[k].what.push(x[z].what);
            }
        }

        for (let t = 0; t < dictasked.length; t++) {
            const allid = dictasked[t].uids;
            const myid = dictasked[t].myid;
            dictasked[t].already = false;
            dictasked[t].noofusersOk = 0;
            dictasked[t].noofusersNo = 0;

            if (allid.includes(myid)) {
                dictasked[t].already = true;
                //  dictasked.splice(t, 1);
                //  dictasked. = dictasked
            }
            if (dictasked.length > 0) {
                for (let r = 0; r < dictasked[t].users.length; r++) {
                    if (dictasked[t].users[r].what === true) {

                        dictasked[t].noofusersOk += 1;

                    } else if (dictasked[t].users[r].what === false) {

                        dictasked[t].noofusersNo += 1;

                    }
                }
            }
            if (dictasked.length > 0) {

                const noofusersWaiting = dictasked[t].noof - dictasked[t].users.length;
                dictasked[t].noofusersWaiting = noofusersWaiting;

            }
        }
    }
    let filters = [false];

    let result = dictasked.filter(val => filters.includes(val.already));
    dictasked = result
    askedcoin = dictasked;
    ask = askedcoin.length;
    localStorage.setItem("ask", ask);
}

async function createmask(da) {
    const start = da.data.usersPermissionsUser.data.attributes.projects_1s.data
    for (let i = 0; i < start.length; i++)    {
        for (let j = 0; j < start[i].attributes.askms.data.length; j++) {
            const rt = letters(start[i].attributes.askms.data[j].attributes.open_mashaabim.data.attributes.name);
            let src21 = getProjectData(start[i].id,"pp");
            let src22 = "";
            if (start[i].attributes.askms.data[j].attributes.users_permissions_user.data.attributes.profilePic.data !== null) {
                src22 = start[i].attributes.askms.data[j].attributes.users_permissions_user.data.attributes.profilePic.data.attributes.formats.thumbnail.url
            }
            let a = start[i].attributes.askms.data[j].attributes
            askedm.push({
                uid: a.users_permissions_user.data.id,
                username: a.users_permissions_user.data.attributes.username,
                src: src22,
                price: a.open_mashaabim.data.attributes.price,
                easy: a.open_mashaabim.data.attributes.easy,
                spnot: a.open_mashaabim.data.attributes.spnot,
                descrip: a.open_mashaabim.data.attributes.descrip,
                hm: a.open_mashaabim.data.attributes.hm,
                myp: a.sp.data.attributes.myp,
                kindOf: a.open_mashaabim.data.attributes.kindOf,
                spid: a.sp.data.id,
                deadline: a.open_mashaabim.data.attributes.sqadualed,
                openName: a.open_mashaabim.data.attributes.name,
                omid: a.open_mashaabim.data.id,
                askId: start[i].attributes.askms.data[j].id,
                users: a.vots,
                name: rt[0],
                stylef: rt[1],
                st: rt[2],
                projectId: start[i].id,
                projectName: getProjectData( start[i].id, "pn"),
                noof: getProjectData( start[i].id, "noof"),
                src2: src21,
                myid:  da.data.usersPermissionsUser.data.id,
                pid: getProjectData( start[i].id, "uids"),
                ani: "askedm",
                azmi: "ziruf",
                pl: 2 + i + j
            });
        }

    }
    askedm = askedm
    if (askedm.length > 0) {
        for (let k = 0; k < askedm.length; k++) {
            const x = askedm[k].users
            askedm[k].uids = [];
            askedm[k].what = [];
            for (let z = 0; z < x.length; z++) {
                askedm[k].uids.push(x[z].users_permissions_user.data.id);
                askedm[k].what.push(x[z].what);
            }
        }
        for (let t = 0; t < askedm.length; t++) {
            const allid = askedm[t].uids;
            const myid = askedm[t].myid;
            askedm[t].already = false;
            askedm[t].noofusersOk = 0;
            askedm[t].noofusersNo = 0;

            if (allid.includes(myid)) {
                askedm[t].already = true;
                //  dictasked.splice(t, 1);
                //  dictasked. = dictasked
            }

            if (askedm.length > 0) {
                for (let r = 0; r < askedm[t].users.length; r++) {
                    if (askedm[t].users[r].what === true) {

                        askedm[t].noofusersOk += 1;

                    } else if (askedm[t].users[r].what === false) {

                        askedm[t].noofusersNo += 1;

                    }
          
                }
                      const noofusersWaiting = askedm[t].noof - askedm[t].users.length;
                askedm[t].noofusersWaiting = noofusersWaiting;
            }

        }
    }
    let filters = [false];

    let result = askedm.filter(val => filters.includes(val.already));
    askedm = result
    askedm = askedm;
    askma = askedm.length;
    localStorage.setItem("askma", askma);
}

function letters(data) {
    let namer = [];
    let st = 175;
    let stylef = '24px';
    if ((/[\u0590-\u05FF]/).test(data) | (/[\u0600-\u06FF]/).test(data)) {
        let sep = "";
        sep = data.split(' ').filter(w => w !== '');
        for (let i = 0; i < sep.length; i++) {
            if ((/[\u0590-\u05FF]/).test(sep[i]) | (/[\u0600-\u06FF]/).test(sep[i])) {
                namer[i] = sep[i].split("").reverse().join("");

            } else {
                namer[i] = sep[i];

            }
        }
        const x = namer.reverse().join(" ");
        data = x;
        st = 275;
    }

    //  if (data.length >= 2 && data.length < 4) {
    //       st = 185;
    //    } 
    // else if (data.length >= 4 && data.length < 5) {
    //       st = 180;
    //    } 
    // else if (data.length >= 5 && data.length < 6) {
    //       st = 170;
    //    } else if (data.length >= 6 && data.length < 7) {
    //       st = 165
    //    } else if (data.length >= 7 && data.length < 8) {
    //       st = 160
    //    }else if (data.length >= 8 && data.length < 9) {
    //       st = 150
    //    }else if (data.length >= 9 && data.length < 10) {
    //           st = 140
    //    }else if (data.length >= 10 && data.length < 11) {
    //           st = 130;
    //    }else if (data.length >= 11 && data.length < 12) {
    //           st = 135;
    //           stylef = '29px';
    //   } else  if (data.length >= 12 && data.length <13) {
    //               st = 130;
    //               stylef = '29px';
    //    }else  if (data.length >= 13 && data.length <14) {
    //               st = 125;
    //               stylef = '25px';
    //    }else  if (data.length >= 14 && data.length <15) {
    //               st = 125;
    //               stylef = '25px';
    //    }else  if (data.length >= 15 && data.length <17) {
    //               st = 125;
    //               stylef = '25px';
    //    }else  if (data.length >= 17 && data.length <19) {
    //               st = 130;
    //               stylef = '19px';
    //    }else  if (data.length >= 19 && data.length <20) {
    //               st = 130;
    //               stylef = '17px';
    //    }else  if (data.length >= 20 && data.length <21) {
    //               st = 125;
    //               stylef = '17px';
    //    }else  if (data.length >= 21 && data.length <22) {
    //               st = 125;
    //               stylef = '16px';
    //    } else  if (data.length >= 22){
    //                      st = 125;
    //        stylef = '14px';
    //   }

    if (data.length >= 15 && data.length < 19) {
        stylef = '21px';
        st = 275
    } else if (data.length >= 19 && data.length < 20) {
        stylef = '20px';
        st = 255
    } else if (data.length >= 20 && data.length < 21) {
        stylef = '18px';
        st = 270
    } else if (data.length >= 21) {
        stylef = '16px';
        st = 285
    }
    return [data, stylef, st];
}

const filterArrayd = (arr1, arr2) => {
    const filterede = arr1.filter(el => {
        return arr2.indexOf(el) === -1;
    });
    return filterede;
};
const filterArray = (arr1, arr2) => {
    const filterede = arr1.filter(el => {
        return arr2.indexOf(el) !== -1;
    });
    return filterede;
};
async function showOpenPro(mi) {
    //req
    const r = mi.data.usersPermissionsUser.data.attributes.askeds.data;
    if (r.length > 0) {
        const p = r.map(c => c.id);
        askedarr = p;
    }
    //dec
    const r1 = mi.data.usersPermissionsUser.data.attributes.declined.data;
    if (r1.length > 0) {
        const p1 = r1.map(c => c.id);
        declineddarr = p1;
    }
    const x = mi.data.usersPermissionsUser.data.attributes.skills.data;
    const t = mi.data.usersPermissionsUser.data.attributes.work_ways.data;
    const y = mi.data.usersPermissionsUser.data.attributes.tafkidims.data;
    const mytaf = y.map(c => c.id);
    const mysk = x.map(c => c.id);
 //check taf
    for (let i = 0; i < y.length; i++) {
        const q = y[i].attributes.open_missions.data
        let l = [];
        let z = [];
        let www = [];
        let wwn = [];
        let rate = [];
        let mtaf = [];
        let msk = [];
        for (let j = 0; j < q.length; j++) {
            l[j] = q[j].id;
            z[j] = q[j].attributes.work_ways.data.map(c => c.id);
            mtaf[j] = q[j].attributes.tafkidims.data.map(c => c.id);
            msk[j] = q[j].attributes.skills.data.map(c => c.id);
            const tafn = filterArrayd(mtaf[j], mytaf);
            const skn = filterArrayd(msk[j], mysk);
            if (t.length > 0) {
                let s = t.map(c => c.id);
                www[j] = filterArray(z[j], s);
                wwn[j] = filterArrayd(z[j], s);
                if (www[j].length > 0 && wwn[j].length === 0) {
                    if (q[j].id in dictids) {
                        dictids[q[j].id] += 1;
                    } else {
                        dictids[q[j].id] = www[j].length + 1;
                        if (msk[j].length > 0) {
                            if (mysk.length > 0) {
                                if (skn.length > 0) {
                                    dictids[q[j].id] -= (skn.length * 2);
                                }
                            } else {
                                dictids[q[j].id] -= (msk[j].length * 2)
                            }
                        }
                        if (mtaf[j].length > 0) {
                            if (tafn.length > 0) {
                                dictids[q[j].id] -= tafn.length;
                            }
                        }
                    }
                } else if (www[j].length > 0 && wwn[j].length > 0) {
                    if (q[j].id in dictids) {
                        dictids[q[j].id] += 1
                    } else {
                        dictids[q[j].id] = 1 + www[j].length - wwn[j].length;
                        if (msk[j].length > 0) {
                            if (mysk.length > 0) {
                                if (skn.length > 0) {
                                    dictids[q[j].id] -= (skn.length * 2);
                                }
                            } else {
                                dictids[q[j].id] -= (msk[j].length * 2)
                            }
                        }
                        if (mtaf[j].length > 0) {
                            if (tafn.length > 0) {
                                dictids[q[j].id] -= tafn.length;
                            }
                        }
                    }
                } else if (www[j].length === 0 && wwn[j].length > 0) {
                    if (q[j].id in dictids) {
                        dictids[q[j].id] += 1
                    } else {
                        dictids[q[j].id] = 1 - (2 * wwn[j].length);
                        if (msk[j].length > 0) {
                            if (mysk.length > 0) {
                                if (skn.length > 0) {
                                    dictids[q[j].id] -= (skn.length * 2);
                                }
                            } else {
                                dictids[q[j].id] -= (msk[j].length * 2);
                            }
                        }
                        if (mtaf[j].length > 0) {
                            if (tafn.length > 0) {
                                dictids[q[j].id] -= tafn.length;
                            }
                        }
                    }
                } else if (www[j].length === 0 && wwn[j].length === 0) {
                    if (q[j].id in dictids) {
                        dictids[q[j].id] += 1
                    } else {
                        dictids[q[j].id] = 1;
                        if (msk[j].length > 0) {
                            if (mysk.length > 0) {
                                if (skn.length > 0) {
                                    dictids[q[j].id] -= (skn.length * 2);
                                }
                            } else {
                                dictids[q[j].id] -= (msk[j].length * 2);
                            }
                        }
                        if (mtaf[j].length > 0) {
                            if (tafn.length > 0) {
                                dictids[q[j].id] -= tafn.length;
                            }
                        }
                    }
                }
            } else if (t.length == 0) {
                if (q[j].id in dictids) {
                    dictids[q[j].id] += 1
                } else {
                    dictids[q[j].id] = 1;
                    if (msk[j].length > 0) {
                        if (mysk.length > 0) {
                            if (skn.length > 0) {
                                dictids[q[j].id] -= (skn.length * 2);
                            }
                        } else {
                            dictids[q[j].id] -= (msk[j].length * 2);
                        }
                    }
                    if (mtaf[j].length > 0) {
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }
                    }
                }
            }
        }

        d[i] = [l, z, www, wwn, rate, dictids];

    }

    for (let i = 0; i < x.length; i++) {
        const q = x[i].attributes.open_missions.data;
        let l = [];
        let z = [];
        let www = [];
        let wwn = [];
        let rate = [];
        let mtaf = [];
        let msk = [];
        for (let j = 0; j < q.length; j++) {
            l[j] = q[j].id;
            z[j] = q[j].attributes.work_ways.data.map(c => c.id);
            mtaf[j] = q[j].attributes.tafkidims.data.map(c => c.id);
            msk[j] = q[j].attributes.skills.data.map(c => c.id);
            let s = t.map(c => c.id);
            const tafn = filterArrayd(mtaf[j], mytaf);
            const skn = filterArrayd(msk[j], mysk);
            www[j] = filterArray(z[j], s);
            wwn[j] = filterArrayd(z[j], s);
            if (q[j].id in dictids) {
                dictids[q[j].id] += 2
            } else {
                if (t.length > 0) {
                    if (www[j].length > 0 && wwn[j].length === 0) {
                        dictids[q[j].id] = www[j].length + 2;
                        if (skn.length > 0) {
                            dictids[q[j].id] -= (skn.length * 2);
                        }
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }

                    } else if (www[j].length > 0 && wwn[j].length > 0) {

                        dictids[q[j].id] = 2 + www[j].length - wwn[j].length;
                        if (skn.length > 0) {
                            dictids[q[j].id] -= (skn.length * 2);
                        }
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }

                    } else if (www[j].length === 0 && wwn[j].length > 0) {

                        dictids[q[j].id] = 2 - (2 * wwn[j].length);
                        if (skn.length > 0) {
                            dictids[q[j].id] -= (skn.length * 2);
                        }
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }

                    } else if (www[j].length === 0 && wwn[j].length === 0) {

                        dictids[q[j].id] = 2;
                        if (skn.length > 0) {
                            dictids[q[j].id] -= (skn.length * 2);
                        }
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }
                    }
                } else if (t.length === 0) {

                    dictids[q[j].id] = 2;
                    if (skn.length > 0) {
                        dictids[q[j].id] -= (skn.length * 2);
                    }
                    if (tafn.length > 0) {
                        dictids[q[j].id] -= tafn.length;
                    }
                }
            }
        }
        sk[i] = [l, z, www, wwn, rate];
    }
    let asanddec = askedarr.concat(declineddarr);
    asanddec = [...new Set([...askedarr, ...declineddarr])];
    const filteredw = Object.keys(dictids)
        .filter(key => !asanddec.includes(key))
        .reduce((obj, key) => {
            obj[key] = dictids[key];
            return obj;
        }, {});
    let keysSorted = Object.keys(filteredw).sort(function(a, b) {
        return filteredw[a] - filteredw[b]
    })
    // add declined filter add sort by value
    console.log("showOpenPro",keysSorted)

    if (keysSorted.length > 0) {
        let resultString = keysSorted.join(' , ');
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('jwt='))
            .split('=')[1];
        const cookieValueId = document.cookie
            .split('; ')
            .find(row => row.startsWith('id='))
            .split('=')[1];
        idL = cookieValueId;
        token = cookieValue;
        let bearer1 = 'bearer' + ' ' + token;
        let link = "https://beoni.onrender.com/graphql";
        try {
            await fetch(link, {
                    method: 'POST',

                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `{openMissions (filters: {id:{in: [${keysSorted}]}}){data{ id attributes{
            project {data{ id attributes{ projectName timeToP profilePic{data{attributes {url formats }}}}}}
            sqadualed
            tafkidims{data {attributes {roleDescription ${$lang == 'he' ? 'localizations {data{attributes {roleDescription }}}' : ""}}}}
            skills {data{attributes{skillName ${$lang == 'he' ? 'localizations {data{attributes{skillName }}}' : ""}}}}
            descrip
            hearotMeyuchadot
            name dates
            work_ways {data{attributes{workWayName ${$lang == 'he' ? 'localizations{data{attributes{workWayName }}}' : ""}}}}
            noofhours perhour
            }
            }
                }}`
                    })
                })
                .then(r => r.json())
                .then(data => meData = data.data.openMissions.data);
            for (let i = 0; i < meData.length; i++) {
                meData[i].ani = "meData",
                meData[i].azmi = "hazaa",               
                meData[i].pl = 10 + i,
                    meData[i].hst = checkHst(meData[i].attributes.project.data.attributes.projectName)
                    meData[i].stb = checkStb(meData[i].attributes.name)
            }

        } catch (e) {
            error1 = e
        }
    } else {
        tyu = true
    }
    sug = meData.length;
    localStorage.setItem("sug", sug);
    bubleUiAngin()
    arr1 = arr1
    console.log("her", arr1)
    if (!isEqual(meData, meDataold) && counter > 1) {
        if (meDataold.length < meData.length) {
            // Create and show the notification
            let rikn = "0"
            if (meDataold.length - meData.length === -1) {
                rikn = meData[meData.length - 1].projectName
            }
            let text = `שלום ${usernames} ! יש לך הצעה חדשה: ביצוע משימה  ${rikn !== "0" ? `ברקמת ${rikn}` : "בריקמה"}`;
            const head = {"he":"1💗1 הצעה חדשה","en":"1💗1 new suggestion"}
            nutifi(head[$lang],text,"lev" )

            /*    navigator.serviceWorker.register('sw.js');
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    navigator.serviceWorker.ready.then(function(registration) {
                        registration.showNotification('1💗1', {
                            body: text,
                            icon: img
                        });
                    });
                }
            });*/

        }
    }
};
function checkStb (dat){
    let hst
    if (dat.length < 4){
        hst = 165
    } else if (dat.length < 5){
        hst = 180
    } else if (dat.length < 8){
        hst = 185
    } else if (dat.length < 16){
        hst = 200
    } else if (dat.length < 24){
        hst = 240
    } else if (dat.length < 32){
        hst = 250
    }
    return hst
}
function checkHst (dat){
    let hst
    if (dat.length < 4){
        hst = 160
    } else if (dat.length < 5){
        hst = 170
    } else if (dat.length < 8){
        hst = 190
    } else if (dat.length < 16){
        hst = 195
    } else if (dat.length < 24){
        hst = 260
    } else if (dat.length < 32){
        hst = 285
    }
    return hst
}


// מיון ראשוני עדיף לפי האם סיים כבר משימה כזו 
let tyu = false
let nam = ""
let total = ""
let picLink = ""

function midd(min) {
    const dd = min.data.usersPermissionsUser.data.attributes
    nam = dd.username
    total = dd.total
    if (dd.profilePic.data !== null) {
        if (dd.profilePic.data.attributes.formats.thumbnail.url) {
            picLink = dd.profilePic.data.attributes.formats.thumbnail.url
        } else if (dd.profilePic.data.attributes.small.thumbnail.url) {
            picLink = dd.profilePic.data.attributes.small.thumbnail.url
        } else if (dd.profilePic.data.attributes.url) {
            picLink = dd.profilePic.data.attributes.url
        } 
    } else{
        picLink = "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"
    }
    localStorage.setItem("nam", JSON.stringify(nam));
    localStorage.setItem("picLink", JSON.stringify(picLink));

}
let tickSpeed = 60000 * 5;
let sdsa = [];
let tt = null;

let miDataold = [];
let mtahaold = [];
let counter = 0;

function reverseString(str) {
    return str.split("").reverse().join("");
}
let innerFlash = 'rgb(255,0,255)';
let outerFlash = 'rgb(255,55,255)';
let x = [],
    y = [],
    xyz = ['1,2'],
    c = 0;

function sortNumber(a, b) {
    return a - b;
}

function prcnt(a, b) {
    return parseInt(a * b / 100, 10);
}
let h, w, initX = 0;

function gen() {
    let xMax = prcnt(16, w);
    let yMin = prcnt(7, h);
    let yMax = prcnt(25, h);
    x = [];
    y = [];
    xyz = [];
    let step = 0;
    let a = w / 2;
    let b = w / 4.5;
    let e = b / 2;
    initX = a + Math.random() * b - e | 0;
    for (let i = 0; i < 50; i++) {
        let g = 20 + Math.random() * yMax | 0;
        step += g;
        y[i] = step | 0;
        if (step > h) {
            break
        }
    }
    y.push(0);
    y.sort(sortNumber);
    x[0] = initX;
    for (let i = 0; i < y.length; i++) {
        if ((y[i + 1] - y[i] < yMin)) {
            x[i + 1] = x[i] + Math.floor(Math.random() * 10 - 8);
        } else {
            x[i + 1] = x[i] + Math.floor(Math.random() * xMax - (xMax / 2));
        }
        xyz[i] = x[i] + ',' + y[i] + ' ';
    }
    return xyz, initX;
}
let repeater = null;
onMount(async () => {
    if (localStorage.getItem("miDataLM") !== null) {
        arr1 = JSON.parse(localStorage.getItem("miDataLM"))
    }
    if (localStorage.getItem("nam") !== null) {
        nam = JSON.parse(localStorage.getItem("nam"))
    }
    if (localStorage.getItem("picLink") !== null) {
        picLink = JSON.parse(localStorage.getItem("picLink"))
    }
    if (localStorage.getItem("betha") !== null) {
        betha.set(JSON.parse(localStorage.getItem("betha")))
    }
    if (localStorage.getItem("miDataL") !== null) {
        miData = JSON.parse(localStorage.getItem("miDataL"))
    }
    if (localStorage.getItem("pmashd") !== null) {
        pmashd = localStorage.getItem("pmashd")
    } 
    if (localStorage.getItem("fia") !== null) {
        fia = localStorage.getItem("fia")
    }     
    if (localStorage.getItem("beta") !== null) {
        beta = localStorage.getItem("beta")
    }     
    if (localStorage.getItem("askma") !== null) {
        askma = localStorage.getItem("askma")
    }     
    if (localStorage.getItem("wel") !== null) {
        wel = localStorage.getItem("wel")
    }     
    if (localStorage.getItem("halu") !== null) {
        halu = localStorage.getItem("halu")
    }     
    if (localStorage.getItem("ask") !== null) {
        ask = localStorage.getItem("ask")
    }     
    if (localStorage.getItem("pen") !== null) {
        pen = localStorage.getItem("pen")
    }     
    if (localStorage.getItem("sug") !== null) {
        sug = localStorage.getItem("sug")
    }     
    if (localStorage.getItem("maap") !== null) {
        maap = localStorage.getItem("maap")
    }     
    if (localStorage.getItem("mashs") !== null) {
        mashs = localStorage.getItem("mashs")
    }     
  /*  if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js', {
            scope: '.'
        }).then(function(reg) {
            // registration worked
            console.log('Registration succeeded. Scope is ' + reg.scope);
        }).catch(function(error) {
            // registration failed
            console.log('Registration failed with ' + error);
        });
    };*/
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
    if (cookieValue != null) {
        const cookieValu = document.cookie
            .split('; ')
            .find(row => row.startsWith('jwt='))
            .split('=')[1];
        const cookieRe = document.cookie
            .split('; ')
            .find(row => row.startsWith('when='))
        if (cookieRe != null) {
            const cookieR = document.cookie
                .split('; ')
                .find(row => row.startsWith('when='))
                .split('=')[1];
            const today = Date.now()
            if (cookieR + 2592000000 < today) {
                goto("login")
            }
        }
        const cookieValueId = document.cookie
            .split('; ')
            .find(row => row.startsWith('id='))
            .split('=')[1];
        idL = cookieValueId;
        token = cookieValu;
        const elem = document.getElementById('scree');

        function flash() {
            if (cards == false){
            elem.style.backgroundImage = 'radial-gradient(ellipse farthest-corner at ' + initX + 'px top, #ffaaff 0%, #ee88ff 16%, #000 100%)';
            let r = 30 + Math.random() * 70 | 0;
            c++;
            setTimeout(function() {
                flkr();
            }, r);
        }
        }

        function flkr() {
            elem.style.backgroundImage = 'radial-gradient(ellipse farthest-corner at ' + initX + 'px top, #000 0%, #000 100%)';
            let r = 16 + Math.random() * 30 | 0;
            if (c > 6) {
                clear();
            } else {
                setTimeout(function() {
                    flash();
                }, r);
            }
        }

        function clear() {
            if (low == true) {
                elem.style.backgroundImage = 'radial-gradient(ellipse farthest-corner at center top, #000 0%, #000 100%)';
            } else {
                elem.style.backgroundImage = '';

            }
        }

        if (low == true && cards == false) {
          //  document.getElementById("my_audio").play();
            let speed = 2400;
            let changeSpeed = speed;
            repeater = setInterval(repeaterFn, speed);

            function repeaterFn() {
                c = 0;
                gen();
                flash();
                finito();
                if (changeSpeed != speed) {
                    clearInterval(repeater);
                    speed = changeSpeed;
                    repeater = setInterval(repeaterFn, speed);
                }
            }
            setTimeout(function() {
                changeSpeed = 1200;
            }, 12000);
            setTimeout(function() {
                changeSpeed = 600
            }, 24000);

        }

        function finito() {
            if (low == false && cards == false) {
                elem.style.backgroundImage = ''
                clearInterval(repeater)
                elem.style.backgroundImage = ''
              //  document.getElementById("my_audio").pause();

            }
        }
        await start();
        setInterval(start, tickSpeed);
        if ((navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)) {
            if ((/[\u0590-\u05FF]/).test(nam) || (/[\u0600-\u06FF]/).test(nam)) {
                nam = reverseString(nam)
                nam = nam
            }
            console.log("safari.. please use chrome for better experince")
            await start()
                .then()
            if ((/[\u0590-\u05FF]/).test(nam) || (/[\u0600-\u06FF]/).test(nam)) {
                nam = reverseString(nam)
                nam = nam
            }
        }
    } else {
        goto("/", )
    }
})
 export const snapshot = {
        capture: () => JSON.parse(JSON.stringify(arr1)),
        restore: (value) => arr1 = JSON.parse(value)
    };
let usernames
const tolog = {"he": "תוקף ההתחברות שלך פג, אנו מעבירים אותך להתחברות מחדש", "en":"your connection is outdated you being redirected to login"}
let walcomenold = [],
    hucaold = [],
    meDataold = [],
    hachlatot = [];
async function start() {
    console.log($lang, "start");
    miDataold = miData
    let bearer1 = 'bearer' + ' ' + token;
    let link = "https://beoni.onrender.com/graphql";
    try {
        await fetch(link, {
                method: 'POST',

                headers: {
                    'Authorization': bearer1,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `{ usersPermissionsUser (id: ${idL}){
    data {
      id attributes{ 
      haskama
      askms (filters: { archived: { eq: false } }){ data{ id attributes{
                    vots  {what why id users_permissions_user {data{id}}}
                    open_mashaabim { data {id attributes{  price descrip spnot kindOf  sqadualedf sqadualed linkto createdAt hm name easy }}}
                    project {data {id attributes{ projectName user_1s {data{id}} profilePic {data{ attributes{url formats }}}}}}
                    users_permissions_user{data {id attributes {haskama username profilePic {data{attributes{url formats }}}}}}
                      }}}
      sps {data{id attributes{ name unit price myp 
                		mashaabim {data{id attributes{ price 
                              open_mashaabims (filters: { archived: { eq: false } }){ data{ id attributes{
                                        declinedsps {data{ id }} price hm descrip spnot kindOf users {data{ id }} 
                                        sqadualedf sqadualed linkto createdAt hm name easy
                												project {data{id attributes {projectName  user_1s {data{id}} profilePic {data{attributes{url formats}}}}}} 
                     }}}}}}}}} 
      mesimabetahaliches (filters: { forappruval: { eq: false },finnished:{ eq: false } }) {data{ id attributes{ 
        						status stname timer hearotMeyuchadot name descrip hoursassinged perhour privatlinks publicklinks howmanyhoursalready  admaticedai 
        						mission {data{id}}
        						project{data{id}}
                                acts{data{id attributes{shem myIshur link hashivut valiIshur des dateF dateS status naasa}}}
            			   }}}
      welcom_tops (filters: { clicked: { eq: false } }){ data{ id attributes{
                	 project{data{id}}
   								   }}}
      skills{data{id attributes{ 
            			 open_missions(filters: { archived: { eq: false } }){ data{ id attributes{
                								 skills {data{ id }} 
                   							 tafkidims {data {id}}  
                    						 work_ways {data{ id}}
        													}}}
      								}}}
	  username hervachti
      profilePic {data{attributes {url formats }}}  
      askeds  {data{ id}} 
      declined {data{ id} }
      work_ways {data{ id }} 
      tafkidims {data{ id attributes{
                        open_missions(filters: { archived: { eq: false } }){ data{ id attributes{
                								 skills {data{ id }} 
                   							 tafkidims {data {id}}  
                    						 work_ways {data{ id}}
        													}}}
     									 }}} 
  	projects_1s {data{id attributes{ projectName 
    			user_1s {data{id attributes{username haskamaz haskamac haskama profilePic {data{attributes{ url formats }}}}}} 
    			profilePic {data{attributes{ url formats }}} 
    			decisions (filters: { archived: { eq: false } }){ data{ id attributes{ 
        					kind createdAt 
        					newpic {data{id attributes{ url formats }}}
        					vots  {what why id order users_permissions_user {data{id}}}
      							}}}
    			tosplits (filters: { finished: { eq: false } }){ data{ id attributes{ 
        					name 
                            halukas {data {id}}
        					vots  {what why id users_permissions_user {data {id}}}
                            hervachti {amount noten mekabel users_permissions_user {data {id attributes{hervachti}}}}
      							}}}
                halukas (filters: {and:[{ ushar: { eq: true } } { confirmed: { eq: false }}]}){ data{ id attributes{ 
                    amount senderconf chatre {freetext send {data{id}} when seen} usersend {data {id}} userrecive {data{id}}  tosplit{data{id attributes{halukas{data{id attributes{confirmed}}} hervachti{nirsham amount noten mekabel users_permissions_user{data{id attributes{hervachti}}}}}}}
                }}} 
    			maaps(filters: { archived: { eq: false } }){ data{ id attributes{ 
        					createdAt name  
        					sp{data {id attributes{ name myp unit 
                		            users_permissions_user {data {id attributes{ username profilePic {data{attributes {url formats } }}}}}}}}
                		    open_mashaabim{data{id attributes{ name sqadualed sqadualedf kindOf spnot easy}}}
                            vots {what why id users_permissions_user {data { id}}}
                                }}}
    			pmashes (filters: { archived: { eq: false } }){ data{ id attributes{ 
        					hm sqadualedf sqadualed linkto createdAt name descrip easy price kindOf spnot 
        					mashaabim {data{id}} 
        					diun {what why order id users_permissions_user {data {id }}}
        					users { what order why id users_permissions_user {data{id }}}
      							}}}
    			open_mashaabims {data{ id attributes{ name 
                	        project {data{ id }} 
                	        mashaabim {data{attributes{ sps{data{id attributes {name price kindOf spnot  myp 
                												users_permissions_user {data{id attributes{ username profilePic {data{attributes{url formats }}}}}}
                    }}}}}}}}}  
    			askms(filters: { archived: { eq: false } }){ data{ id attributes{
                            vots {what why id users_permissions_user {data{id}}}
                            users_permissions_user {data{id attributes{ username  profilePic{data{attributes {url formats }}}}}}
                        	open_mashaabim {data{ id attributes{  price descrip spnot kindOf  sqadualedf sqadualed linkto createdAt hm name easy }}}
                          	sp {data{ id attributes{ price myp }}}
      											}}}
   				asks(filters: { archived: { eq: false } }){ data{ id attributes{
                            vots  {what why id users_permissions_user {data{id}}}
                            open_mission {data{id attributes{  mission {data{id}}
                                            declined {data{ id}} sqadualed publicklinks tafkidims {data{ id }}
                                            noofhours perhour privatlinks descrip hearotMeyuchadot name}}}
                            project {data{ id }}
                            users_permissions_user {data{ id attributes{ username email profilePic {data{attributes{ url formats }}}}}}
      									}}}
    			finiapruvals(filters: { archived: { eq: false } }){ data{ id attributes{
              			    missname noofhours why what{data{attributes {url formats}}} 
        					mesimabetahalich {data{id attributes{ perhour hearotMeyuchadot descrip mission {data {id}}}}}
                            vots  {what why id users_permissions_user {data{id}}}
          					project {data{ id}} 
            				users_permissions_user {data{ id} }
      											}}}
    			pendms(filters: { archived: { eq: false } }){ data{ id attributes{ 
        					name hearotMeyuchadot descrip noofhours perhour sqadualed privatlinks publicklinks
                            rishon {data{id}}
                            skills {data{ id attributes{ skillName ${$lang == 'he' ? 'localizations {data{attributes{skillName }}}' : ""}}}}
                            tafkidims {data{id attributes{ roleDescription ${$lang == 'he' ? 'localizations {data{attributes {roleDescription }}}' : ""}}}}
                            work_ways {data{id attributes{ workWayName ${$lang == 'he' ? 'localizations{data{attributes{workWayName }}}' : ""}}}}
                            mission {data{ id}}
                            vallues {data{ id}}
                            nego { noofhours perhour users_permissions_user {data {id}}}
                            diun {what why id order users_permissions_user {data{ id}}}  
                            users { what order why id users_permissions_user {data{id }}}                                   
      													}}}
    			open_missions(filters: { archived: { eq: false } }){ data{ id attributes{ 
        					declined {data{ id}} 
        					users  {data{id} } 
      								}}}
    }}}
      }}}
}`
                })
            })
            .then(r => r.json())
            .then(data => miData = data);
            if(miData?.data?.usersPermissionsUser == null || miData?.data == null || miData == null) {
                console.log("login")
                addToast(`${tolog[$lang]}`, 'info');

                goto("/login?ref=lev")
            }
                            console.log("nologin")

        counter += 1;
        localStorage.setItem("miDataL", JSON.stringify(miData));
        if (isEqual(miData, miDataold)  == true) {
            console.log("nada")
            low = false
        } else {
            console.log(miDataold)
            console.log("tada")
            console.log(miData)
            miData = miData
            askedm = [];
            fiapp = [];
            dictasked = [];
            pends = [];
            adder = [];
            walcomenold = walcomen;
            walcomen = [];
            askedcoin = [];
            mtahaold = mtaha;
            mtaha = [];
            meDataold = meData
            meData = [];
            sdsa = [];
            pmashes = [];
            hucaold = huca;
            huca = [];
            wegets = [];
            haluask = [];
            hachlatot = [];
            tverias = []
             usernames = miData.data.usersPermissionsUser.data.attributes.username;
            showOpenPro(miData);
            midd(miData);
            makeWalcom(miData);
            createasked(miData); // לא עבד כשלא היו משימות פתוחות.. כפילויות אחרי מחיקה
            createpends(miData);
            mesimabetahalicha(miData);
            console.log("mtaha")
            ishursium(miData);
                        console.log("ishursium")
            sds(miData);
                        console.log("sds")
            pmash(miData)
            console.log("pmash")
            sps(miData)
            createmask(miData)
            console.log("createmask")
            crMaap(miData)
            console.log("crMaap")
            rashbi(miData);
            console.log("rashbi")
            hachla(miData);
            console.log("hachla")
            tveria(miData)
            console.log("tveria")
            bubleUiAngin()
            low = false
        }
    } catch (e) {
        error1 = e
    }
};
let pmashes = [];
let huca = [];
let haluask = [];
let tverias = [];
function tveria (data){
    const myid = data.data.usersPermissionsUser.data.id;
     const projects = data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        for (let j = 0; j < projects[i].attributes.halukas.data.length; j++) {
            const el = projects[i].attributes.halukas.data[j]
            if (el.attributes.usersend.data.id == myid ||  el.attributes.userrecive.data.id == myid){
                            console.log(projects[i].attributes.halukas.data[j], "oooo")
                tverias.push({
                    shear:  el.attributes.tosplit.data.attributes.halukas.data,
                    hervachti: el.attributes.tosplit.data.attributes.hervachti,
                sendpropic:getProjectData(proj.id,"upic",el.attributes.usersend.data.id),
                sendname:getProjectData(proj.id,"un",el.attributes.usersend.data.id),    
                respropic:getProjectData(proj.id,"upic",el.attributes.userrecive.data.id),
                resname:getProjectData(proj.id,"un",el.attributes.userrecive.data.id),    
                projectId: proj.id,
                kind: el.attributes.usersend.data.id == myid ? "send" : "recive",
          //      created_at: pend.createdAt,
                projectName: getProjectData(proj.id,"pn"),
            //    user_1s: getProjectData(proj.id,"us"),
                src: getProjectData(proj.id,"pp"),
             //   noofpu: getProjectData(proj.id,"noof"),
                myid: myid,
                pendId: projects[i].attributes.halukas.data[j].id,
                chat: el.attributes.chatre,
                amount: el.attributes.amount,
                send: el.attributes.usersend.data.id,
                recive: el.attributes.userrecive.data.id,
                senderconf:el.attributes.senderconf,
                ani: "vidu",
                azmi: "vidu",
                pl: 1,
                messege: []
            });
        }
    }
};
        for(let s = 0; s < tverias.length ; s++){
            for(let t = 0; t < tverias[s].chat.length ; t++ ){
              tverias[s].messege.push({
                    message: tverias[s].chat[t].freetext,
                    when: tverias[s].chat[t].when,
                    pic: getProjectData(tverias[s].projectId,"upic",tverias[s].chat[t].send.data.id),
                    sentByMe: tverias[s].chat[t].send.data.id === myid ? true : false,
                    seen: tverias[s].chat[t].seen,
                })
            }
        }
    
    tverias = tverias
    console.log(tverias)
}
function hachla(data) {
    const myid = data.data.usersPermissionsUser.data.id;
    let src24 = ""
    if (data.data.usersPermissionsUser.data.attributes.profilePic.data !== null) {
        src24 = data.data.usersPermissionsUser.data.attributes.profilePic.data.attributes.url
    } else {
        src24 = ""
    }
    const projects = data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        for (let j = 0; j < projects[i].attributes.decisions.data.length; j++) {
            const pend = projects[i].attributes.decisions.data[j].attributes
                    console.log("proh")

              let newpicid;
              let newpic;
            if(pend.kind == "pic" ){
                newpicid = pend.newpic.data.id;
                newpic =pend.newpic.data.attributes.url
            }
            hachlatot.push({
              newpicid:newpicid ,
                mysrc: src24,
                projectId: proj.id,
                kind: pend.kind,
                created_at: pend.createdAt,
                projectName: getProjectData(proj.id,"pn"),
                user_1s: getProjectData(proj.id,"us"),
                src: getProjectData(proj.id,"pp"),
                noofpu: getProjectData(proj.id,"noof"),
                users: pend.vots,
                myid: myid,
                newpic: newpic,
                pendId: projects[i].attributes.decisions.data[j].id,
                //   diun: pend.diun,
                ani: "hachla",
                azmi: "hachla",
                pl: 1 + pend.vots.length,
                messege: []
            });
        }
    }
    console.log("mid", hachlatot)
    for (let k = 0; k < hachlatot.length; k++) {
        const x = hachlatot[k].users
        hachlatot[k].uids = [];
        for (let z = 0; z < x.length; z++) {
            hachlatot[k].uids.push(x[z].users_permissions_user.id);
        }
    }
    for (let t = 0; t < hachlatot.length; t++) {
        const allid = hachlatot[t].uids;
        const myid = hachlatot[t].myid;
        hachlatot[t].already = false;
        hachlatot[t].noofusersOk = 0;
        hachlatot[t].noofusersNo = 0;
        hachlatot[t].cv = 0
        hachlatot[t].mypos = null;
        if (allid.includes(myid)) {
            hachlatot[t].already = true;
            hachlatot[t].pl += 48
            for (let l = 0; l < hachlatot[t].users.length; l++) {
                if (hachlatot[t].users[l].users_permissions_user.id === myid)
                    if (hachlatot[t].users[l].order !== 1) {
                        hachlatot[t].mypos = hachlatot[t].users[l].what;
                    }
            }
        }
        for (let r = 0; r < hachlatot[t].users.length; r++) {
            if (hachlatot[t].users[r].order !== 1) {
                hachlatot[t].cv += 1
                if (hachlatot[t].users[r].what === true) {
                    hachlatot[t].noofusersOk += 1;
                } else if (hachlatot[t].users[r].what === false) {
                    hachlatot[t].noofusersNo += 1;
                }
            }
        }
        const noofusersWaiting = hachlatot[t].user_1s.length - hachlatot[t].cv;
        hachlatot[t].noofusersWaiting = noofusersWaiting;
        if (hachlatot[t].users.length > 0) {
            for (let x = 0; x < hachlatot[t].users.length; x++) {
                let src22 = ""
                /*  if(hachlatot[t].users[x].users_permissions_user.profilePic !== null){
                    src22 = hachlatot[t].users[x].users_permissions_user.profilePic.url
                  } else{
                    src22 = ""
                  }*/
                hachlatot[t].messege.push({
                    message: `${getProjectData(hachlatot[t].projectId,"un",hachlatot[t].users[x].users_permissions_user.id)}  
                     ${hachlatot[t].users[x].what == true ? 'בעד' : ` נגד
                      ${hachlatot[t].users[x].why !== null ? `בנימוק: ${hachlatot[t].users[x].why}` : ``}`}`,
                    what: hachlatot[t].users[x].what,
                    pic: src22,
                    sentByMe: hachlatot[t].users[x].users_permissions_user.id === myid ? true : false,
                    changed: hachlatot[t].users[x].order == 1 ? true : false,
                })
            }
        }
        /*
         if (pmashes[t].diun.length > 0){
                         for (let x = 0; x < pmashes[t].diun.length; x++){
                           let src22 = ""
                          if(pmashes[t].diun[x].users_permissions_user.profilePic !== null){
                            src22 = pmashes[t].diun[x].users_permissions_user.profilePic.url
                          } else{
                            src22 = ""
                          }
                          pmashes[t].messege.push({
                            message: pmashes[t].diun[x].why,
                            what: pmashes[t].diun[x].what,
                            pic:src22,
                            sentByMe: pmashes[t].diun[x].users_permissions_user.id === myid ? true : false,       
                          })
                         }
                       }*/
    } 

    halu = hachlatot.length ;
    localStorage.setItem("halu", halu);
    console.log(hachlatot)
}

function rashbi(data) {
    const myid = data.data.usersPermissionsUser.data.id;
    const projects = data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
        for (let j = 0; j < projects[i].attributes.tosplits.data.length; j++) {
            const halug = projects[i].attributes.tosplits.data[j].attributes
            haluask.push({
                name: halug.name,
                projectId: projects[i].id,
                projectName: getProjectData(projects[i].id,"pn"),
                user_1s: getProjectData(projects[i].id,"us"),
                src: getProjectData(projects[i].id,"pp"),
                users: halug.vots,
                myid: myid,
                pendId: projects[i].attributes.tosplits.data[j].id,
                noofusers: getProjectData(projects[i].id,"noof"),
                halukot: halug.halukas.data,
                hervach: halug.hervachti,
                ani: "haluk",
                azmi: "hachla",
                pl: 1 + halug.vots.length
            });

        }
    }
    for (let k = 0; k < haluask.length; k++) {
        const x = haluask[k].users
        for (let z = 0; z < x.length; z++) {
            haluask[k].uids = [];
            haluask[k].uids.push(x[z].users_permissions_user.data.id);
            haluask[k].what = [];

            haluask[k].what.push(x[z].what);
        }
    }

    for (let t = 0; t < haluask.length; t++) {
        const allid = haluask[t].uids;
        const myid = haluask[t].myid;
        haluask[t].already = false;
        haluask[t].noofusersOk = 0;
        haluask[t].noofusersNo = 0;

        if (allid.includes(myid)) {
            haluask[t].already = true;
            haluask[t].pl += 25
        }
        for (let r = 0; r < haluask[t].users.length; r++) {
            if (haluask[t].users[r].what === true) {

                haluask[t].noofusersOk += 1;

            } else if (haluask[t].users[r].what === false) {

                haluask[t].noofusersNo += 1;

            }
        }
        const noofusersWaiting = haluask[t].user_1s.length - haluask[t].users.length;
        haluask[t].noofusersWaiting = noofusersWaiting;

    }
    halu = haluask.length;
    localStorage.setItem("halu", halu);

}

function sps(pp) {
    const usernames = pp.data.usersPermissionsUser.data.attributes.username
    for (let i = 0; i < pp.data.usersPermissionsUser.data.attributes.sps.data.length; i++) {
        const y = pp.data.usersPermissionsUser.data.attributes.sps.data[i].attributes;
        if (y.mashaabim.data.attributes.open_mashaabims.data.length > 0) {
            console.log("here and now",y)
            for (let t = 0; t < y.mashaabim.data.attributes.open_mashaabims.data.length; t++) {
                const x = y.mashaabim.data.attributes.open_mashaabims.data[t].attributes
                const z = x.project.data.attributes;
                const declineddarra = x.declinedsps.data.map(c => c.id)
                console.log("klkl")
                if (!declineddarra.includes(y.mashaabim.data.attributes.open_mashaabims.data[t].id)) {
                   // if(x.hm <= y.unit){
                    huca.push({
                        declineddarra: declineddarra,
                        projectid: x.project.data.id,
                        projectName: z.projectName,
                        srcb: z.profilePic.data.attributes.formats.thumbnail.url,
                        id: y.mashaabim.data.attributes.open_mashaabims.data[t].id,
                        price: x.price,
                        mashname: x.name,
                        myp: y.myp,
                        easy: x.easy,
                        kindOf: x.kindOf,
                        spnot: x.spnot,
                        descrip: x.descrip,
                        oid: pp.data.usersPermissionsUser.data.attributes.sps.data[i].id,
                        already: false,
                        ani: "huca",
                        azmi: "hazaa",
                        pl: 6
                    })
            //    }
            }
            }
        }
    }
                    console.log("koooooo")
    huca = huca
    mashs = huca.length
    localStorage.setItem("mashs", mashs);
    //todo hm vs hm 
    if (!isEqual(huca, hucaold) && counter > 1) {
        if (hucaold.length < huca.length) {
            // Create and show the notification
            let rikn = "0"
            if (hucaold.length - huca.length === -1) {
                rikn = huca[huca.length - 1].projectName
            }
            let linkop = "lev"
            let text = `שלום ${usernames} ! יש לך הצעה חדשה: שיתוף משאב  ${rikn !== "0" ? `ברקמת ${rikn}` : "בריקמה"}`;
            nutifi("1💗1 ריקמה חדשה",text,linkop )
        }
    }
}
let penm = 0;

function pmash(data) {
    //rishonnnn so to create openM first avilable only to rishon then to rest of users..
    const myid = data.data.usersPermissionsUser.data.id;
    let src24 = ""
    if (data.data.usersPermissionsUser.data.attributes.profilePic.data !== null) {
        src24 = data.data.usersPermissionsUser.data.attributes.profilePic.data.attributes.formats.thumbnail.url
    } else {
        src24 = ""
    }
    const projects = data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
        const proj = projects[i];
        for (let j = 0; j < projects[i].attributes.pmashes.data.length; j++) {
             const pend = projects[i].attributes.pmashes.data[j].attributes
            pmashes.push({
                mysrc: src24,
                name: pend.name,
                projectId: proj.id,
                hearotMeyuchadot: pend.spnot,
                descrip: pend.descrip,
                kindOf: pend.kindOf,
                created_at: pend.createdAt,
                projectName: getProjectData(proj.id,"pn"),
                user_1s:getProjectData(proj.id,"us"),
                src: getProjectData(proj.id,"pp"),
                noofusers: getProjectData(proj.id,"noof"),
                users: pend.users,
                myid: myid,
                mshaabId: pend.mashaabim.data.id,
                hm: pend.hm,
                price: pend.price,
                easy: pend.easy,
                linkto: pend.linkto,
                sqadualed: pend.sqadualed,
                sqadualedf: pend.sqadualedf,
                pendId: projects[i].attributes.pmashes.data[j].id,
                diun: pend.diun,
                ani: "pmashes",
                azmi: "harchava",
                pl: 1 + pend.users.length,
                messege: []
            });
        }
    }
    for (let k = 0; k < pmashes.length; k++) {
        const x = pmashes[k].users
        pmashes[k].uids = [];
        for (let z = 0; z < x.length; z++) {
            pmashes[k].uids.push(x[z].users_permissions_user.data.id);
        }
    }
    for (let t = 0; t < pmashes.length; t++) {
        const allid = pmashes[t].uids;
        const myid = pmashes[t].myid;
        pmashes[t].already = false;
        pmashes[t].noofusersOk = 0;
        pmashes[t].noofusersNo = 0;
        pmashes[t].cv = 0
        pmashes[t].mypos = null;
        if (allid.includes(myid)) {
            pmashes[t].already = true;
            pmashes[t].pl += 48
            for (let l = 0; l < pmashes[t].users.length; l++) {
                if (pmashes[t].users[l].users_permissions_user.data.id === myid)
                    if (pmashes[t].users[l].order !== 1) {
                        pmashes[t].mypos = pmashes[t].users[l].what;
                    }
            }
        }
        for (let r = 0; r < pmashes[t].users.length; r++) {
            if (pmashes[t].users[r].order !== 1) {
                pmashes[t].cv += 1
                if (pmashes[t].users[r].what === true) {
                    pmashes[t].noofusersOk += 1;
                } else if (pmashes[t].users[r].what === false) {
                    pmashes[t].noofusersNo += 1;
                }
            }
        }
        const noofusersWaiting = pmashes[t].user_1s.length - pmashes[t].cv;
        pmashes[t].noofusersWaiting = noofusersWaiting;
        if (pmashes[t].users.length > 0) {
            for (let x = 0; x < pmashes[t].users.length; x++) {
                let src22 = getProjectData(pmashes[t].projectId,"upic",pmashes[t].users[x].users_permissions_user.data.id)
                pmashes[t].messege.push({
                    message: `${getProjectData(pmashes[t].projectId,"un",pmashes[t].users[x].users_permissions_user.data.id)}  
                     ${pmashes[t].users[x].what == true ? 'בעד' : ` נגד
                      ${pmashes[t].users[x].why !== null ? `בנימוק: ${pmashes[t].users[x].why}` : ``}`}`,
                    what: pmashes[t].users[x].what,
                    pic: src22,
                    sentByMe: pmashes[t].users[x].users_permissions_user.data.id === myid ? true : false,
                    changed: pmashes[t].users[x].order == 1 ? true : false,
                })
            }
        }
        //todo diun should be orgenized by order so diun order 1 be before users order 2
        if (pmashes[t].diun.length > 0) {
            for (let x = 0; x < pmashes[t].diun.length; x++) {
                let src22 = getProjectData(pmashes[t].projectId,"upic",pmashes[t].diun[x].users_permissions_user.data.id)

                pmashes[t].messege.push({
                    message: pmashes[t].diun[x].why,
                    what: pmashes[t].diun[x].what,
                    pic: src22,
                    sentByMe: pmashes[t].diun[x].users_permissions_user.data.id === myid ? true : false,
                })
            }
        }
    }
    pmashd = pmashes.length;
  localStorage.setItem("pmashd", pmashd);
    console.log(pmashes)
}

function sds(mta) {
    console.log("sdsa")
    for (let i = 0; i < mta.data.usersPermissionsUser.data.attributes.projects_1s.data.length; i++) {
        const z = mta.data.usersPermissionsUser.data.attributes.projects_1s.data[i]
        if (z.attributes.open_mashaabims.data.length > 0) {
            for (let j = 0; j <z.attributes.open_mashaabims.data.length; j++) {
                    const y = z.attributes.open_mashaabims.data[j]
                for (let m = 0; m < y.attributes.mashaabim.data.attributes.sps.data.length; m++) {
                    const x = y.attributes.mashaabim.data.attributes.sps.data[m];
                    sdsa.push({
                        projectid: z.id,
                        projectName: getProjectData(z.id,"pn"),
                        srcb: getProjectData(z.id,"pp"),
                        id: x.id,
                        price: x.attributes.price,
                        mashname: x.attributes.name,
                        myp: x.attributes.myp,
                        kindOf: x.attributes.kindOf,
                        spnot: x.attributes.spnot,
                        descrip: x.attributes.descrip,
                        oid: y.id
                    })
                }
            }
        }
    }
    sdsa = sdsa
                localStorage.setItem("sdsa", sdsa);
}
let walcomen = [];
function getProjectData(id,thing,uid){
    const projects = miData.data.usersPermissionsUser.data.attributes.projects_1s.data;
    if (projects.length > 0){
        for (let i = 0; i < projects.length ; i++){
            if (projects[i].id == id){
                if(thing == "pn"){
                    return projects[i].attributes.projectName
                } else if (thing == "pp"){
                    let srcP = ""
                       if (projects[i].attributes.profilePic.data != null) {
                            if (projects[i].attributes.profilePic.data.attributes.formats.thumbnail){
                            srcP = projects[i].attributes.profilePic.data.attributes.formats.thumbnail.url
                            } else{
                            srcP = projects[i].attributes.url
                            }
                        } else {
                            srcP = "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"
                        }
                    return srcP      
                } else if (thing == "noof"){
                    return projects[i].attributes.user_1s.data.length
                } else if (thing == "uids"){
                   return projects[i].attributes.user_1s.data.map(c => c.id)
                } else if (thing == "us"){
                    return projects[i].attributes.user_1s.data
                } else if (thing == "upic"){
                    for (let t = 0;t < projects[i].attributes.user_1s.data.length;t++  ){
                            if (projects[i].attributes.user_1s.data[t].id == uid){
                                let pic = null
                                if (projects[i].attributes.user_1s.data[t].attributes.profilePic.data !== null) {
                                    pic = projects[i].attributes.user_1s.data[t].attributes.profilePic.data.attributes.formats.thumbnail.url
                                } else {
                                    pic = null
                                }
                                return pic
                            }
                    }
                } else if (thing == "un"){
                    for (let t = 0;t < projects[i].attributes.user_1s.data.length;t++  ){
                        if (projects[i].attributes.user_1s.data[t].id == uid){
                         return projects[i].attributes.user_1s.data[t].attributes.username
                         }
                        }
                }
            }
        }
    } else {
        sendEror(miData.data.usersPermissionsUser.data.id,thing ,2000)
        return null
        //why am i here send error report to telegram
    }
}
function makeWalcom(ata) {
    const usernames = ata.data.usersPermissionsUser.data.attributes.username;
    for (let i = 0; i < ata.data.usersPermissionsUser.data.attributes.welcom_tops.data.length; i++) {
        const wal = ata.data.usersPermissionsUser.data.attributes.welcom_tops.data[i];
        console.log(wal)
        walcomen.push({
            id: wal.attributes.project.data.id,
            username: usernames,
            projectName: getProjectData(wal.attributes.project.data.id,"pn"),
            ani: "walcomen",
            azmi: "mesima",
            pl: 1
        })
    }
    walcomen = walcomen;
    wel = walcomen.length;
    walcomenold = []
            localStorage.setItem("wel", wel);
    if (!isEqual(walcomen, walcomenold) && counter > 1) {
        if (walcomenold.length < walcomen.length) {

            // Create and show the notification
            const rikn = walcomen[walcomen.length - 1].projectName

        //    let img = 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png';
            let text = `שלום ${usernames} ! הצטרפת בהצלחה לרקמת ${rikn}`;
            let linkop = "lev"      
            nutifi("1💗1 ריקמה חדשה",text,linkop )

         /*   navigator.serviceWorker.register('sw.js');
            Notification.requestPermission(function(result) {
                if (result === 'granted') {
                    navigator.serviceWorker.ready.then(function(registration) {
                        registration.showNotification('1💗1', {
                            body: text,
                            icon: img
                        });
                    });
                }
            });*/

            // let notification = new Notification('1💗1', { body: text, icon: img });
       }
    }

}

let pends = [];

function createpends(data) {
    let src24 = ""
    if (data.data.usersPermissionsUser.data.attributes.profilePic.data !== null) {
        src24 = data.data.usersPermissionsUser.data.attributes.profilePic.data.attributes.url
    } else {
        src24 = null
    }
    //rishonnnn so to create openM first avilable only to rishon then to rest of users..
    const myid = data.data.usersPermissionsUser.data.id;
    const projects = data.data.usersPermissionsUser.data.attributes.projects_1s.data;
    for (let i = 0; i < projects.length; i++) {
        for (let j = 0; j < projects[i].attributes.pendms.data.length; j++) {
            const pend = projects[i].attributes.pendms.data[j]
            pends.push({
                mysrc: src24,
                name: pend.attributes.name,
                nego: pend.attributes.nego,
                projectId: projects[i].id,
                hearotMeyuchadot: pend.attributes.hearotMeyuchadot,
                descrip: pend.attributes.descrip,
                noofhours: pend.attributes.noofhours,
                perhour: pend.attributes.perhour,
                projectName: getProjectData(projects[i].id,"pn"),
                user_1s: getProjectData(projects[i].id,"us"),
                src: getProjectData(projects[i].id,"pp"),
                noofusers:getProjectData(projects[i].id,"noof"),
                users: pend.attributes.users,
                myid: myid,
                diun: pend.attributes.diun,
                missionId: pend.attributes.mission.data.id,
                skills: pend.attributes.skills,
                tafkidims: pend.attributes.tafkidims,
                workways: pend.attributes.work_ways,
                vallues: pend.attributes.vallues,
                privatlinks: pend.attributes.privatlinks,
                publicklinks: pend.attributes.publicklinks,
                mdate: pend.attributes.sqadualed,
                pendId: pend.id,
                ani: "pends",
                azmi: "harchava",
                pl: 1 + pend.attributes.users.length,
                messege: []
            });
                        console.log("הגעתי בשלום")

        }
    }
    console.log(pends)
    for (let k = 0; k < pends.length; k++) {
        const x = pends[k].users
        pends[k].uids = [];
        for (let z = 0; z < x.length; z++) {
            pends[k].uids.push(x[z].users_permissions_user.data.id);
        }
    }
    for (let t = 0; t < pends.length; t++) {
        const allid = pends[t].uids;
        const myid = pends[t].myid;
        pends[t].already = false;
        pends[t].noofusersOk = 0;
        pends[t].noofusersNo = 0;
        pends[t].cv = 0
        pends[t].mypos = null;
        if (allid.includes(myid)) {
            pends[t].already = true;
            pends[t].pl += 48
            for (let l = 0; l < pends[t].users.length; l++) {
                if (pends[t].users[l].users_permissions_user.data.id === myid)
                    if (pends[t].users[l].order !== 1) {
                        pends[t].mypos = pends[t].users[l].what;
                    }
            }
        }
        for (let r = 0; r < pends[t].users.length; r++) {
            if (pends[t].users[r].order !== 1) {
                pends[t].cv += 1
                if (pends[t].users[r].what === true) {
                    pends[t].noofusersOk += 1;
                } else if (pends[t].users[r].what === false) {
                    pends[t].noofusersNo += 1;
                }
            }
        }
        const noofusersWaiting = pends[t].user_1s.length - pends[t].cv;
        pends[t].noofusersWaiting = noofusersWaiting;
        if (pends[t].users.length > 0) {
            for (let x = 0; x < pends[t].users.length; x++) {
                let src22 = getProjectData(pends[t].projectId,"upic",pends[t].users[x].users_permissions_user.data.id)
                pends[t].messege.push({
                    message: `${getProjectData(pends[t].projectId,"un",pends[t].users[x].users_permissions_user.data.id)}  
                     ${pends[t].users[x].what == true ? `בעד
                         ${pends[t].users[x].order == 4 ? ` הצעה חילופית `: ``}
                      ` : ` נגד
                  ${pends[t].users[x].order == 3 ? `ההצעה המקורית `: ``}
                      ${pends[t].users[x].why !== null ? `בנימוק: ${pends[t].users[x].why}` : ``}`}`,
                    what: pends[t].users[x].what,
                    pic: src22,
                    sentByMe: pends[t].users[x].users_permissions_user.data.id === myid ? true : false,
                    changed: pends[t].users[x].order == 1 ? true : false,
                })
            }
        }
        if (pends[t].diun.length > 0) {
            for (let x = 0; x < pends[t].diun.length; x++) {
                let src22 = getProjectData(pends[t].projectId,"upic",pends[t].diun[x].users_permissions_user.data.id)
                pends[t].messege.push({
                    message: pends[t].diun[x].why,
                    what: pends[t].diun[x].what,
                    pic: src22,
                    sentByMe: pends[t].diun[x].users_permissions_user.data.id === myid ? true : false,
                })
            }
        }
        if (pends[t].nego.length > 0) {
            for (let x = 0; x < pends[t].nego.length; x++) {
                let src22 = getProjectData(pends[t].projectId,"upic",pends[t].nego[x].users_permissions_user.data.id)
                pends[t].messege.push({
                    message: `${getProjectData(pends[t].projectId,"un",pends[t].nego[x].users_permissions_user.data.id)}
                     בעד ההצעה עם השינויים הבאים:
                  ${pends[t].nego[x].noofhours !== pends[t].noofhours ? `שלמשימה יוגדרו ${pends[t].nego[x].noofhours} שעות במקום ${pends[t].noofhours} שעות`: ``}
                  ${pends[t].nego[x].perhour !== pends[t].perhour ? `ושהשווי לשעה יהיה ${pends[t].nego[x].perhour} ולא ${pends[t].perhour}`: ``}

                  `,
                    what: true,
                    pic: src22,
                    sentByMe: pends[t].nego[x].users_permissions_user.data.id === myid ? true : false,
                })
            }
        }

    }
    pen = pends.length;
        localStorage.setItem("pen", pen);
    //  bubleUiAngin(pends)
}

function coinLapach(event) {

    // let oldob = arr1;
    //   const x = oldob.map(c => c.coinlapach);
    //   const indexy = x.indexOf(event.detail.coinlapach);
    //   oldob.splice(indexy, 1); 
    //   arr1 = oldob 
    counter = 0;
    cards == event.detail.cards;
    let ani = event.detail.ani;
    if (ani == "asked") {
        ask -= 1
    }
    //harchava mesima ishrur ziruf hazaa hachla
    console.log("im starting 2")
    start()

}

// one function to rull them all , pass all the difrrent to one arry then to sort by important then to have them render with if to check wwhat kind and which component.....

let xy = []

function bubleUiAngin() {
    arr1 = [...tverias, ...walcomen, ...askedcoin, ...meData, ...mtaha, ...pmashes, ...pends, ...wegets, ...fiapp, ...askedm, ...huca, ...haluask, ...hachlatot].sort(({
        pl: a
    }, {
        pl: b
    }) => a - b)
    arr1.forEach((item, i) => {
        item.coinlapach = i + 1;
        xy.push({
            id: i + 1,
            ch: false
        })
    });
    xy = xy
    betha.set(xy)
    localStorage.setItem("miDataLM", JSON.stringify(arr1));
    localStorage.setItem("betha", JSON.stringify(xy));

    createD()
    console.log(arr1)
    //sp;it to 2 4 diif ways , elgo if lengt > 3 split first 3 then 2 , another 5 and 4 ,, pay ottention to heart 
}
const defaulti = {"he": "מסך הלב", "en": "heart of 1💗1"}
let u = defaulti[$lang]

function hover(event) {
    u = event.detail.id
}
let cards = true;
async function cardsi(event) {
    cards = event.detail.cards
    console.log(cards, "from papa")
}
const title = {"he": "לב 1💗1", "en":"heart of 1💗1"}
 let milon = {
    hachla: true,
    fiap: true,
    welc: true,
    sugg: true,
    pend: true,
    asks: true,
    betaha: true,
    desi: true,
    ppmash: true,
    pmashs: true,
    pmaap: true,
    askmap: true
}




function cardsYaron() {
  //  dispatch("cards", {
  //      cards: true
  //  })
}

let toCoin = true

function showonly(event) {
    const value = event.detail.data;
    for (const key in milon) {
        milon[key] = false
    }

    milon[value] = true;
    toCoin = true
}

function showall(event) {
    for (const key in milon) {
        milon[key] = true
    }

}
</script>

<svelte:head>
    <title>{title[$lang]}</title>
</svelte:head>
{#if low == true}
  <!--  <audio id="my_audio" src="https://res.cloudinary.com/love1/video/upload/v1655748801/thunder-25689_taqapa.mp3" loop="loop"></audio>-->
    <div bind:clientHeight={h} bind:clientWidth={w} style="display:block;
        position:absolute;
        height:100vh;
        width:100vw;
        margin:auto;
        visability:hidden;
        z-index:10;
        top:0;left:0;right:0;bottom:0;
        background-color: transparent;
        overflow:hidden;">
        <svg xmlns="http://www.w3.org/2000/svg"  >
            <defs>
                <filter id="scatter" width="2" height="2" y="-.5" x="-.5" color-interpolation-filters="sRGB">
                    <feGaussianBlur stdDeviation="0.6" result="result1"/>
                        <feBlend in2="result1" result="fbSourceGraphic" mode="multiply"/>
                            <feTurbulence baseFrequency=".015" type="fractalNoise" numOctaves="6" result="result3"/>
                                <feDisplacementMap in="fbSourceGraphic" xChannelSelector="R" yChannelSelector="G" scale="60" result="result2" in2="result3"/>
                                    <feMorphology radius="0" operator="dilate" result="result4"/>
                                        <feBlend mode="screen" in2="result2"/>
                  </filter>
                  <filter id="glow" color-interpolation-filters="sRGB">
                                                <feFlood flood-opacity="1" flood-color="{innerFlash}" result="flood"/>
                                                    <feComposite in="flood" in2="SourceGraphic" operator="in" result="composite1"/>
                                                        <feGaussianBlur in="composite1" stdDeviation="10" result="blur"/>
                                                            <feOffset dx="0" dy="0" result="offset"/>
                                                                <feComposite in="SourceGraphic" in2="offset" result="composite2"/>
                  </filter>
              </defs>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg"  width="100vw" height="100vh" style="position:absolute; top:0; left:0;visibility:visible;-webkit-filter: drop-shadow( 0 0 20px {outerFlash});">
              <g id="mainBolt" filter="url(#scatter)">
                <path d="M {xyz}" fill="none" stroke="#fff" stroke-width="{Math.round(1 + Math.random() * 7)|0}" filter="url(#glow)"/>
              </g>
            </svg>
    </div>
{/if}
<DialogOverlay class="overlay" {isOpen} onDismiss={close} >
  <div transition:fly|local={{y: 450, opacity: 0.5, duration: 1000}}>
      <DialogContent aria-label="form" class="user ">
          <div dir="rtl" class="grid items-center justify-center text-center bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400">
              <button style="margin: 0 auto;" on:click={close} class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
                  title="סגירה"
                  ><svg style="width:24px;height:24px;z-index:999;" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
                  </svg></button>
              {#if mode == 1}
              <span  >
                <Hevel userId={eizeish} on:proj={proj}/>
              </span>
              {:else if mode == 2}
                <Rikma projectId={eizep} on:user={user} on:mesima={mesima}/>
              {:else if mode == 3}   
                <Levchat/>
              {:else if mode == 4}
               <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
                {:else if mode == 5}
                <Mesima missionId={eizeme} on:project={proj}/>
              {/if}
            </div>
        </DialogContent>
    </div>
</DialogOverlay>
 <!-- לשים בלוק של פוראיצ' על כל משימה בתהליך  הצעת משימה והחלטה ולמשוך שם משימה וכו' משם    {#if arr1.length > 0}
 -->
 {#if toCoin == true}
  {#if cards == true}
    <div class="cards-ui">
      <Tooltip title="{u}" ispic="true">
        <Cardsui
            {low}
            on:hover={hover}
            on:cards={cardsi}
            on:user={user}
            on:proj={proj}
            on:chat={chat}
            on:start={coinLapach}
            {arr1}
            {askedarr}
            {declineddarr}
            />
      </Tooltip>
    </div>
  {:else if cards == false}
    <Tooltip title="{u}" ispic="true">
        <Coinsui  on:hover={hover}
            {low}
            {milon}
            on:mesima={mesima}
            on:user={user}
            on:proj={proj}
            on:chat={chat}
            on:start={coinLapach}
            on:cards={cardsi}
            {adder}  {arr1} {askedarr}  {declineddarr} {halu}  {askma} {maap} {mashs} {pmashd}  {fia}  {beta}  {pen} {sug}  {nam} {wel} {ask} {picLink} {total}/>
      </Tooltip>
  {/if}
  {:else}
<Yahalomim low={false} {adder}  {arr1} {askedarr}  {declineddarr} {halu}  {askma} {maap} {mashs} {pmashd}  {fia}  {beta}  {pen} {sug}  {nam} {wel} {ask} {picLink} {total} 
     on:cards={cardsYaron}                                                                    
     on:showall={showall}
    on:showonly={showonly}
/>
  {/if}

<style>
:global([data-svelte-dialog-content].user) {
    width: 90vw;
    z-index: 1000;
    padding:  0px ;
    margin-top: 10px;
    margin-bottom: 10px;
}

:global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
}

@media (min-width: 568px) {
    :global([data-svelte-dialog-content].user) {
        width: 80vw;
        margin-top: 10px;

        margin-bottom: 10px;
        z-index: 1000;

    }

    :global([data-svelte-dialog-overlay].overlay) {
        z-index: 1000;
                    height:100vh ;

    }
}

.cards-ui {
    max-height: 100vh;
    max-width: 100vw;
    overflow: hidden;
}
</style>
