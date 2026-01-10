// Fuction For Setting URL Parameter With Value
export function setURLParameter(parameter_name, parameter_value) {
    const page_url = new URL(window.location.href) // Gets The Current URL Address
    page_url.searchParams.set(parameter_name, parameter_value) // Adds Parameter With The Value to The URL
    window.location.href = page_url // Redirects The Page
}