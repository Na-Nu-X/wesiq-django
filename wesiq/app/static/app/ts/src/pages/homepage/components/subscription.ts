"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Cancel Subscription

    // Variables

    const current_subscription_plan:HTMLDivElement = document.querySelector(".support_section .current_subscription_plan") as HTMLDivElement // Gets The Current Subscription Plan
    const cancel_subscription:HTMLButtonElement = current_subscription_plan.querySelector(".cancel_subscription") as HTMLButtonElement // Gets The Cancel Subscription Button
    const cancel_subscription_dialog:HTMLDialogElement = current_subscription_plan.querySelector(".cancel_subscription_dialog") as HTMLDialogElement // Gets The Cancel Subscription Dialog
    const cancel_container:HTMLDivElement = cancel_subscription_dialog.querySelector(".cancel_container") as HTMLDivElement // Gets The Cancel Container

    // Events

    // Cancel Subscription Button Click Functionality
    cancel_subscription.addEventListener("click", function():void {
        cancel_subscription_dialog.showModal() // Shows The Cancel Subscription Dialog
    })

    // Cancel Subscription Dialog Click Functionality
    cancel_subscription_dialog.addEventListener("click", function(event:PointerEvent):void {
        const cancel_container_rect:DOMRect = cancel_container.getBoundingClientRect() // Gets The Cancel Container Rect

        if (
            event.clientX < cancel_container_rect.left ||
            event.clientX > cancel_container_rect.right ||
            event.clientY < cancel_container_rect.top ||
            event.clientY > cancel_container_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Cancel Subscription Dialog
        }
    })
})