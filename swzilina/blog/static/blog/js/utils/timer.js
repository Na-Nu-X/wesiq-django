// Functions For Formatting Numbers For Timers

export function getFormattedSeconds(elapsed_seconds, leading_zero=false) {
    const result = elapsed_seconds % 60 // Number Value Of Elapsed Seconds

    return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Seconds If Format Parameter Is Set As True
}

export function getFormattedMinutes(elapsed_seconds, leading_zero=false) {
    const result = (Math.floor(elapsed_seconds / 60)) % 60 // Number Value Of Elapsed Minutes

    return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Minutes If Format Parameter Is Set As True
}

export function getFormattedHours(elapsed_seconds, leading_zero=false) {
    const result = (Math.floor(elapsed_seconds / 3600)) % 60 // Number Value Of Elapsed Hours

    return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Hours If Format Parameter Is Set As True
}