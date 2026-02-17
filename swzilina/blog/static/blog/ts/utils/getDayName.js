// Function For Get Day Name From Weekday Index In User's Country's Language (Sunday - 0, Monday - 1, Tuesday - 2, Wednesday - 3, Thursday - 4, Friday - 5, Saturday - 6)
export function getDayName(day_index, format = "short") {
    const locale = navigator.languages?.[0] || navigator.language || "en-US";
    const date = new Date(2024, 0, 7 + day_index);
    return new Intl.DateTimeFormat(locale, { weekday: format }).format(date);
}
//# sourceMappingURL=getDayName.js.map