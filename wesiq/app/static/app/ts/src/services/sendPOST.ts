import { getCookie } from "../utils/getCookie.js"

export interface response {
    success: boolean,
    message: string
}

// Function For Get The CSRF Token (Cookie First, Then The Hidden Field Rendered By {% csrf_token %})
export function getCsrfToken():string {
    const cookie_token:string|undefined = getCookie("csrftoken") // Gets The Token From The Cookie
    if(cookie_token) return cookie_token

    const field:HTMLInputElement|null = document.querySelector<HTMLInputElement>("input[name='csrfmiddlewaretoken']") // Gets The Hidden Field (Every Page Has One In The Footer)
    return field?.value ?? ""
}

// Function For Send Data By POST Method
export async function sendPOST(url_path:string = new URL(window.location.href).pathname, data:any|null = null, header_info:string = "") {
    const is_form_data:boolean = data instanceof FormData // Checks If The Data Are From The Form

    const options:RequestInit = {
        method: "POST",
        credentials: "same-origin",

        headers: {
            "X-CSRFToken": getCsrfToken(),
            "Accept": "application/json",
            "X-Requested-Action": header_info,
        },

        body: is_form_data ? data : JSON.stringify(data)
    }

    if(!is_form_data && data) (options.headers as any)["Content-Type"] = "application/json"

    try {
        const response:Response = await fetch(url_path, options)
        const content_type:string = response.headers.get("Content-Type") || "" // Gets The Content Type

        // Non-JSON Answers (E.g. A CSRF 403 Page Or An HTML Error Page) Become A Normal Failure, So The Callers Show Their Error Message
        if(!content_type.includes("application/json")) {
            console.error(`POST ${url_path} (${header_info || "form"}) returned HTTP ${response.status} without JSON`)

            return {
                success: false,
                message: gettext("Niečo sa pokazilo")
            }
        }

        return response.json()
    }

    catch(error) {
        console.error(error)

        return {
            success: false,
            message: gettext("Niečo sa pokazilo")
        }
    }
}
