// Function For Get Cookie by Its Name

export function getCookie(cookie_name) {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${cookie_name}=`)
    if (parts.length === 2) return parts.pop().split(";")[0]
}