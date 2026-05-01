// Function For Get The Formatted Date
export function getFormattedDate(text:string):string {
    const date:Date = new Date(text)

    const formatted_date:string =
        `${String(date.getDate()).padStart(2, "0")}.` + 
        `${String(date.getMonth() + 1).padStart(2, '0')}. ` + 
        `${date.getFullYear()}`

    return formatted_date
}