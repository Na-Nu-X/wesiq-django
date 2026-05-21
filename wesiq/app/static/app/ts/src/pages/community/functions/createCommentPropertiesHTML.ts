export interface comment {
    id:number,

    user:{
        id:number,
        username:string,
        profile_picture_name:string|null
    },

    comment?:string,
    likes?:number,
    likes_from_users?:number[],
    creation_time:string,
    parent_id?:number|null,
    reports_from_users?:number[],
    level:number
}

// Function For Create The Comment Properties HTML
export function createCommentPropertiesHTML(one_comment:HTMLDivElement, report_container:HTMLDivElement, comment:comment, logged_in_user_id:number):void {
    const show_comment_properties_button:HTMLButtonElement = one_comment.querySelector(".comment_container .user .show_comment_properties_button") as HTMLButtonElement // Gets The Show Comment Properties Button
    const comment_properties:HTMLDivElement = one_comment.querySelector(".comment_container .user .comment_properties") as HTMLDivElement // Gets The Comment Properties Menu
    const hide_comment_properties_button:HTMLButtonElement = comment_properties.querySelector(".hide_comment_properties_button") as HTMLButtonElement // Gets The Hide Comment Properties Button

    show_comment_properties_button.setAttribute("popovertarget", `comment_properties_${comment.id}`) // Links The Pop Over
    show_comment_properties_button.style = `anchor-name: --show_comment_properties_button_${comment.id}` // Creates The Anchor
    comment_properties.id = `comment_properties_${comment.id}` // Sets The ID
    comment_properties.style = `position-anchor: --show_comment_properties_button_${comment.id}` // Links The Anchor
    hide_comment_properties_button.setAttribute("popovertarget", `comment_properties_${comment.id}`) // Links The Pop Over

    // If The Comment Doesn't Belong To The Logged In User The Report Option Will Be Shown
    if(comment.user.id !== logged_in_user_id) {
        // Show Report Comment Button
        const show_report_comment_button:HTMLButtonElement = document.createElement("button") // Creates The Show Report Comment Button
        show_report_comment_button.classList.add("show_report_comment_button") // Adds The Show Report Comment Button
        show_report_comment_button.setAttribute("popovertarget", `report_comment_${comment.id}`) // Links The Pop Over
        show_report_comment_button.style = `anchor-name: --show_report_comment_button_${comment.id}` // Creates The Anchor
        show_report_comment_button.innerHTML = "<i class='fa-regular fa-flag'></i>" // https://fontawesome.com/icons/flag
        show_report_comment_button.innerHTML += `<span>${gettext("Nahlásiť")}</span>`
        comment_properties.insertBefore(show_report_comment_button, hide_comment_properties_button) // Appends The Show Report Comment Button To The Comment Properties Menu

        // Report Comment Menu
        report_container.classList.add("report_comment") // Adds The Report Comment Class
        report_container.id = `report_comment_${comment.id}` // Sets The ID
        report_container.style = `position-anchor: --show_report_comment_button_${comment.id}`; // Links The Anchor
        (one_comment.querySelector(".comment_container .user") as HTMLDivElement).appendChild(report_container) // Appends The Report Comment Menu To The Comment Container

        // Back Report Comment Button
        const back_report_comment_button:HTMLButtonElement = report_container.querySelector(".back_report_button") as HTMLButtonElement // Gets The Back Report Comment Button
        back_report_comment_button.setAttribute("popovertarget", `report_comment_${comment.id}`) // Links The Pop Over
    }

    // If The Comment Belongs To The Logged In User The Delete Option Will Be Shown
    else {
        // Delete Comment Button
        const delete_comment_button:HTMLButtonElement = document.createElement("button") // Creates The Delete Comment Button
        delete_comment_button.classList.add("delete_comment_button") // Adds The Delete Comment Button
        delete_comment_button.setAttribute("popovertarget", `delete_comment_${comment.id}`) // Links The Pop Over
        delete_comment_button.style = `anchor-name: --delete_comment_button_${comment.id}` // Creates The Anchor
        delete_comment_button.innerHTML = "<i class='fa-solid fa-eraser'></i>" // https://fontawesome.com/icons/eraser
        delete_comment_button.innerHTML += `<span>${gettext("Vymazať")}</span>`
        comment_properties.insertBefore(delete_comment_button, hide_comment_properties_button) // Appends The Delete Comment Button To The Comment Properties Menu

        // Delete Comment Menu
        const delete_comment:HTMLDivElement = document.createElement("div") // Creates The Delete Comment Menu
        delete_comment.classList.add("delete_comment") // Adds The Delete Comment Class
        delete_comment.id = `delete_comment_${comment.id}` // Sets The ID
        delete_comment.popover = "auto" // Sets The Popover Attribute
        delete_comment.style = `position-anchor: --delete_comment_button_${comment.id}`; // Links The Anchor
        (one_comment.querySelector(".comment_container .user") as HTMLDivElement).appendChild(delete_comment) // Appends The Delete Comment To The Comment Container

        // Question
        const question:HTMLParagraphElement = document.createElement("p") // Creates The Question Paragraph
        question.textContent = gettext("Naozaj chcete vymazať Váš komentár?")
        delete_comment.appendChild(question) // Appends The Question To The Delete Comment Menu

        // Yes
        const yes:HTMLButtonElement = document.createElement("button") // Creates The Yes Button
        yes.dataset["action"] = "delete" // Stores The Delete Action
        yes.innerHTML = "<i class='fa-solid fa-eraser'></i>" // https://fontawesome.com/icons/eraser
        yes.innerHTML += `<span>${gettext("Vymazať")}</span>`
        delete_comment.appendChild(yes) // Appends The Yes Button To The Delete Comment Menu
        
        // No
        const no:HTMLButtonElement = document.createElement("button") // Creates The No Button
        no.setAttribute("popovertarget", `delete_comment_${comment.id}`) // Links The Pop Over
        no.popoverTargetAction = "hide" // Sets The Hide Action
        no.innerHTML = "<i class='fa-solid fa-xmark'></i>" // https://fontawesome.com/icons/xmark
        no.innerHTML += `<span>${gettext("Zrušiť")}</span>`
        delete_comment.appendChild(no) // Appends The No Button To The Delete Comment Menu
    }
}