// Fuction For Setting Sort Parameter to URL Address
export function setSortParameter(parameter_value) {
    const page_url = new URL(window.location.href) // Gets Current URL

    page_url.searchParams.set("sort", parameter_value) // Adds Parameter With Value to The URL

    window.location.href = page_url // Redirects Page
}

// Fuction For Setting Category Parameter to URL Address
export function setCategoryParameter(parameter_value) {
    const page_url = new URL(window.location.href) // Gets Current URL

    page_url.searchParams.set("category", parameter_value) // Adds Parameter With Value to The URL

    window.location.href = page_url // Redirects Page
}

// Fuction For Setting Rating Parameter to URL Address
export function setRatingParameter(parameter_value) {
    const page_url = new URL(window.location.href) // Gets Current URL

    page_url.searchParams.set("rating", parameter_value) // Adds Parameter With Value to The URL

    window.location.href = page_url // Redirects Page
}