import { displayMessage } from "../../../utils/displayMessage.js"

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

    // New Message From Server
    chat_socket.onmessage = function(event:MessageEvent<any>):void {
        const data:any = JSON.parse(event.data) // Gets The Data
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

    // Interrupted Connection
    chat_socket.onclose = function():void {
        displayMessage(gettext("Chat sa neočakávane prerušil."), "error") // Displays The Error Message
    }

    // Send Button Click Functionality
    send.addEventListener("click", function():void {
        const message = new_message.textContent // Gets The Message
        
        if(message.trim() !== "") {
            // Sends The New Message
            chat_socket.send(JSON.stringify({
                "action": "chat_message",
                "message": message
            }))
            
            new_message.innerHTML = "" // Deletes New Message Custom Input
        }
    })
})