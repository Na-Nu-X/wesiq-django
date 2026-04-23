import { sendPOST } from "../../../services/sendPOST.js"
import { generateNumberRange } from "../../../utils/generateNumberRange.js"

import type { response } from "../../../services/sendPOST.js"

interface addCommentResponse {
    success:boolean
}

// Function For Generate Styled Description
export function generateStyledDescription(text:string, tagged_users:string|null, added_hashtags:string|null):string {
    if(tagged_users) {
        const tagged_users_array:string[] = JSON.parse(tagged_users) // Converts The Data To An Array Of The Tagged Users
    
        tagged_users_array.forEach(one_tag => text = text.replace(one_tag, `<span class="tag">${one_tag}</span>`)) // Puts Every Tag To The Styled Span Element
    }

    if(added_hashtags) {
        const added_hashtags_array:string[] = JSON.parse(added_hashtags.replace(/'/g, '"')) // Converts The Data To An Array Of The Added Hashtags

        added_hashtags_array.forEach(one_hashtag => text = text.replace(one_hashtag, `<span class="hashtag">${one_hashtag}</span>`)) // Puts Every Hashtag To The Styled Span Element
    }

    return text // Returns The Text
}

// Function For Generate The Post Bars
export function generatePostBars(all_media:NodeListOf<HTMLDivElement>, post_bars:HTMLDivElement):void {
    // Creates The Bars Only If There Are More Than One Media In Post
    if(all_media.length > 1) {
        for(let i:number = 0; i < all_media.length; i++) {
            const bar:HTMLDivElement = document.createElement("div") // Creates The Bar

            generateButtons(i, all_media) // Generates The Change Buttons (Previous / Next)
            bar.classList.add("bar") // Adds The Bar Class
            post_bars.appendChild(bar) // Appends The Bar To The Post Bars
        }
    }

    else {
        post_bars.style.display = "none" // Hides The Post Bars Container
    }
}

// Function For Change The Post
export function changePost(clicked_bar_index:number, post_bars:HTMLDivElement, bar:HTMLDivElement, all_media:NodeListOf<HTMLDivElement>):void {
    all_media.forEach(function(one_post:HTMLDivElement, index:number):void {
        if(index !== clicked_bar_index) {
            one_post.style.display = "none"

            const all_bars:NodeListOf<HTMLDivElement> = post_bars.querySelectorAll<HTMLDivElement>(".bar") // Gets All Bars

            all_bars.forEach(one_bar => one_bar.classList.remove("active")) // Removes The Active Class From All Bars
            bar.classList.add("active") // Adds The Active Class
        }

        else {
            one_post.style.display = "block"
        }
    })
}

// Function For Generates The Heart Particles
function generateHeartParticles(particles:HTMLDivElement):void {
    particles.innerHTML = "" // Deletes The Particles Container

    const heart_amount:number = generateNumberRange(1, 5) // 1 - 5 Hearts

    for(let i:number = 0; i < heart_amount; i++) {
        // https://fontawesome.com/icons/heart
        const heart:HTMLElement = document.createElement("i") // Creates The Heart Icon 
        const heart_classes:string[] = ["fa-solid", "fa-regular"] // Stores The Heart Classes
        const random_heart_classes_index:number = Math.floor(Math.random() * heart_classes.length) // Gets The Random Index Of Heart Classes
    
        heart.classList.add("fa-heart", heart_classes[random_heart_classes_index] as string) // Adds The Classes

        heart.style.setProperty("--x", `${generateNumberRange(10, 100)}px`) // Generates And Sets The Random X Position
        heart.style.setProperty("--y", `-${generateNumberRange(10, 100)}px`) // Generates And Sets The Random Y Position

        particles.appendChild(heart) // Appends The Heart To The Particles Container
    }
}

// Function For Toggle Post Like
export function togglePostLike(icon:HTMLElement, counter:HTMLParagraphElement|null, id:string, particles:HTMLDivElement) {
    // If The Heart Is Empty
    if(icon.classList.contains("fa-regular")) {
        try {
            generateHeartParticles(particles) // Generates The Heart Particles
    
            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart
            sendPOST(`/like-post/${id}/`) // Sends Liked Post ID As A POST Data
        }

        catch {
            console.error(gettext("Pri pridávaní označenia páči sa mi to pre príspevok došlo k chybe."))
        }
    }

    // If The Heart Is Already Clicked
    else if(icon.classList.contains("fa-solid")) {
        try {
            icon.classList.replace("fa-solid", "fa-regular") // Adds Empty Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) - 1) // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart
            sendPOST(`/cancel-like-post/${id}/`) // Sends Liked Post ID As A POST Data
        }

        catch {
            console.error(gettext("Pri rušení označenia páči sa mi to pre príspevok došlo k chybe."))
        }
    }
}

// Function For Add Comment
export async function addComment(post_id:string, comment:string, all_comments:HTMLDivElement) {
    try {
        const comment_data:{
            post_id:string,
            comment:string
        } = {
            post_id,
            comment
        }

        const searched_tags_response:addCommentResponse = await sendPOST(window.location.pathname, comment_data, "add-comment") // Sends The Data With POST

        if(searched_tags_response.success) {
            console.log("SUCCESS")
        }

        else {
            console.log("ERROR")
        }
    }

    catch {
        console.error(gettext("Pri odosielaní komentáru došlo k chybe."))
    }
}

// Function For Toggle Comment Like
export async function toggleCommentLike(icon:HTMLElement, counter:HTMLParagraphElement|null, id:string) {
    // If The Heart Is Empty
    if(icon.classList.contains("fa-regular")) {
        try {
            icon.classList.replace("fa-regular", "fa-solid") // Adds Filled Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) + 1) // Adds 1 Like To The Counter By Clicking On The Empty Heart

            const like_comment_response:response = await sendPOST(window.location.pathname, id, "like-comment") // Sends Liked Comment ID As A POST Data

            if(!like_comment_response.success) console.log(like_comment_response.message)
        }

        catch {
            console.error(gettext("Pri pridávaní označenia páči sa mi to pre komentár došlo k chybe."))
        }
    }

    // If The Heart Is Already Clicked
    else if(icon.classList.contains("fa-solid")) {
        try {
            icon.classList.replace("fa-solid", "fa-regular") // Adds Empty Heart Image
            if(counter) counter.textContent = String(parseInt(counter.textContent) - 1) // Subtracts 1 Like To The Counter By Clicking On The Already Clicked Heart

            const cancel_like_comment_response:response = await sendPOST(window.location.pathname, id, "cancel-like-comment") // Sends Liked Comment ID As A POST Data

            if(!cancel_like_comment_response.success) console.log(cancel_like_comment_response.message)
        }

        catch {
            console.error(gettext("Pri rušení označenia páči sa mi to pre komentár došlo k chybe."))
        }
    }
}

// Function For Generate Change Buttons (Previous / Next)
function generateButtons(index:number, all_media:NodeListOf<HTMLDivElement>):void {
    if(index === 0) ((all_media[index] as HTMLDivElement).querySelector(".next") as HTMLDivElement).classList.remove("hidden") // Shows The Next Button In The First Post
    if(index === all_media.length - 1) ((all_media[index] as HTMLDivElement).querySelector(".previous") as HTMLDivElement).classList.remove("hidden") // Shows The Previous Button In The Last Post

    if(index !== 0 && index !== all_media.length - 1) {
        ((all_media[index] as HTMLDivElement).querySelector(".previous") as HTMLDivElement).classList.remove("hidden"); // Shows The Previous Button In The Last Post
        ((all_media[index] as HTMLDivElement).querySelector(".next") as HTMLDivElement).classList.remove("hidden") // Shows The Next Button In The First Post
    }
}