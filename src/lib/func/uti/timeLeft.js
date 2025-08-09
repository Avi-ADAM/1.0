// timeLeft.js - Only utility functions
function calculateTimeLeft(timegramaDate) {
  if (!timegramaDate) return 0;
  
  const targetDate = new Date(timegramaDate);
  const targetTime = targetDate.getTime();
  const now = Date.now();
  const timeLeft = Math.max(0, Math.floor((targetTime - now) / 1000)); // in seconds
  
  return timeLeft;
}

export { calculateTimeLeft };