// @ts-ignore
import { isValidPhoneNumber } from "https://cdn.jsdelivr.net/npm/libphonenumber-js@1.10.44/+esm"

import { formatPhoneNumber } from '../../../utils/formatPhoneNumber.js'

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Toggle Settings

    // Variables

    const profile_container:HTMLDivElement = document.querySelector(".profile_container") as HTMLDivElement // Gets The Profile Container
    const edit_account_form:HTMLFormElement = profile_container.querySelector(".edit_account_form") as HTMLFormElement // Gets The Edir Account Form
    const profile:HTMLDivElement = profile_container.querySelector(".profile") as HTMLDivElement // Gets The Profile Container
    const toggle_settings:HTMLButtonElement = profile_container.querySelector(".toggle_settings") as HTMLButtonElement // Gets The Toggle Settings Icon

    // Global Event Delegations

    toggle_settings.addEventListener("click", function():void {
        if(edit_account_form.classList.contains("hidden")) {
            profile.classList.add("hidden") // Adds The Hidden Class
            profile.inert = true // Disables Focus

            edit_account_form.classList.remove("hidden") // Removes The Hidden Class
            edit_account_form.inert = false // Enables Focus
        }

        else if(profile.classList.contains("hidden")) {
            edit_account_form.classList.add("hidden") // Adds The Hidden Class
            edit_account_form.inert = true // Disables Focus

            profile.classList.remove("hidden") // Removes The Hidden Class
            profile.inert = false // Enables Focus
        }
    })

    // Bio Links Form

    // Variables
    
    const bio_container:HTMLDivElement = edit_account_form.querySelector(".bio_container") as HTMLDivElement // Gets The Bio Container
    const bio_links:HTMLInputElement = bio_container.querySelector(".bio_links") as HTMLInputElement // Gets The Bio Links Hidden Input
    const added_links_container:HTMLDivElement = edit_account_form.querySelector(".added_links_container") as HTMLDivElement // Gets The Added Links Container
    
    const icons:HTMLDivElement = bio_container.querySelector(".icons") as HTMLDivElement // Gets The Icons Container
    const add_link_form:HTMLDivElement = icons.querySelector(".add_link_form") as HTMLDivElement // Gets The Add Link Form
    const url_input:HTMLInputElement = add_link_form.querySelector(".form .url") as HTMLInputElement // Gets The URL Input
    const add_link_button:HTMLButtonElement = add_link_form.querySelector(".form .add_link") as HTMLButtonElement // Gets The Add Link Button

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

    // Function For Get The Domain From The URL (For Example: https://www.instagram.com/ -> instagram.com)
    function getDomain(url:URL):string {
        return new URL(url).hostname.replace(/^www\./, "")
    }

    // Function For Check If The URL Already Exist In Some Link
    function isExistingLink(url:URL, container:HTMLDivElement):boolean {
        const all_links:NodeListOf<HTMLAnchorElement> = container.querySelectorAll<HTMLAnchorElement>("a") // Gets All Links
        return [...all_links].some(one_link => one_link.href === String(url)) // Returns True If The URL Already Exist
    }

    // Function For Create The Link
    function createLink(url:URL):HTMLDivElement {
        // Link Container
        const link:HTMLDivElement = document.createElement("div") // Creates The Link Container
        link.classList.add("link") // Adds The Link Class

        // Anchor
        const anchor:HTMLAnchorElement = document.createElement("a") // Creates The Anchor
        anchor.href = String(url) // Sets The URL To The Link
        anchor.title = gettext("Otvoriť odkaz")
        anchor.ariaLabel = gettext("Otvoriť odkaz")
        anchor.target = "_blank"
        anchor.rel = "noopener noreferrer"

        // Icon
        const hostname:string = url.hostname // Gets The URL's Hostname

        if(hostname.includes("instagram.com")) anchor.innerHTML = "<i class='fa-brands fa-instagram'></i>" // https://fontawesome.com/icons/brands/solid/instagram
        else if(hostname.includes("facebook.com")) anchor.innerHTML = "<i class='fa-brands fa-facebook'></i>" // https://fontawesome.com/icons/brands/solid/facebook
        else if(hostname.includes("youtube.com")) anchor.innerHTML = "<i class='fa-brands fa-youtube'></i>" // https://fontawesome.com/icons/brands/solid/youtube
        else anchor.innerHTML = "<i class='fa-solid fa-link'></i>" // https://fontawesome.com/icons/link

        anchor.innerHTML += getDomain(url)

        link.appendChild(anchor) // Appends The Anchor To The Link Container

        const remove_link:HTMLButtonElement = document.createElement("button") as HTMLButtonElement // Creates The Remove Button
        remove_link.classList.add("remove_link") // Adds The Remove Link Class
        remove_link.type = "button" // Prevents The Submit Of Edit Account Form
        remove_link.title = gettext('Odstrániť odkaz')
        remove_link.innerHTML += "<i class='fa-solid fa-xmark'></i>" // https://fontawesome.com/icons/xmark
        link.appendChild(remove_link) // Appends The Remove Link Button To The Link Container

        return link // Returns The Link
    }

    // Function For Store The New Link To The Hidden Input
    function storeNewLink(url:URL, input:HTMLInputElement):void {
        const current_bio_links:string[] = JSON.parse(input.value) || [] // Gets The Current Bio Links
        current_bio_links.push(String(url)) // Adds The New URL To The Bio Links
        input.value = JSON.stringify(current_bio_links) // Stores The New Bio Links
    }

    // Function For Remove The Added Link
    function removeAddedLink(link:HTMLDivElement, input:HTMLInputElement):void {
        const current_bio_links:string[] = JSON.parse(input.value) || [] // Gets The Current Bio Links
        const anchor:HTMLAnchorElement = link.querySelector("a") as HTMLAnchorElement // Gets The Anchor
        const link_index:number = current_bio_links.indexOf(anchor.href) // Gets The Index Of The Link

        if(link_index !== -1) {
            current_bio_links.splice(link_index, 1) // Removes The Link From The Current Bio Links
            input.value = JSON.stringify(current_bio_links) // Stores The Updated Bio Links
        }

        link.remove() // Removes The Link From DOM
    }

    function initializeStoredLinks(added_links_container:HTMLDivElement):void {
        added_links_container.querySelectorAll<HTMLDivElement>(".link").forEach(function(one_link:HTMLDivElement):void {
            const anchor:HTMLAnchorElement = one_link.querySelector("a") as HTMLAnchorElement // Gets The Anchor
            const url:URL|null = getURL(anchor.href) // Gets The URL
    
            if(url) storeNewLink(url, bio_links) // Stores The New Link To The Bio Links Hidden Input
        })
    }

    // Events

    // Add Link Button Click Functionality
    add_link_button.addEventListener("click", function():void {
        const entered_url:string = url_input.value // Gets The Entered URL

        if(getURL(entered_url)) {
            const url:URL|null = getURL(entered_url) // Gets The URL

            if(url && added_links_container.childElementCount < 3 && !isExistingLink(url, added_links_container)) {
                added_links_container.appendChild(createLink(url)) // Appends The Link To The Links Container
                storeNewLink(url, bio_links) // Stores The New Link To The Bio Links Hidden Input
            }
        }
    })

    // Global Event Delegations

    // Added Links Container Click Functionality
    added_links_container.addEventListener("click", function(event:PointerEvent):void {
        // Remove Added Link
        if((event.target as HTMLElement).classList.contains("remove_link")) {
            const link:HTMLDivElement = (event.target as HTMLElement).closest(".link") as HTMLDivElement // Gets The Link Container
            removeAddedLink(link, bio_links) // Removes The Added Link
        }
    })

    // Initialization

    initializeStoredLinks(added_links_container) // Initializes The Stored Links

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

    // Toggle Data Saving Mode

    // Variables

    const account_properties:HTMLDivElement = edit_account_form.querySelector(".header .account_properties") as HTMLDivElement // Gets The Account Properties Popover Menu
    const data_saving_mode_container:HTMLDivElement = account_properties.querySelector(".data_saving_mode_container") as HTMLDivElement // Gets The Data Saving Mode Container
    const data_saving_mode_checkbox:HTMLInputElement = data_saving_mode_container.querySelector("#data_saving_mode") as HTMLInputElement // Gets The Data Saving Mode Checkbox
    const data_saving_mode_label:HTMLLabelElement = data_saving_mode_container.querySelector("label") as HTMLLabelElement // Gets The Data Saving Mode Label

    // Global Event Delegations

    // Data Saving Mode Label Keydown Functionality
    data_saving_mode_label.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            console.log(data_saving_mode_checkbox)
            data_saving_mode_checkbox.click() // Checks / Unchecks The Data Saving Mode Checkbox
        }
    })

    // Toggle Private Account

    // Variables

    const private_account_container:HTMLDivElement = account_properties.querySelector(".private_account_container") as HTMLDivElement // Gets The Private Account Container
    const private_account_checkbox:HTMLInputElement = private_account_container.querySelector("#private_account") as HTMLInputElement // Gets The Private Account Checkbox
    const private_account_label:HTMLLabelElement = private_account_container.querySelector("label") as HTMLLabelElement // Gets The Private Account Label
    const private_account_icon:HTMLElement = private_account_container.querySelector("i") as HTMLElement // Gets The Private Account Icon

    // Events

    // Private Account Checkbox Change Functionality
    private_account_checkbox.addEventListener("change", function():void {
        this.checked ? private_account_icon.classList.replace("fa-lock-open", "fa-lock") : private_account_icon.classList.replace("fa-lock", "fa-lock-open") // https://fontawesome.com/icons/lock / https://fontawesome.com/icons/lock-open
    })

    // Global Event Delegations

    // Private Account Label Keydown Functionality
    private_account_label.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            private_account_checkbox.click() // Checks / Unchecks The Private Account Checkbox
            private_account_checkbox.checked ? private_account_icon.classList.replace("fa-lock-open", "fa-lock") : private_account_icon.classList.replace("fa-lock", "fa-lock-open") // https://fontawesome.com/icons/lock / https://fontawesome.com/icons/lock-open
        }
    })

    // Toggle Delete Profile Picture

    // Variables

    const delete_profile_picture_container:HTMLDivElement = account_properties.querySelector(".delete_profile_picture_container") as HTMLDivElement // Gets The Delete Profile Picture Container
    const delete_profile_picture_checkbox:HTMLInputElement = delete_profile_picture_container.querySelector("#delete_profile_picture") as HTMLInputElement // Gets The Delete Profile Picture Checkbox
    const delete_profile_picture_label:HTMLLabelElement = delete_profile_picture_container.querySelector("label") as HTMLLabelElement // Gets The Delete Profile Picture Label

    // Global Event Delegations

    // Private Account Label Keydown Functionality
    delete_profile_picture_label.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") delete_profile_picture_checkbox.click() // Checks / Unchecks The Private Account Checkbox
    })

    // Toggle Delete Account

    // Variables

    const form_report:HTMLParagraphElement = edit_account_form.querySelector(".form_report") as HTMLParagraphElement
    const delete_account_container:HTMLDivElement = account_properties.querySelector(".delete_account_container") as HTMLDivElement // Gets The Delete Account Container
    const delete_account_checkbox:HTMLInputElement = delete_account_container.querySelector("#delete_account") as HTMLInputElement
    const delete_account_label:HTMLLabelElement = delete_account_container.querySelector("label") as HTMLLabelElement // Gets The Delete Account Label

    // Events

    delete_account_checkbox.addEventListener("click", function():void {
        if(this.checked) {
            form_report.textContent = gettext("Váš úcet bude odstránený")
            form_report.classList.add("error")
        }

        else form_report.textContent = ""
    })

    // Global Event Delegations

    // Private Account Label Keydown Functionality
    delete_account_label.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") delete_account_checkbox.click() // Checks / Unchecks The Private Account Checkbox
    })

    // Phone Number

    // Variables

    const phone_number_container:HTMLDivElement = edit_account_form.querySelector(".inputs .phone_number_container") as HTMLDivElement // Gets Phone Number Container
    const phone_number:HTMLInputElement = phone_number_container.querySelector(".phone_number") as HTMLInputElement // Gets Phone Number Input
    const flag:HTMLImageElement = phone_number_container.querySelector(".flag") as HTMLImageElement // Gets Flag Image
    const edit_account_form_submit:HTMLInputElement = edit_account_form.querySelector(".edit_account_form_submit") as HTMLInputElement // Gets The Edit Account Form Submit Button

    // Events

    phone_number.addEventListener("input", () => formatPhoneNumber(phone_number, flag)) // Formats The Phone Number

    // Phone Number Blur Functionality
    phone_number.addEventListener("blur", function():void {
        if(!this.value) return
        isValidPhoneNumber(this.value) ? this.style.borderBottomColor = "#52cf20" : this.style.borderBottomColor = "#df3535" // Validates The Phone Number
    })

    // Edit Account Form Submit Button Click Functionality
    edit_account_form_submit.addEventListener("click", function(event:PointerEvent):void {
        if(!isValidPhoneNumber(phone_number.value)) event.preventDefault() // Prevents Default Behaviour
    })

    // Password Reset

    // Variables

    const password_reset:HTMLAnchorElement = edit_account_form.querySelector(".form_questions .password_reset") as HTMLAnchorElement

    // Events

    password_reset.addEventListener("click", function():void {
        document.cookie = `email_address=${this.dataset["email_address"]}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With User's Email Address
        document.cookie = `password_reset_timer=${Date.now() + 10 * 60 * 1000}; max-age=` + 60 * 10 + "; path=/" // 10 Minutes Timed Cookie With Timer
    })
})