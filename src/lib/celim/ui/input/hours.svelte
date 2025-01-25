<script>
    let hours = 0;
  let minutes = 0;
    export let total = timeDecimal
  function addMinutes(value) {
    let newMinutes = minutes + value;
    if (newMinutes >= 60) {
      hours += Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
    } else if (newMinutes < 0) {
      if (hours > 0) {
        hours -= 1;
        newMinutes = 60 + newMinutes;
      } else {
        newMinutes = 0;
      }
    }
    minutes = newMinutes;
  }

  // Function to convert hours and minutes to decimal
  function convertToDecimal() {
    return hours + minutes / 60;
  }

  // Simulate sending data to the server
   $: timeDecimal = convertToDecimal();
  
</script>

<div class="flex flex-col items-center space-y-4 bg-white p-6 rounded-lg shadow-lg w-64">
  <!-- Displaying the hours and minutes -->
  <div class="text-2xl font-semibold text-gray-700">
    {hours}h {minutes}m
  </div>

  <!-- Buttons to increase/decrease minutes -->
  <div class="flex space-x-4">
    <button
      class="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      on:click={() => addMinutes(-5)}
    >
      - 5 min
    </button>

    <button
      class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
      on:click={() => addMinutes(5)}
    >
      + 5 min
    </button>
  </div>

  <!-- Button to send the time in decimal format -->
  <button
    class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
    on:click={sendToServer}
  >
    Send Time
  </button>
</div>
