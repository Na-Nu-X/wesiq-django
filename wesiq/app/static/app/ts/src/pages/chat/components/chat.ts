import { displayMessage } from "../../../utils/displayMessage.js"
import { focusAtEnd } from "../../community/functions/customTextarea.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Chat

    // Variables

    const chat:HTMLDivElement = document.querySelector(".chat") as HTMLDivElement // Gets The Chat Container
    const all_messages:HTMLDivElement = chat.querySelector(".middle .all_messages") as HTMLDivElement // Gets The All Messages Container
    const one_message_template:HTMLTemplateElement = chat.querySelector(".one_message_template") as HTMLTemplateElement // Gets The One Message Template
    const logged_in_user_id:number|null = Number(all_messages.dataset["logged_in_user_id"]) || null // Gets The Logged In User ID

    const write_message:HTMLDivElement = chat.querySelector(".bottom .write_message") as HTMLDivElement // Gets The Write Message Container
    const new_message:HTMLDivElement = write_message.querySelector(".new_message") as HTMLDivElement // Gets The New Message Custom Input
    const send:HTMLButtonElement = write_message.querySelector(".send") as HTMLButtonElement // Gets The Send Button

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

    // Succeeded Open Of Socket
    chat_socket.onopen = function():void {
        markMessagesAsRead() // Marks Messages As Read
    }

    // Response From Server
    chat_socket.onmessage = function(event:MessageEvent<any>):void {
        const data:any = JSON.parse(event.data) // Gets The Data

        // New Message
        if(data.action === "new") {
            const message_content:any = data.message // Gets The Message Content
            const sender_id:any = data.sender_id // Gets The Sender's ID
            const sender_username:any = data.sender_username // Gets The Sender's Username
            const sender_profile_picture_name:any = data.sender_profile_picture_name // Gets The Sender's Profile Picture Name
    
            const one_message_template_clone:DocumentFragment = one_message_template.content.cloneNode(true) as DocumentFragment // Clones The One Message Template Content
            const one_message:HTMLDivElement = one_message_template_clone.querySelector(".one_message") as HTMLDivElement // Creates The One Message Container
            const profile_picture:HTMLImageElement = one_message.querySelector(".profile_picture") as HTMLImageElement // Gets The Profile Picture
            
            logged_in_user_id && logged_in_user_id === sender_id ? one_message.classList.add("sender") : one_message.classList.add("receiver") // Adds The Sender Or The Receiver Class
            profile_picture.src = sender_profile_picture_name ? `/../media/images/${sender_id}/${sender_profile_picture_name}` : "/../static/images/profile_picture.png"; // Sets Profile Picture - https://www.flaticon.com/free-icon/user_3177440
            (one_message.querySelector("p") as HTMLParagraphElement).textContent = message_content // Shows The Message Content
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
            const chat_id:any = data.chat_id // Gets The Chat ID
            const message_content:any = data.message // Gets The Message Content

            const edited_message:HTMLDivElement|null = [...all_messages.querySelectorAll<HTMLDivElement>(".one_message")].find((one_message) => one_message.dataset["chat_id"] === String(chat_id)) || null // Gets The Edited Message Container

            if(edited_message) {
                edited_message.classList.remove("edit"); // Removes The Edit Class
                (edited_message.querySelector("p") as HTMLParagraphElement).textContent = message_content // Shows The Message Content
                if(!(edited_message.dataset["time"] as string).includes(gettext("(upravené)"))) (edited_message.dataset["time"] as string) = edited_message.dataset["time"] as string + gettext(" (upravené)") // Shows The Edited Label

                write_message.dataset["action"] = "new" // Sets The Edit Action To The Write Message Container
                new_message.dataset["placeholder"] = gettext("Napísať správu") // Sets The Placeholder
                new_message.textContent = "" // Deletes The Text From The New Message Custom Input
            }
        }
    }

    // Interrupted Connection
    chat_socket.onclose = function():void {
        displayMessage(gettext("Chat sa neočakávane prerušil."), "error") // Displays The Error Message
    }

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

    // Global Event Delegations 

    // All Messages Container Click Functionalities
    all_messages.addEventListener("click", function(event:PointerEvent):void {
        // Edit Message
        if((event.target as HTMLButtonElement).classList.contains("edit_message_button")) {
            const one_message:HTMLButtonElement = (event.target as HTMLButtonElement).closest(".one_message") as HTMLButtonElement // Gets The One Message Container

            all_messages.querySelectorAll<HTMLDivElement>(".one_message").forEach((one_message) => one_message.classList.remove("edit")) // Removes Edit Class From All One Message Containers
            one_message.classList.add("edit") // Adds The Edit Class
            write_message.dataset["action"] = "edit" // Sets The Edit Action To The Write Message Container
            new_message.dataset["placeholder"] = gettext("Upraviť správu") // Sets The Placeholder
            new_message.textContent = (one_message.querySelector("p") as HTMLParagraphElement).textContent // Sets The Value
            focusAtEnd(new_message) // Adds Focus To The New Message Custom Input
        }

        // Delete Message
        else if((event.target as HTMLButtonElement).classList.contains("delete_message_button")) {
            const one_message:HTMLButtonElement = (event.target as HTMLButtonElement).closest(".one_message") as HTMLButtonElement // Gets The One Message Container
            const chat_id:number|null = Number(one_message.dataset["chat_id"]) || null // Gets The Chat ID

            // Deletes The Message
            if(chat_id) {
                chat_socket.send(JSON.stringify({
                    "action": "delete",
                    "chat_id": chat_id
                }))

                one_message.classList.add("deleted") // Adds The Deleted Class To The One Message Container
            }
        }
    })
})