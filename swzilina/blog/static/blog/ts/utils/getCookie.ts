// Function For Get Cookie by Its Name
export function getCookie(cookie_name:string):string|undefined {
    const value:string = `; ${document.cookie}`
    const parts:string[] = value.split(`; ${cookie_name}=`)

    if(parts.length === 2) return parts.pop()!.split(";")[0]
}