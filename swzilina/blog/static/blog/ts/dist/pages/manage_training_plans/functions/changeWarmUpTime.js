import { getFormattedTime, getElapsedSeconds } from "../../../utils/timer.js";
// Function For Changing Warm Up Time
export function changeWarmUpTime(warm_up, operation) {
    const timer = warm_up.querySelector(".timer_container h3"); // Gets Timer
    let elapsed_seconds = getElapsedSeconds(timer.textContent); // Gets Elapsed Seconds From Timer Value
    if (elapsed_seconds <= 30 && operation === "subtract")
        return; // Stop Subtracting When On Timer Is 30 Seconds
    if (elapsed_seconds === 3600 && operation === "add")
        return; // Stop Adding When On Timer Is 1 Hour
    if (operation === "subtract")
        elapsed_seconds -= 30; // Subtracts 30 Seconds
    if (operation === "add")
        elapsed_seconds += 30; // Adds 30 Seconds
    timer.textContent = `${getFormattedTime("minutes", elapsed_seconds)}:${getFormattedTime("seconds", elapsed_seconds, true)}`; // Sets New Timer Value
}
//# sourceMappingURL=changeWarmUpTime.js.map