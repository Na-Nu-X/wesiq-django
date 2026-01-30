import { global_state } from "../state.js"

const HOLD_INTERVAL_SPEED = 50 // 20-Times Per Second
const HOLD_START_DELAY = 250 // Starts Hold Interval After 250MS Of Hold Time, Everything Above Is Just A Click

// Function For Start Hold Button Event
export function startHold(trigger) {
    global_state.hold_timeout = setTimeout(function() {
        global_state.hold_interval = setInterval(function() {
            trigger.call()
        }, HOLD_INTERVAL_SPEED)
    }, HOLD_START_DELAY)
}

// Function For Stop Hold Button Event
export function stopHold() {
    clearInterval(global_state.hold_interval)
    clearTimeout(global_state.hold_timeout)
}