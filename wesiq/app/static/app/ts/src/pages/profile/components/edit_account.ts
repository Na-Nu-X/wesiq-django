"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Toggle Settings

    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const edit_account_form:HTMLFormElement = profile_container.querySelector(".edit_account_form") as HTMLFormElement // Gets The Edir Account Form
    const profile:HTMLDivElement = profile_container.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const toggle_settings:HTMLElement = profile_container.querySelector(".fa-gear") as HTMLElement // Gets The Toggle Settings Icon

    // Global Event Delegations

    toggle_settings.addEventListener("click", function():void {
        if(edit_account_form.classList.contains("hidden")) {
            profile.classList.add("hidden")
            edit_account_form.classList.remove("hidden")
        }

        else if(profile.classList.contains("hidden")) {
            edit_account_form.classList.add("hidden")
            profile.classList.remove("hidden")
        }
    })

    // Add Emoji

    // Variables

    const edit_review_form:HTMLFormElement = document.querySelector(".profile_container .edit_account_form") as HTMLFormElement // Gets The Edit Account Form
    const bio_container:HTMLDivElement = edit_review_form.querySelector(".bio_container") as HTMLDivElement // Gets The Bio Container
    const bio:HTMLTextAreaElement = bio_container.querySelector(".bio") as HTMLTextAreaElement // Gets The Bio Textarea
    const add_emoji:HTMLElement = bio_container.querySelector(".icons .add_emoji") as HTMLElement // Gets The Add Emoji Icon
    const emoji_picker_container:HTMLDivElement = bio_container.querySelector(".emoji_picker_container") as HTMLDivElement // Gets The Emoji Picker Container
    const picker:Element = emoji_picker_container.querySelector("emoji-picker") as Element // Gets The Emoji Picker

    // Events

    add_emoji.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour
    emoji_picker_container.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour

    // Add Emoji Icon Click Functionality
    add_emoji.addEventListener("click", function(event:PointerEvent):void {
        event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
        emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
    })

    // Picker Emoji Click Functionality
    picker.addEventListener("emoji-click", function(event:Event):void {
        const custom_event:CustomEvent<{
            unicode:string
        }> = event as CustomEvent<{ unicode: string }>
    
        const emoji:string = custom_event.detail.unicode // Gets The Clicked Emoji

        const start:number = bio.selectionStart
        const end:number = bio.selectionEnd
        const text:string = bio.value

        bio.value = text.substring(0, start) + emoji + text.substring(end) // Places The Emoji To The Cursor Position Of Bio Textarea
        bio.selectionStart = bio.selectionEnd = start + emoji.length // Sets The Cursor Of Bio Textarea Position Behind The Placed Emoji
        bio.focus() // Focuses The Bio Textarea
    })

    // Global Event Delegations

    // Document Click Functionality
    document.addEventListener("click", function(event:PointerEvent):void {
        // When The User Clicks Outside The Emoji Picker Container
        if(
            !(event.target as HTMLDivElement).classList.contains("emoji_picker_container") &&
            !(event.target as HTMLDivElement).closest(".emoji_picker_container")
        ) {
            emoji_picker_container.classList.add("hidden") // Hides The Emoji Picker Container
            return
        }
    })

    // Delete Profile Picture Warning

    const delete_profile_picture_checkbox:HTMLInputElement = document.querySelector("#delete_profile_picture") as HTMLInputElement
    const delete_profile_picture_image:HTMLImageElement = document.querySelector(".delete_profile_picture") as HTMLImageElement
    const form_report:HTMLParagraphElement = document.querySelector(".form_report") as HTMLParagraphElement

    delete_profile_picture_checkbox.addEventListener("click", function():void {
        if(this.checked) {
            delete_profile_picture_image.style.opacity = "1"
            form_report.textContent = gettext("Profilový obrázok bude odstránený")
            form_report.classList.add("error")
        }

        else {
            delete_profile_picture_image.style.opacity = "0.6"
            form_report.textContent = ""
        }
    })

    // Delete Account Warning

    const delete_account_checkbox:HTMLInputElement = document.querySelector("#delete_account") as HTMLInputElement
    const delete_account_image:HTMLImageElement = document.querySelector(".delete_account") as HTMLImageElement

    delete_account_checkbox.addEventListener("click", function():void {
        if(this.checked) {
            delete_account_image.style.opacity = "1"
            form_report.textContent = gettext("Váš úcet bude odstránený")
            form_report.classList.add("error")
        }

        else {
            delete_account_image.style.opacity = "0.6"
            form_report.textContent = ""
        }
    })

    // Password Reset

    const password_reset:HTMLAnchorElement = document.querySelector(".password_reset") as HTMLAnchorElement

    password_reset.addEventListener("click", function():void {
        document.cookie = `email_address=${this.dataset["email_address"]}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address

        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    })
})