// Function For Get Remaining Seconds From The Date
export function getRemainingSecondsFromDate(date:string):number {
    if(date.trim() === "") return 0

    const target_time:number = new Date(date).getTime() // Gets The Target Time In MS
    const current_time:number = Date.now() // Gets The Current Time In MS
    const remaining_seconds:number = Math.floor((target_time - current_time) / 1000) // Gets The Remaining Time In Seconds

    return Math.max(0, remaining_seconds) // Returns The Remaining Seconds Or 0 If The Date Has Already Passed
}