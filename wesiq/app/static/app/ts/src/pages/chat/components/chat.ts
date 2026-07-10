import { displayMessage } from "../../../utils/displayMessage.js"
import { focusAtEnd, getCursorPosition } from "../../community/functions/customTextarea.js"

interface ChatMessage {
    action:"new"|"edit"|"delete"|"add_reaction"|"remove_reaction",
    chat_id?:number,
    message?:string,
    formatted_time?:string,
    sender_id?:number,
    emoji_sender_username?:string,
    sender_profile_picture_name?:string,
    emoji?:string
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Chat Socket

    // Variables

    const chat:HTMLDivElement = document.querySelector(".chat") as HTMLDivElement // Gets The Chat Container
    const all_messages:HTMLDivElement = chat.querySelector(".middle .all_messages") as HTMLDivElement // Gets The All Messages Container
    const one_message_template:HTMLTemplateElement = chat.querySelector(".one_message_template") as HTMLTemplateElement // Gets The One Message Template
    const logged_in_user_id:number|null = Number(all_messages.dataset["logged_in_user_id"]) || null // Gets The Logged In User ID

    const write_message:HTMLDivElement = chat.querySelector(".bottom .write_message") as HTMLDivElement // Gets The Write Message Container
    const new_message:HTMLDivElement = write_message.querySelector(".new_message") as HTMLDivElement // Gets The New Message Custom Input

    const current_url:string = window.location.pathname // Gets The Current URL
    const url_parts:string[] = current_url.split('/') // Splits The URL
    const username:string = url_parts[url_parts.length - 1] || url_parts[url_parts.length - 2] as string // Gets The Receiver's Username From The URL (For Example @patrik_behul)

    // Creates The Chat Socket
    const chat_socket:WebSocket = new WebSocket(
        window.location.protocol === "http:" ? `ws://${window.location.host}/ws/chat/${username}/` : `wss://${window.location.host}/ws/chat/${username}/`
    )

    // Functions

    // Function For Mark Messages As Read
    function markMessagesAsRead():void {
        if(chat_socket.readyState === WebSocket.OPEN) {
            // Sends The Action
            chat_socket.send(JSON.stringify({
                "action": "mark_as_read"
            }))
        }
    }

    // Events

    // Succeeded Open Of Chat Socket
    chat_socket.onopen = function():void {
        markMessagesAsRead() // Marks Messages As Read
    }

