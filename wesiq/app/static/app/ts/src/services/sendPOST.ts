import { getCookie } from "../utils/getCookie.js"

export interface response {
    "success": boolean,
    "message": string
}

// Function For Send Data By POST Method
export async function sendPOST(url_path:string = new URL(window.location.href).pathname, data:any|null = null, header_info:string = "") {
    const is_form_data:boolean = data instanceof FormData // Checks If The Data Are From The Form
    
    const options:RequestInit = {
        method: "POST",

        headers: {
            "X-CSRFToken": getCookie("csrftoken") || "",
            "Accept": "application/json",
            "X-Requested-Action": header_info,
        },

        body: is_form_data ? data : JSON.stringify(data)
    }

    if(!is_form_data && data) (options.headers as any)["Content-Type"] = "application/json"

    const response:Response = await fetch(url_path, options)
    
    if(!response.ok) {
        const error:string = await response.text()
        console.error(error)
        throw new Error()
    }

    return response.json()
}