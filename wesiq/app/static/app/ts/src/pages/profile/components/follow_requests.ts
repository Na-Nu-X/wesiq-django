import { 
    approveFollowRequest, 
    rejectFollowRequest 
} from "../functions/followRequests.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Follow Requests

    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const follow_container:HTMLDivElement = profile_container.querySelector(".profile_content .profile .middle .follow_container") as HTMLDivElement // Gets The Follow Container
    const show_follow_requests:HTMLButtonElement = follow_container.querySelector(".show_follow_requests") as HTMLButtonElement // Gets The Show Follow Requests Button
    const follow_requests_dialog:HTMLDialogElement = follow_container.querySelector(".follow_requests_dialog") as HTMLDialogElement // Gets The Follow Requests Dialog
    const all_follow_requests:HTMLDivElement = follow_requests_dialog.querySelector(".all_follow_requests") as HTMLDivElement // Gets The All Follow Requests Container

    // Events

    // Show Follow Requests Button Click Functionality
    show_follow_requests.addEventListener("click", function():void {
        follow_requests_dialog.showModal() // Shows The Follow Requests Dialog
    })

    // Follow Requests Dialog Click Functionality
    follow_requests_dialog.addEventListener("click", function(event:PointerEvent):void {
        const all_follow_requests_rect:DOMRect = all_follow_requests.getBoundingClientRect() // Gets The All Follow Requests Container Rect

        if (
            event.clientX < all_follow_requests_rect.left ||
            event.clientX > all_follow_requests_rect.right ||
            event.clientY < all_follow_requests_rect.top ||
            event.clientY > all_follow_requests_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Follow Requests Dialog
        }
    })

    // Global Event Delegations

    // All Follow Requests Click Functionalities
    all_follow_requests.addEventListener("click", async function(event:PointerEvent):Promise<void> {
        const follow_requests_info:HTMLParagraphElement = follow_requests_dialog.querySelector(".follow_requests_info") as HTMLParagraphElement // Gets The Follow Requests Info Paragraph
        const follow_requests_amount:HTMLSpanElement = follow_requests_info.querySelector(".follow_requests_amount") as HTMLSpanElement // Gets The Follow Requests Amount
        const follow_requests_amount_notification:HTMLSpanElement = show_follow_requests.querySelector(".follow_requests_amount") as HTMLSpanElement // Gets The Follow Requests Amount

        // Approve Follow Request
        if((event.target as HTMLElement).closest(".approve")) {
            const one_follow_request:HTMLDivElement = (event.target as HTMLElement).closest(".one_follow_request") as HTMLDivElement // Gets The One Follow Request Container
            const follow_request_id:number|null = Number(one_follow_request.dataset["id"]) || null // Gets The Follow Request ID

            if(follow_request_id) {
                await approveFollowRequest(follow_request_id) // Approves The Follow Request

                one_follow_request.classList.add("hidden") // Hides The One Follow Request Container
                follow_requests_amount_notification.textContent = String(Number(follow_requests_amount_notification.textContent) - 1) // Updates The Follow Requests Amount

                if(Number(follow_requests_amount.textContent) - 1 !== 0) {
                    follow_requests_amount.textContent = String(Number(follow_requests_amount.textContent) - 1) // Updates The Follow Requests Info Paragraph
                }

                else {
                    follow_requests_dialog.classList.add("no_requests") // Adds The No Requests Class
                    follow_requests_amount.textContent = follow_requests_info.textContent = gettext("Žiadne žiadosti o sledovanie") // Updates The Follow Requests Info Paragraph
                }
            }
        }

        // Reject Follow Request
        if((event.target as HTMLElement).closest(".reject")) {
            const one_follow_request:HTMLDivElement = (event.target as HTMLElement).closest(".one_follow_request") as HTMLDivElement // Gets The One Follow Request Container
            const follow_request_id:number|null = Number(one_follow_request.dataset["id"]) || null // Gets The Follow Request ID

            if(follow_request_id) {
                await rejectFollowRequest(follow_request_id) // Rejects The Follow Request

                one_follow_request.classList.add("hidden") // Hides The One Follow Request Container
                follow_requests_amount_notification.textContent = String(Number(follow_requests_amount_notification.textContent) - 1) // Updates The Follow Requests Amount

                if(Number(follow_requests_amount.textContent) - 1 !== 0) {
                    follow_requests_amount.textContent = String(Number(follow_requests_amount.textContent) - 1) // Updates The Follow Requests Info Paragraph
                }

                else {
                    follow_requests_dialog.classList.add("no_requests") // Adds The No Requests Class
                    follow_requests_amount.textContent = follow_requests_info.textContent = gettext("Žiadne žiadosti o sledovanie") // Updates The Follow Requests Info Paragraph
                }
            }
        }
    })
})