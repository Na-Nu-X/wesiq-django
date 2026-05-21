import { feed_state } from "../state.js"

// Function For Check The Searched Posts History
export function checkSearchedPostsHistory(history_container:HTMLDivElement, search_bar:HTMLInputElement):void {
    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

    searched_posts_history.length > 0 ? renderSearchedPostsHistory(history_container, search_bar) : hideHistoryContainer(search_bar, history_container) // Renders The Searched Posts History If There Is Any Previous Searched Post
}

// Function For Store The Searched Post To The History
export function storeSearchedPostToHistory(searched_text:string):void {
    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

    // Stores The New Result
    if(!searched_posts_history.includes(searched_text)) {
        searched_posts_history.unshift(searched_text) // Updates The Searched Posts History
        if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History
        localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage
    }

    // Updates The Order
    else {
        const searched_post_index = searched_posts_history.indexOf(searched_text)

        if(searched_post_index !== -1) searched_posts_history.splice(searched_post_index, 1) // Deletes The Previous Searched Post From The Searched Posts History
        searched_posts_history.unshift(searched_text) // Updates Searched Posts History
        if(searched_posts_history.length > feed_state.MAX_HISTORY_LENGTH) searched_posts_history = searched_posts_history.slice(0, feed_state.MAX_HISTORY_LENGTH) // Shows Maximum Of 3 Results From The Searched Posts History, Others Will Be Deleted From The Searched Posts History

        localStorage.setItem("searched_posts_history", JSON.stringify(searched_posts_history)) // Saves Updated Searched Posts History To The Local Storage
    }
}

// Function For Render The Searched Posts History
export function renderSearchedPostsHistory(history_container:HTMLDivElement, search_bar:HTMLInputElement):void {
    history_container.innerHTML = "" // Deletes The History Container

    let searched_posts_history:string[] = JSON.parse(localStorage.getItem("searched_posts_history") || "[]") as string[] // Gets The Searched Posts History From The Local Storage

    searched_posts_history.forEach(function(one_searched_post:string):void {
        const searched_post:HTMLDivElement = document.createElement("div") // Creates The Searched Post
        searched_post.classList.add("searched_post") // Adds The Searched Post Class
        history_container.appendChild(searched_post) // Appends The Searched Post To The History Container

        const delete_from_history:HTMLElement = document.createElement("i") // Creates The History Icon
        delete_from_history.classList.add("delete_from_history", "fa-solid", "fa-clock-rotate-left") // https://fontawesome.com/icons/clock-rotate-left
        delete_from_history.ariaHidden = "true"
        searched_post.appendChild(delete_from_history) // Appends The History Icon To The Searched Post

        const delete_from_history_hidden:HTMLElement = document.createElement("i") // Creates The Delete From History Icon
        delete_from_history_hidden.classList.add("delete_from_history", "hidden", "fa-solid", "fa-xmark") // https://fontawesome.com/icons/xmark
        delete_from_history_hidden.ariaHidden = "true"
        searched_post.appendChild(delete_from_history_hidden) // Appends The Delete From History Icon To The Searched Post

        const paragraph:HTMLParagraphElement = document.createElement("p") // Creates The Paragraph
        paragraph.dataset["searched_post"] = one_searched_post // Stores The Index
        paragraph.textContent = one_searched_post // Sets The Searched Post To Text
        paragraph.tabIndex = -1 // Makes The Element Focusable
        searched_post.appendChild(paragraph) // Appends The Paragraph To The Searched Post
    })

    showHistoryContainer(search_bar, history_container)
}

// Function For Show The History Container
function showHistoryContainer(search_bar:HTMLInputElement, history_container:HTMLDivElement):void {
    search_bar.focus() // Focuses To Search Bar

    // Sets Search Bar Styles
    search_bar.style.borderRadius = "5px 5px 0px 0px"
    search_bar.style.borderBottom = "none"

    // Sets History Container Container Styles
    history_container.style.borderBottom = "1px solid rgb(75, 75, 250, 0.5)"
    history_container.style.borderLeft = "1px solid rgb(75, 75, 250, 0.5)"
    history_container.style.borderRight = "1px solid rgb(75, 75, 250, 0.5)"

    history_container.classList.add("active") // Adds Active Class To History Container
}

// Function For Hide The History Container
export function hideHistoryContainer(search_bar:HTMLInputElement, history_container:HTMLDivElement):void {
    // Sets Search Bar Styles
    search_bar.style.border = "1px solid rgb(75, 75, 250, 0.5)"
    search_bar.style.borderRadius = "5px"

    // Sets History Container Container Styles
    history_container.style.border = "none"

    history_container.classList.remove("active") // Removes Active Class From History Container
}

// Function For Change The Focused Searched Post
export function changeFocusedSearchedPost(index:number, all_searched_posts:NodeListOf<HTMLDivElement>, search_bar:HTMLInputElement):void {
    feed_state.focused_searched_post_index = index // Updates Focused Searched Post Index

    if(index > all_searched_posts.length - 1) feed_state.focused_searched_post_index = 0 // Sets Focused Searched Post Index To Minimum
    if(index < 0) feed_state.focused_searched_post_index = all_searched_posts.length - 1 // Sets Focused Searched Post Index To Maximum

    const searched_post:HTMLParagraphElement = ((all_searched_posts[feed_state.focused_searched_post_index] as HTMLDivElement).querySelector("p") as HTMLParagraphElement) // Gets The Searched Post

    searched_post.focus() // Focuses Searched Post
    search_bar.blur() // Removes Focus From The Search Bar
}