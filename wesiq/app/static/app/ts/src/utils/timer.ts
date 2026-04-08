// Function For Formatting Time
export function getFormattedTime(unit:string = "seconds", elapsed_seconds:number = 0, leading_zero:boolean = false):string {
    // Formats Seconds
    if(unit === "seconds") {
        const result:string = String(elapsed_seconds % 60) // Number Value Of Elapsed Seconds
        return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Seconds If Format Parameter Is Set As True
    }

    // Formats Minutes
    if(unit === "minutes") {
        const result:string = String((Math.floor(elapsed_seconds / 60)) % 60) // Number Value Of Elapsed Minutes
        return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Minutes If Format Parameter Is Set As True
    }

    // Formats Hours
    if(unit === "hours") {
        const result:string = String((Math.floor(elapsed_seconds / 3600)) % 60) // Number Value Of Elapsed Hours
        return leading_zero === true ? result.toString().padStart(2, "0") : result // Returns Formatted Style Of Elapsed Hours If Format Parameter Is Set As True
    }

    else return leading_zero === true ? "00" : "0" // Default Values
}

// Function For Formatting Time To Minimalist Format
export function getMinimalistFormattedTime(elapsed_time:number):string {
    // For Example Converts 3600 To 1h
    return (
        `${getFormattedTime("hours", elapsed_time) !== "0" ? getFormattedTime("hours", elapsed_time) + "h" : ""}
        ${getFormattedTime("minutes", elapsed_time) !== "0" ? getFormattedTime("minutes", elapsed_time) + "m" : ""}
        ${getFormattedTime("seconds", elapsed_time) !== "0" ? getFormattedTime("seconds", elapsed_time) + "s" : ""}`
    )
}

// Function For Convert Time String To Elapsed Seconds (For Example: From 5:00 To 300)
export function getElapsedSeconds(string:string):number {
    const minutes:number = Number(string.split(":")[0]) // Gets Minutes From The Timer
    const seconds:number = Number(string.split(":")[1]) // Gets Seconds From The Timer

    return minutes * 60 + seconds // Returns Elapsed Seconds
}