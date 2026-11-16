// Function For Get Day Name From Weekday Index In User's Country's Language (Sunday - 0, Monday - 1, Tuesday - 2, Wednesday - 3, Thursday - 4, Friday - 5, Saturday - 6)
export function getDayName(day_index:number, format:"long"|"short"|"narrow"="short"):string {
    if(!Number.isInteger(day_index)) return "" // Plans Without A Day (Rendered As "None") Have No Day Name

    const locale:string = navigator.languages?.[0] || navigator.language || "en-US"
    const date:Date = new Date(2024, 0, 7 + day_index)

    return new Intl.DateTimeFormat(locale, { weekday: format }).format(date)
}