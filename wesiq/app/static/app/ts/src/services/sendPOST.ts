import { getCookie } from "../utils/getCookie.js"

// Function For Send Data By POST Method
export function sendPOST<T>(url_path:string = new URL(window.location.href).pathname, data:T|null = null) {
    return fetch(url_path, {
        method: "POST",
        headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
            "Accept": "application/json"
        },
        body: JSON.stringify(data)
    }).then(
        response => response.json()
    ).catch(
        error => console.error(error)
    )
}