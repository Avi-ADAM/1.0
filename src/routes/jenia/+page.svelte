<script>
  import Nego from "$lib/components/prPr/negoM.svelte";
  import { sanitizeUserInput } from "$lib/func/uti/sanitizeUserInput.svelte";
  import { lang } from "$lib/stores/lang.js";
  import { onMount } from "svelte";
  export let data
    let tex

  let c = []
  let y = []
  onMount(()=>{
    y = c
    lang.set(data.lang)
  })
  function oncli (){
    y.push(0)
    y = y
    console.log(y,c)
  }
</script>
<button on:click={oncli}>ooooo</button>
<div>
<Nego descrip="  Lorem ipsum dolor sit amet consectetur adipisicing elit. Dicta, labore nulla voluptates corporis est non quia natus magnam id dolor perferendis distinctio doloremque laboriosam at quisquam cum necessitatibus, rem tempora.
" 
skills={{
    "data": [
        {
            "id": "206",
            "attributes": {
                "skillName": "ניהול קבוצה בפייסבוק",
                "localizations": {
                    "data": [
                        {
                            "attributes": {
                                "skillName": "ניהול קבוצה בפייסבוק"
                            }
                        }
                    ]
                }
            },
        },
        {
            "id": "211",
            "attributes": {
                "skillName": "כתיבה טכנית",
                "localizations": {
                    "data": []
                }
            },
        },
        {
            "id": "1",
            "attributes": {
                "skillName": "Svelte",
                "localizations": {
                    "data": []
                }
            },
        },
        {
            "id": "10",
            "attributes": {
                "skillName": "strapi",
                "localizations": {
                    "data": []
                }
            },
        },
        {
            "id": "19",
            "attributes": {
                "skillName": "css",
                "localizations": {
                    "data": []
                }
            },
        },
        {
            "id": "29",
            "attributes": {
                "skillName": "svg",
                "localizations": {
                    "data": []
                }
            },
        },
        {
            "id": "70",
            "attributes": {
                "skillName": "Sveltekit",
                "localizations": {
                    "data": []
                }
            },
        },
        {
            "id": "74",
            "attributes": {
                "skillName": "Swiper",
                "localizations": {
                    "data": []
                }
            },
        }
    ]
}}
 name1 = "יענקל" privatlinks = "aaxa" mdate = {new Date} workways ={{
    "data":[
    {
        "id": "18",
        "attributes": {
            "workWayName": "startup",
            "localizations": {
                "data": []
            }
        }
    },
    {
        "id": "7",
        "attributes": {
            "workWayName": "Joint research",
            "localizations": {
                "data": []
            }
        }
    }]}} restime="feh" hearotMeyuchadot = "דויד" tafkidims = {{
    "data":[
    {
        "id": "2",
        "attributes": {
            "roleDescription": "תכנות",
            "localizations": {
                "data": [
                    {
                        "attributes": {
                            "roleDescription": "תכנות"
                        }
                    }
                ]
            }
        }
    },
    {
        "id": "38",
        "attributes": {
            "roleDescription": "שיווק דיגיטלי",
            "localizations": {
                "data": [
                    {
                        "attributes": {
                            "roleDescription": "שיווק דיגיטלי"
                        }
                    }
                ]
            }
        }
    },
    {
        "id": "17",
        "attributes": {
            "roleDescription": "קריאיטיב",
            "localizations": {
                "data": [
                    {
                        "attributes": {
                            "roleDescription": "קריאיטיב"
                        }
                    }
                ]
            }
        }
    }]}}></Nego>
    </div>
    <input bind:value={tex} type="text" on:change={()=>console.log(sanitizeUserInput(tex),tex)}>
<style>
  div {
    height: 100vh;
    width: 100%;
    background-color: black;
  }
</style>
