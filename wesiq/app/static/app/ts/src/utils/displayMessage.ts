// Function For Display The Message
export function displayMessage(text:string, status:"success"|"error"):void {
    // Previous Message
    const previous_message:HTMLParagraphElement|null = document.body.querySelector(".message") as HTMLParagraphElement || null // Gets The Previous Message If Exists
    if(previous_message) previous_message.remove() // Removes The Previous Message From The DOM

    // Message
    const message:HTMLParagraphElement = document.createElement("p") // Creates The Message Paragraph
    message.classList.add("message", status) // Adds The Message And Status Class
    message.textContent = text // Adds The Text
    document.body.appendChild(message) // Appends The Message To The DOM
}