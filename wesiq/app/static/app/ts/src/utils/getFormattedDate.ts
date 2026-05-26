// Function For Get The Formatted Date
export function getFormattedDate(text:string, show_year:boolean = true):string {
    const date:Date = new Date(text)

    let formatted_date:string =
        `${String(date.getDate()).padStart(2, "0")}.` + 
        `${String(date.getMonth() + 1).padStart(2, '0')}.`

    if(show_year) formatted_date += ` ${date.getFullYear()}`

    return formatted_date
}