    // Response From The Server (The DOM Changes Will Be Visible To Every User In Chat)
    chat_socket.onmessage = function(event:MessageEvent<any>):void {
        const data:ChatMessage = JSON.parse(event.data) // Gets The Data

        // New Message
        if(data.action === "new") {
            const chat_id:number = data.chat_id as number // Gets The Chat ID
            const message_content:string = data.message as string // Gets The Message Content
            const formatted_time:string = data.formatted_time as string // Gets The Formatted Time
            const sender_id:number = data.sender_id as number // Gets The Sender's ID
            const sender_profile_picture_name:string = data.sender_profile_picture_name as string // Gets The Sender's Profile Picture Name
    
            const one_message_template_clone:DocumentFragment = one_message_template.content.cloneNode(true) as DocumentFragment // Clones The One Message Template Content
            
            // One Message Container
            const one_message:HTMLDivElement = one_message_template_clone.querySelector(".one_message") as HTMLDivElement // Creates The One Message Container
            one_message.dataset["chat_id"] = String(chat_id) // Stores The Chat ID
            one_message.dataset["time"] = formatted_time // Shows The Formatted Time
            logged_in_user_id && logged_in_user_id === sender_id ? one_message.classList.add("sender") : one_message.classList.add("receiver") // Adds The Sender Or The Receiver Class
            
            // Profile Picture
            const profile_picture:HTMLImageElement = one_message.querySelector(".profile_picture") as HTMLImageElement // Gets The Profile Picture
            profile_picture.src = sender_profile_picture_name ? `/../media/images/${sender_id}/${sender_profile_picture_name}` : "/../static/images/profile_picture.png"; // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440
            
            // Message Content
            (one_message.querySelector("p") as HTMLParagraphElement).textContent = message_content // Shows The Message Content
            
            // Show Message Properties Button
            const show_message_properties_button:HTMLButtonElement = one_message.querySelector(".show_message_properties_button") as HTMLButtonElement // Gets The Show Message Properties Button
            show_message_properties_button.setAttribute("popovertarget", `message_properties_${chat_id}`) // Links The Popover
            show_message_properties_button.style = `anchor-name: --show_message_properties_button_${chat_id}` // Creates The Anchor
            
            // Message Properties
            const message_properties:HTMLDivElement = one_message.querySelector(".message_properties") as HTMLDivElement // Gets The Message Properties Container
            message_properties.id = `message_properties_${chat_id}` // Sets The ID
            message_properties.style = `position-anchor: --show_message_properties_button_${chat_id}` // Links The Anchor

            // Add Reaction Button
            const add_reaction_button:HTMLButtonElement = message_properties.querySelector(".add_reaction_button") as HTMLButtonElement // Gets The Add Reaction Button
            add_reaction_button.setAttribute("popovertarget", `add_reaction_${chat_id}`) // Links The Popover
            add_reaction_button.style = `anchor-name: --add_reaction_button_${chat_id}` // Creates The Anchor

            // Add Reaction Container
            const add_reaction:HTMLDivElement = message_properties.querySelector(".add_reaction") as HTMLDivElement // Gets The Add Reaction Container
            add_reaction.id = `add_reaction_${chat_id}` // Sets The ID
            add_reaction.style = `position-anchor: --add_reaction_button_${chat_id}` // Links The Anchor

            // Hide Message Properties Button
            const hide_message_properties_button:HTMLButtonElement = message_properties.querySelector(".hide_message_properties_button") as HTMLButtonElement // Gets The Hide Message Properties Button
            hide_message_properties_button.setAttribute("popovertarget", `message_properties_${chat_id}`) // Links The Popover

            // If The Message Belongs To The Logged In User
            if(logged_in_user_id && logged_in_user_id === sender_id) {
                // Edit Message Button
                const edit_message_button:HTMLButtonElement = document.createElement("button") // Creates The Edit Message Button
                edit_message_button.classList.add("edit_message_button") // Adds The Edit Message Button Class
                edit_message_button.setAttribute("popovertarget", `message_properties_${chat_id}`) // Links The Popover
                edit_message_button.popoverTargetAction = "hide" // Sets The Hide Action
                edit_message_button.innerHTML = "<i class='fa-solid fa-pen'></i>" // https://fontawesome.com/icons/pen
                edit_message_button.innerHTML += `<span>${gettext("Upraviť")}</span>`
                message_properties.insertBefore(edit_message_button, hide_message_properties_button) // Appends The Edit Message Button To The Message Properties Menu
    
                // Delete Message Button
                const delete_message_button:HTMLButtonElement = document.createElement("button") // Creates The Delete Message Button
                delete_message_button.classList.add("delete_message_button") // Adds The Edit Delete Message Button Class
                delete_message_button.innerHTML = "<i class='fa-solid fa-eraser'></i>" // https://fontawesome.com/icons/eraser
                delete_message_button.innerHTML += `<span>${gettext("Vymazať")}</span>`
                message_properties.insertBefore(delete_message_button, hide_message_properties_button) // Appends The Delete Message Button To The Message Properties Menu
            }

            all_messages.prepend(one_message) // Appends The One Message Container To The All Messages Container
    
            // Auto Scrolls To The Bottom
            all_messages.scrollTo({
                top: all_messages.scrollHeight,
                behavior: "smooth"
            })
    
            // If Message Isn't From Logged In User
            if(logged_in_user_id && logged_in_user_id !== data.sender_id) {
                markMessagesAsRead() // Marks Messages As Read
            }
        }

        // Edited Message
        else if(data.action === "edit") {
            const chat_id:number = data.chat_id as number // Gets The Chat ID
            const message_content:string = data.message as string // Gets The Message Content

            const edited_message:HTMLDivElement|null = [...all_messages.querySelectorAll<HTMLDivElement>(".one_message")].find((one_message) => one_message.dataset["chat_id"] === String(chat_id)) || null // Gets The Edited Message Container

            if(edited_message) {
                edited_message.classList.remove("edit"); // Removes The Edit Class
                (edited_message.querySelector("p") as HTMLParagraphElement).textContent = message_content // Shows The Message Content
                if(edited_message.dataset["time"] && !(edited_message.dataset["time"]).includes(gettext("(upravené)"))) (edited_message.dataset["time"] as string) = edited_message.dataset["time"] as string + gettext(" (upravené)") // Shows The Edited Label

                write_message.dataset["action"] = "new" // Sets The Edit Action To The Write Message Container
                new_message.dataset["placeholder"] = gettext("Napísať správu") // Sets The Placeholder
                new_message.textContent = "" // Deletes The Text From The New Message Custom Input
            }
        }

        // Delete Message
        else if(data.action === "delete") {
            const chat_id:number = data.chat_id as number // Gets The Chat ID

            const deleted_message:HTMLDivElement|null = [...all_messages.querySelectorAll<HTMLDivElement>(".one_message")].find((one_message) => one_message.dataset["chat_id"] === String(chat_id)) || null // Gets The Edited Message Container

            if(deleted_message) deleted_message.classList.add("deleted") // Adds The Deleted Class
        }

        // Add Message Reaction
        else if(data.action === "add_reaction") {
            const chat_id:number = data.chat_id as number // Gets The Chat ID
            const emoji:string = data.emoji as string // Gets The Emoji
            const emoji_sender_username:string = data.emoji_sender_username as string // Gets The Sender's Username 

            const one_message:HTMLDivElement|null = [...all_messages.querySelectorAll<HTMLDivElement>(".one_message")].find((one_message) => one_message.dataset["chat_id"] === String(chat_id)) || null // Gets The One Message Container

            if(one_message) {
                const reactions:HTMLDivElement = one_message.querySelector(".reactions") as HTMLDivElement // Gets The Reactions Container
                const is_existing_reaction:boolean = [...reactions.querySelectorAll<HTMLDivElement>(".one_reaction")].some(one_reaction => one_reaction.textContent.trim() === emoji) // Checks If The Reaction Has Been Already Added
    
                // Removes The Reaction
                if(is_existing_reaction) {
                    const reaction_to_remove:HTMLDivElement|null = [...reactions.querySelectorAll<HTMLDivElement>(".one_reaction")].find(one_reaction => one_reaction.textContent.trim() === emoji) || null // Gets The Reaction To Remove
    
                    if(reaction_to_remove) reaction_to_remove.remove() // Removes The Reaction From The DOM
                }
    
                // Adds The Reaction
                else {
                    const one_reaction:HTMLDivElement = document.createElement("div") // Creates The One Reaction Container
                    one_reaction.classList.add("one_reaction") // Adds The One Reaction Class
                    one_reaction.title = interpolate(gettext("Reakciu pridal: %s"), [emoji_sender_username])
                    one_reaction.ariaLabel = interpolate(gettext("Reakciu pridal: %s"), [emoji_sender_username])
                    one_reaction.textContent = emoji // Sets The Emoji
                    
                    if(reactions.children.length >= 3) {
                        (reactions.firstElementChild as HTMLDivElement).remove() // Removes The Last Reaction From The DOM
                    }
    
                    reactions.appendChild(one_reaction) // Appends The One Reaction Container To The Reactions Container
                }
            }
        }

        // Remove Message Reaction
        else if(data.action === "remove_reaction") {
            const chat_id:number = data.chat_id as number // Gets The Chat ID
            const emoji:string = data.emoji as string // Gets The Emoji

            const one_message:HTMLDivElement|null = [...all_messages.querySelectorAll<HTMLDivElement>(".one_message")].find((one_message) => one_message.dataset["chat_id"] === String(chat_id)) || null // Gets The One Message Container

            if(one_message) {
                const reactions:HTMLDivElement = one_message.querySelector(".reactions") as HTMLDivElement // Gets The Reactions Container
                const reaction_to_remove:HTMLDivElement|null = [...reactions.querySelectorAll<HTMLDivElement>(".one_reaction")].find(one_reaction => one_reaction.textContent.trim() === emoji) || null // Gets The Reaction To Remove

                if(reaction_to_remove) reaction_to_remove.remove() // Removes The Reaction From The DOM
            }
        }
    }

