import { displayMessage } from "../../../utils/displayMessage.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Chat

    // Variables

    const chat:HTMLDivElement = document.querySelector(".chat") as HTMLDivElement // Gets The Chat Container
    const all_messages:HTMLDivElement = chat.querySelector(".middle .all_messages") as HTMLDivElement // Gets The All Messages Container

    const write_message:HTMLDivElement = chat.querySelector(".bottom .write_message") as HTMLDivElement // Gets The Write Message Container
    const new_message:HTMLDivElement = write_message.querySelector(".new_message") as HTMLDivElement // Gets The New Message Custom Input
    const send:HTMLButtonElement = write_message.querySelector(".send") as HTMLButtonElement // Gets The Send Button

    const current_url:string = window.location.pathname // Gets The Current URL
    const url_parts:string[] = current_url.split('/') // Splits The URL
    const username:string = url_parts[url_parts.length - 1] || url_parts[url_parts.length - 2] as string // Gets The Receiver's Username From The URL (For Example @patrik_behul)

    // Creates The Chat Socket (ws:// For Local Development, wss:// For HTTPS Production)
    const chat_socket:WebSocket = new WebSocket(
        "ws://" + window.location.host + "/ws/chat/" + username + "/"
    )

    // Events

    // New Message From Server
    chat_socket.onmessage = function(event:MessageEvent<any>):void {
        const data:any = JSON.parse(event.data) // Gets The Data
        const message_content:any = data.message // Gets The Message Content
        const sender:any = data.sender // Gets The Sender

        const one_message:HTMLDivElement = document.createElement("div") // Creates The One Message Container
        one_message.classList.add("one_message") // Adds One Message Class
        one_message.innerText = sender + ": " + message_content // Shows The Message Content
        all_messages.appendChild(one_message) // Appends The One Message Container To The All Messages Container
        
        all_messages.scrollTop = all_messages.scrollHeight // Auto Scrolls To The Bottom
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
                "message": message
            }))
            
            new_message.innerHTML = "" // Deletes New Message Custom Input
        }
    })
})