<script>
    // based on suggestions from:
    // Inclusive Components by Heydon Pickering https://inclusive-components.design/toggle-button/
    // On Designing and Building Toggle Switches by Sara Soueidan https://www.sarasoueidan.com/blog/toggle-switch-design/
    // and this example by Scott O'hara https://codepen.io/scottohara/pen/zLZwNv 


    export let label = "";
    export let design = 'inner label'
    export let options = [];
		export let fontSize = 13;
	  export let value = 'on';
  import {
    createEventDispatcher
} from 'svelte';

const dispatch = createEventDispatcher();
    let checked = true;
function cardsi (){

    dispatch("x")
}

		const uniqueID = Math.floor(Math.random() * 100)

    function handleClick(event){
        const target = event.target

        const state = target.getAttribute('aria-checked')

        checked = state === 'true' ? false : true

        value = checked === true ? 'on' : 'off'
    }
	
	  const slugify = (str = "") =>
    str.toLowerCase().replace(/ /g, "-").replace(/\./g, "");

</script>

<div class="s s--multi">
    <div role='radiogroup'
				 class="group-container"
				 aria-labelledby={`label-${uniqueID}`}
				 id="ggddd" >
{#if label.length > 0}    <div class='legend' id={`label-${uniqueID}`}>{label}</div>{/if}
        {#each options as option}
            <input type="radio" id={`${option}-${uniqueID}`} value={option} bind:group={value}/>
            <label for={`${option}-${uniqueID}`}>
                {#if option == true}
                <img alt="קלפים" class="imgi" style:height="20px" style:display="inherit"  src="https://res.cloudinary.com/love1/image/upload/v1653313408/credit-cards_vdsjnd.svg"/>
                {:else}
                <img alt="מטבעות" class="imgin" style:height="20px" style:display="inherit" style:width="20px" src="https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png"/>
                {/if}
            </label> 
        {/each}
    </div>
</div>


<style>
    .imgi{
        height: 20px;
        width: 20px;
    }
    #ggdddd{
        font-size: 6px;
    }
    @media (min-width:550px){
         #ggdddd{
        font-size: 13px;
    }
        .imgi{
        height: 20px;
        width: 30px;
    } 
    }
			:root {
		--accent-color:rgb(87, 208, 248);
		--gray: #ccc;
	}
  

    /* Multi Design Option */

    /* Based on suggestions from Sara Soueidan https://www.sarasoueidan.com/blog/toggle-switch-design/
    and this example from Scott O'hara https://codepen.io/scottohara/pen/zLZwNv */

    .s--multi .group-container {
        border: none;
        padding: 0;
        white-space: nowrap;
    }

  

    .s--multi label {
        display: inline-block;
        line-height: 1.6;
        position: relative;
        z-index: 2;
        color: rgb(8, 92, 182);
    }

    .s--multi input {
        opacity: 0;
        position: absolute;
    }

    .s--multi label:first-of-type {
        padding-right: 5em;
    }

    .s--multi label:last-child {
        margin-left: -5em;
        padding-left: 5em;
    }

    .s--multi:focus-within label:first-of-type:after {
        box-shadow: 0 0px 8px var(--accent-color);
        border-radius: 1.5em;
    }



    /* making the switch UI.  */
    .s--multi label:first-of-type:before,
    .s--multi label:first-of-type:after {
        content: "";
        height: 1.25em;
        overflow: hidden;
        pointer-events: none;
        position: absolute;
        vertical-align: middle;
    }

    .s--multi label:first-of-type:before {
        border-radius: 100%;
        z-index: 2;
        position: absolute;
        width: 1.2em;
        height: 1.2em;
        background: #fff;
        top: 0.2em;
        right: 1.2em;
        transition: transform 0.3s;
    }

    .s--multi label:first-of-type:after {
        background: var(--accent-color);
        border-radius: 1em;
        margin: 0 1em;
        transition: background .2s ease-in-out;
        width: 3em;
        height: 1.6em;
    }

    .s--multi input:first-of-type:checked ~ label:first-of-type:after {
        background: var(--gray);
    }

    .s--multi input:first-of-type:checked ~ label:first-of-type:before {
        transform: translateX(-1.4em);
    }

    .s--multi input:last-of-type:checked ~ label:last-of-type {
        z-index: 1;
    }

    .s--multi input:focus {
        box-shadow: 0 0px 8px var(--accent-color);
        border-radius: 1.5em;
    }


</style>