    // Interrupted Connection
    chat_socket.onclose = function():void {
        displayMessage(gettext("Spojenie sa neočakávane prerušilo."), "error") // Displays The Error Message
    }

    // Global Event Delegations 

    // All Messages Container Click Functionalities (The DOM Changes Will Only Be Visible To The User Who Made The Change)
    all_messages.addEventListener("click", function(event:PointerEvent):void {
        // Add Reaction
        if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("add_reaction")) {
            const clicked_emoji:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Clicked Emoji Button
            const one_message:HTMLDivElement = (event.target as HTMLButtonElement).closest(".one_message") as HTMLDivElement // Gets The One Message Container
            const reactions:HTMLDivElement = one_message.querySelector(".reactions") as HTMLDivElement // Gets The Reactions Container

            const hex_code:number|null = Number(clicked_emoji.dataset["hex_code"]) || null // Gets The Hex Code Of The Emoji

            if(hex_code) {
                const emoji:string = String.fromCodePoint(hex_code) // Gets The Emoji
                const chat_id:number|null = Number(one_message.dataset["chat_id"]) || null // Gets The Chat ID

                // Adds Or Removes The Reaction
                if(chat_id) {
                    const is_existing_reaction:boolean = [...reactions.querySelectorAll<HTMLDivElement>(".one_reaction")].some(one_reaction => one_reaction.textContent.trim() === emoji) // Checks If The Reaction Has Been Already Added

                    // Removes The Reaction
                    if(is_existing_reaction) {
                        const reaction_to_remove:HTMLDivElement|null = [...reactions.querySelectorAll<HTMLDivElement>(".one_reaction")].find(one_reaction => one_reaction.textContent.trim() === emoji) || null // Gets The Reaction To Remove

                        if(reaction_to_remove) {
                            chat_socket.send(JSON.stringify({
                                "action": "remove_reaction",
                                "chat_id": chat_id,
                                "emoji": emoji
                            }))

                            // reaction_to_remove.remove() // Removes The Reaction From The DOM
                        }
                    }

                    // Adds The Reaction
                    else {
                        chat_socket.send(JSON.stringify({
                            "action": "add_reaction",
                            "chat_id": chat_id,
                            "emoji": emoji
                        }))

                        // const one_reaction:HTMLDivElement = document.createElement("div") // Creates The One Reaction Container
                        // one_reaction.classList.add("one_reaction") // Adds The One Reaction Class
                        // one_reaction.textContent = emoji // Sets The Emoji
                        
                        // if(reactions.children.length >= 3) {
                        //     (reactions.firstElementChild as HTMLDivElement).remove() // Removes The Last Reaction From The DOM
                        // }

                        // reactions.appendChild(one_reaction) // Appends The One Reaction Container To The Reactions Container
                    }
                }
            }
            
        }

        // Edit Message
        if((event.target as HTMLButtonElement).classList.contains("edit_message_button")) {
            const one_message:HTMLDivElement = (event.target as HTMLButtonElement).closest(".one_message") as HTMLDivElement // Gets The One Message Container

            all_messages.querySelectorAll<HTMLDivElement>(".one_message").forEach((one_message) => one_message.classList.remove("edit")) // Removes Edit Class From All One Message Containers
            one_message.classList.add("edit") // Adds The Edit Class
            write_message.dataset["action"] = "edit" // Sets The Edit Action To The Write Message Container
            new_message.dataset["placeholder"] = gettext("Upraviť správu") // Sets The Placeholder
            new_message.textContent = (one_message.querySelector("p") as HTMLParagraphElement).textContent // Sets The Value
            focusAtEnd(new_message) // Adds Focus To The New Message Custom Input
        }

        // Delete Message
        else if((event.target as HTMLButtonElement).classList.contains("delete_message_button")) {
            const one_message:HTMLDivElement = (event.target as HTMLButtonElement).closest(".one_message") as HTMLDivElement // Gets The One Message Container
            const chat_id:number|null = Number(one_message.dataset["chat_id"]) || null // Gets The Chat ID

            // Deletes The Message
            if(chat_id) {
                chat_socket.send(JSON.stringify({
                    "action": "delete",
                    "chat_id": chat_id
                }))

                one_message.classList.add("deleted") // Adds The Deleted Class
            }
        }
    })

    // Write Message

    // Variables

    const MAX_MESSAGE_LENGTH:number = 250 // Defines The Maximum Message Length
    const add_emoji:HTMLElement = write_message.querySelector(".add_emoji") as HTMLElement // Gets The Add Emoji Icon
    const emoji_picker_container:HTMLDivElement = write_message.querySelector(".emoji_picker_container") as HTMLDivElement // Gets The Emoji Picker Container
    const picker:Element = emoji_picker_container.querySelector("emoji-picker") as Element // Gets The Emoji Picker
    const send:HTMLButtonElement = write_message.querySelector(".send") as HTMLButtonElement // Gets The Send Button

    // Events

    add_emoji.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour
    // emoji_picker_container.addEventListener("mousedown", event => event.preventDefault()) // Prevents Default Behaviour

    // Add Emoji Icon Click Functionality
    add_emoji.addEventListener("click", function(event:PointerEvent):void {
        event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
        emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
    })

    // Add Emoji Icon Keydown Functionality
    add_emoji.addEventListener("keydown", function(event:KeyboardEvent):void {
        if(event.key === "Enter") {
            event.preventDefault() // Prevents Default Behaviour
            event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
            emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
        }
    })

    // Picker Emoji Click Functionality
    picker.addEventListener("emoji-click", function(event:Event):void {
        if(new_message.innerText.length >= MAX_MESSAGE_LENGTH) return

        const custom_event:CustomEvent<{
            unicode:string
        }> = event as CustomEvent<{ unicode: string }>
    
        const emoji:string = custom_event.detail.unicode // Gets The Clicked Emoji
        const selection:Selection|null = window.getSelection()
        const isInsideEditable:boolean|null = selection && selection.rangeCount > 0 && new_message.contains(selection.anchorNode)

        if(!isInsideEditable) focusAtEnd(new_message)

        const active_selection:Selection|null = window.getSelection()

        if(active_selection && active_selection.rangeCount > 0) {
            const range:Range = active_selection.getRangeAt(0)
        
            range.deleteContents() // Deletes The Selected Text

            // Inserts The Emoji To The Text
            const text_node:Text = document.createTextNode(emoji)
            range.insertNode(text_node)

            // Sets The Cursor Position Behind The Inserted Emoji
            range.setStartAfter(text_node)
            range.setEndAfter(text_node)
            
            // Updates The Cursor
            active_selection.removeAllRanges()
            active_selection.addRange(range)
        }
    })

    // Send Button Click Functionality
    send.addEventListener("click", function():void {
        const action:string = write_message.dataset["action"] as string // Gets The Write Message Action
        const message = new_message.textContent // Gets The Message

        if(message.trim() !== "") {
            // New Message
            if(action === "new") {
                // Sends The New Message
                chat_socket.send(JSON.stringify({
                    "action": "new",
                    "message": message
                }))
            }

            // Edit Message
            else if(action === "edit") {
                const edited_message:HTMLDivElement = all_messages.querySelector(".one_message.edit") as HTMLDivElement // Gets The Edited Message 
                const chat_id:number|null = Number(edited_message.dataset["chat_id"]) || null // Gets The Chat ID

                if(chat_id) {
                    // Sends The Edited Message
                    chat_socket.send(JSON.stringify({
                        "action": "edit",
                        "chat_id": chat_id,
                        "message": message
                    }))
                }
            }

            new_message.innerHTML = "" // Deletes New Message Custom Input
        }
    })

    // New Message Custom Input Paste Functionality
    new_message.addEventListener("paste", async function(event:ClipboardEvent):Promise<void> {
        event.preventDefault() // Prevents Default Behaviour

        const pasted_text:string = event.clipboardData?.getData("text/plain") ?? "" // Gets The Pasted Text

        if(!pasted_text) return // Do Nothing If There Isn't Any Pasted Text

        const cursor_position:number = getCursorPosition(new_message) ?? new_message.innerText.length // Gets The Cursor Position
        const text_before_cursor:string = new_message.innerText.slice(0, cursor_position) // Gets The Text Before The Cursor
        const text_after_cursor:string = new_message.innerText.slice(cursor_position) // Gets The Text After The Cursor
        let new_text:string = text_before_cursor + pasted_text + text_after_cursor // Gets The New Text
        let is_truncated:boolean = false

        if(new_text.length > MAX_MESSAGE_LENGTH) {
            new_text = new_text.slice(0, MAX_MESSAGE_LENGTH) // Sets The New Text
            is_truncated = true
        }

        new_message.innerText = new_text // Updates The New Message Custom Input

        if(is_truncated) {
            focusAtEnd(new_message)
        }
    })

    // New Message Input Functionality
    new_message.addEventListener("input", async function():Promise<void> {
        if(this.innerText.length > MAX_MESSAGE_LENGTH) {
            let new_text:string = new_message.innerText.slice(0, MAX_MESSAGE_LENGTH) // Gets The New Text

            new_message.innerText = new_text // Updates The New Message Custom Input
            focusAtEnd(new_message)
        }
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
})