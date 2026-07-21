"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Notifications

    // Variables

    const notifications_button:HTMLButtonElement = document.querySelector(".notifications") as HTMLButtonElement // Gets The Notifications Button
    const notifications_dialog:HTMLDialogElement = document.querySelector(".notifications_dialog") as HTMLDialogElement // Gets The Notifications Dialog
    const all_messages:HTMLDivElement = notifications_dialog.querySelector(".all_messages") as HTMLDivElement // Gets The All Messages Container

    // Events

    // Notifications Button Click Functionality
    notifications_button.addEventListener("click", function():void {
        notifications_dialog.showModal() // Shows The Notifications Dialog
    })

    // Followers Dialog Click Functionality
    notifications_dialog.addEventListener("click", function(event:PointerEvent):void {
        const all_followers_rect:DOMRect = all_messages.getBoundingClientRect() // Gets The All Messages Container Rect

        if (
            event.clientX < all_followers_rect.left ||
            event.clientX > all_followers_rect.right ||
            event.clientY < all_followers_rect.top ||
            event.clientY > all_followers_rect.bottom ||
            (event.target as HTMLAnchorElement).classList.contains("back") ||
            ((event.target as HTMLElement).parentNode as HTMLAnchorElement).classList.contains("back")
        ) {
            this.close() // Closes The Notifications Dialog
        }
    })
})