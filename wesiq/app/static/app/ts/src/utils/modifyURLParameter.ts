// Fuction For Set URL Parameter With Value
export function setURLParameter(parameter_name:string, parameter_value:string):void {
    const page_url:URL = new URL(window.location.href) // Gets The Current URL Address
    page_url.searchParams.set(parameter_name, parameter_value) // Adds Parameter With The Value to The URL
    window.location.href = String(page_url) // Redirects The Page
}

// Function For Delete URL Parameter
export function deleteURLParameter(parameter_name:string):void {
    const page_url:URL = new URL(window.location.href) // Gets The Current URL Address
    page_url.searchParams.delete(parameter_name) // Deletes Parameters In The URL
    window.location.href = String(page_url) // Redirects The Page
}