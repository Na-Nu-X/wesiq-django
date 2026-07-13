"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Cancel Subscription

    // Variables

    const current_subscription_plan:HTMLDivElement = document.querySelector(".support_section .current_subscription_plan") as HTMLDivElement // Gets The Current Subscription Plan
    const cancel_subscription:HTMLButtonElement = current_subscription_plan.querySelector(".cancel_subscription") as HTMLButtonElement // Gets The Cancel Subscription Button
    const cancel_subscription_dialog:HTMLDialogElement = current_subscription_plan.querySelector(".cancel_subscription_dialog") as HTMLDialogElement // Gets The Cancel Subscription Dialog
    const cancel_subscription_form:HTMLDivElement = cancel_subscription_dialog.querySelector(".cancel_subscription_form") as HTMLDivElement // Gets The Cancel Subscription Form
    const no:HTMLButtonElement = cancel_subscription_form.querySelector(".buttons .no") as HTMLButtonElement // Gets The No Button

    // Events

    // Cancel Subscription Button Click Functionality
    cancel_subscription.addEventListener("click", function():void {
        cancel_subscription_dialog.showModal() // Shows The Cancel Subscription Dialog
    })

    // Cancel Subscription Dialog Click Functionality
    cancel_subscription_dialog.addEventListener("click", function(event:PointerEvent):void {
        const cancel_subscription_form_rect:DOMRect = cancel_subscription_form.getBoundingClientRect() // Gets The Cancel Subscription Form Rect

        if (
            event.clientX < cancel_subscription_form_rect.left ||
            event.clientX > cancel_subscription_form_rect.right ||
            event.clientY < cancel_subscription_form_rect.top ||
            event.clientY > cancel_subscription_form_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Cancel Subscription Dialog
        }
    })

    // No Button Click Functionality
    no.addEventListener("click", function():void {
        cancel_subscription_dialog.close() // Closes The Cancel Subscription Dialog
    })
})