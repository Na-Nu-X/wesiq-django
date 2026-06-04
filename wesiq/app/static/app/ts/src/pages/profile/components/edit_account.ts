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

    // Bio Links Form

    // Variables
    
    const bio_container:HTMLDivElement = edit_account_form.querySelector(".bio_container") as HTMLDivElement // Gets The Bio Container
    const bio_links:HTMLInputElement = bio_container.querySelector(".bio_links") as HTMLInputElement // Gets The Bio Links Hidden Input
    const icons:HTMLDivElement = bio_container.querySelector(".icons") as HTMLDivElement // Gets The Icons Container
    const links:HTMLDivElement = icons.querySelector(".links") as HTMLDivElement // Gets The Links Container
    const toggle_show_add_link_container:HTMLElement = icons.querySelector(".toggle_show_add_link_container") as HTMLElement // Gets The Toggle Show Bio Links Form Icon
    const add_link_container:HTMLDivElement = bio_container.querySelector(".add_link_container") as HTMLDivElement // Gets The Bio Links Form
    const url_input:HTMLInputElement = bio_container.querySelector(".url") as HTMLInputElement // Gets The URL Input
    const add_link_button:HTMLButtonElement = add_link_container.querySelector(".add_link") as HTMLButtonElement // Gets The Add Link Button

    // Functions

    // Function For Get The URL From String
    function getURL(string:string):URL|null {
        try {
            return new URL(string)
        }
        
        catch(_) {
            return null
        }
    }

    // Function For Check If The URL Already Exist In Some Link
    function isExistingLink(url:URL, container:HTMLDivElement):boolean {
        const all_links:NodeListOf<HTMLAnchorElement> = container.querySelectorAll<HTMLAnchorElement>("a") // Gets All Links
        return [...all_links].some(one_link => one_link.href === String(url)) // Returns True If The URL Already Exist
    }

    // Function For Create The Link
    function createLink(url:URL):HTMLAnchorElement {
        const link:HTMLAnchorElement = document.createElement("a") // Creates The Link
        const hostname:string = url.hostname // Gets The URL's Hostname
        
        link.href = String(url) // Sets The URL To The Link
        link.title = gettext("Otvoriť odkaz")
        link.target = "_blank"
        link.rel = "noopener noreferrer"

        if(hostname.includes("instagram.com")) link.innerHTML = "<i class='fa-brands fa-instagram'></i>" // https://fontawesome.com/icons/brands/solid/instagram
        else if(hostname.includes("facebook.com")) link.innerHTML = "<i class='fa-brands fa-facebook'></i>" // https://fontawesome.com/icons/brands/solid/facebook
        else if(hostname.includes("youtube.com")) link.innerHTML = "<i class='fa-brands fa-youtube'></i>" // https://fontawesome.com/icons/brands/solid/youtube
        else link.innerHTML = "<i class='fa-solid fa-link'></i>" // https://fontawesome.com/icons/link

        return link // Returns The Link
    }

    // Function For Store The New Link To The Hidden Input
    function storeNewLink(url:URL, input:HTMLInputElement):void {
        const current_bio_links:string[] = JSON.parse(input.value) || [] // Gets The Current Bio Links
        current_bio_links.push(String(url)) // Adds The New URL To The Bio Links
        bio_links.value = JSON.stringify(current_bio_links) // Stores The New Bio Links
    }

    // Events

    toggle_show_add_link_container.addEventListener("click", () => add_link_container.classList.toggle("active")) // Shows Or Hides The Bio Links Form

    // Add Link Button Click Functionality
    add_link_button.addEventListener("click", function():void {
        const entered_url:string = url_input.value // Gets The Entered URL

        if(getURL(entered_url)) {
            const url:URL|null = getURL(entered_url) // Gets The URL

            if(url && links.childElementCount < 3 && !isExistingLink(url, links)) {
                links.appendChild(createLink(url)) // Appends The Link To The Links Container
                storeNewLink(url, bio_links) // Stores The New Link To The Bio Links Hidden Input
            }
        }
    })

    // Add Emoji

    // Variables

    const bio:HTMLTextAreaElement = bio_container.querySelector(".bio") as HTMLTextAreaElement // Gets The Bio Textarea
    const add_emoji:HTMLElement = icons.querySelector(".add_emoji") as HTMLElement // Gets The Add Emoji Icon
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