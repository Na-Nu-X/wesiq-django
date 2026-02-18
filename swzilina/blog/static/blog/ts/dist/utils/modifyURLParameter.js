// Fuction For Set URL Parameter With Value
export function setURLParameter(parameter_name, parameter_value) {
    const page_url = new URL(window.location.href); // Gets The Current URL Address
    page_url.searchParams.set(parameter_name, parameter_value); // Adds Parameter With The Value to The URL
    window.location.href = String(page_url); // Redirects The Page
}
// Function For Delete URL Parameter
export function deleteURLParameter(parameter_name) {
    const page_url = new URL(window.location.href); // Gets The Current URL Address
    page_url.searchParams.delete(parameter_name); // Deletes Parameters In The URL
    window.location.href = String(page_url); // Redirects The Page
}
//# sourceMappingURL=modifyURLParameter.js.map