import { tag_user_state } from "../state.js"
import { sendPOST } from "../../../services/sendPOST.js"

import type { tag } from "../state.js"

interface taggedUser {
    id:number,
    first_name:string,
    last_name:string,
    username:string,
    profile_picture_name:string
}

interface taggedUsersResponse {
    success:boolean,
    users:taggedUser[]
}

function storeAtSignPosition(data:tag):void {
    tag_user_state.tags.push(data) // Pushes The Data Into An Array
}

// Function For Get The Start Index Of The Last Tag
function getTagStartIndex(text:string):number {
    let tag_start_index:number = 0

    tag_user_state.tags.length > 0 ? tag_start_index = text.indexOf("@", (tag_user_state.tags[tag_user_state.tags.length - 1]!.tag_start_index) + 1) : tag_start_index = text.indexOf("@", 0) // Gets The Index Of The Last At Sign

    return tag_start_index
}

// Function For Place The Tag Into The Input
function placeTag(input:HTMLTextAreaElement, tagged_person:string, container:HTMLDivElement):void {
    if(!tagged_person.includes("@")) tagged_person = `@${tagged_person.trim()}`

    const text:string = input.value // Gets The Full Text
    const tag_start_index:number = getTagStartIndex(text) // Gets The Tag Start Index
    const entered_tag_end_index:number = text.length - 1 // Gets The End Index Of The Entered Tag (Could Be Unfinished)
    const tagged_person_length:number = tagged_person.length // Gets The Length Of The Tagged User

    const text_without_unfinished_tag:string = text.slice(0, tag_start_index) + text.slice(entered_tag_end_index + 1) // Deletes Unfinished Tag From The Text (For Example: Hello @us -> Hello )
    const text_with_finished_tag:string = text_without_unfinished_tag.slice(0, tag_start_index) + tagged_person + text_without_unfinished_tag.slice(tag_start_index + 1) // Sets Finished Tag To The Text (For Example: Hello  -> Hello @user)

    input.value = text_with_finished_tag + " " // Sets The New Value And Adds The Space

    input.focus() // Adds Focus Into The Input

    container.classList.remove("active"); // Hides The Container
    (container.parentElement as HTMLDivElement).removeAttribute("style") // Removes Hardcoded Style (style="border-bottom: none; border-bottom-right-radius: 0px; border-bottom-left-radius: 0px;") From The Container

    // Stores The Tag With All Information
    const tag_end_index:number = tag_start_index + tagged_person_length - 1 // Gets The Tag End Index

    const tag:tag = {
        tagged_person,
        tag_start_index,
        tag_end_index
    }

    storeAtSignPosition(tag) // Stores The Tag Position
}

// Function For Store Tagged User
function storeTaggedUser(container:HTMLDivElement, tagged_person:string, input:HTMLTextAreaElement):void {
    const current_users_for_tag:NodeListOf<HTMLDivElement> = container.querySelectorAll<HTMLDivElement>(".one_user"); // Gets All Current Users For Tag From The Container
            
    // Checks If Tagged Person Exists And Is Available In Current Users For Tag
    const existing_tag:boolean = [...current_users_for_tag].some(function(one_user:HTMLDivElement):boolean {
        return (
            one_user.dataset["username"] === `@${tagged_person.trim()}` ||
            one_user.dataset["username"] === tagged_person
        )
    })

    if(existing_tag) {
        if(tag_user_state.tagged_people.length < tag_user_state.MAX_TAGGED_PEOPLE) {
            // Prevents Tagging Multiple Times The Same User
            if(
                !tag_user_state.tagged_people.includes(`@${tagged_person.trim()}`) &&
                !tag_user_state.tagged_people.includes(tagged_person)
            ) {
                !tagged_person.includes("@") ? tag_user_state.tagged_people.push(`@${tagged_person.trim()}`) : tag_user_state.tagged_people.push(tagged_person) // Pushes Tagged Person Without Ending Space To The Array Of All Tagged Persons

                placeTag(input, tagged_person, container); // Places The Tag

                const tagged_people:HTMLInputElement = (input.parentElement as HTMLDivElement).querySelector(".tagged_people") as HTMLInputElement // Gets The Tagged People Hidden Input
                tagged_people.value = JSON.stringify(tag_user_state.tagged_people) // Stores Tagged People Into The Hidden Input
            }

            else {
                console.log(`@${tagged_person.trim()} už je označený`)
            }
        }

        else {
            console.log("VIAC SA NEDA OZNACIT")
        }
    }
}

// Function For Get Users For Tag
export async function getUsersForTag(input:HTMLTextAreaElement, container:HTMLDivElement) {
    // console.log(tag_user_state.tags)
    // console.log(tag_user_state.tagged_people)

    const text:string = input.value // Gets The Full Text
    const tag_start_index:number = getTagStartIndex(text) // Gets The Tag Start Index

    tag_user_state.tagged_person = "" // Deletes Tagged Person Value

    // Reads Characters After At Sign
    for(let i:number = tag_start_index + 1; i < text.length; i++) {
        // Adds Characters To Tag Until Hitting Space
        if(!tag_user_state.tagged_person.includes(" ")) tag_user_state.tagged_person += text[i]
        else tag_user_state.tagged_person = "" // Resets Tagged Person Value
    }

    // Sends The POST Only If The User Is Currently Tagging Someone
    if(tag_user_state.tagged_person) {
        try {
            const tag_response:taggedUsersResponse = await sendPOST(window.location.pathname, tag_user_state.tagged_person) // Sends The Data With POST

            if(tag_response.success) {
                storeTaggedUser(container, tag_user_state.tagged_person, input) // Stores Tagged User

                container.innerHTML = "" // Deletes All Previous Data From The Container
                
                if(tag_response.users.length > 0 && !tag_user_state.tagged_person.includes(" ")) {
                    tag_response.users.forEach(one_user_data => renderUsersForTag(one_user_data, container)) // Renders Each User For Tag
                }

                else {
                    container.classList.remove("active"); // Hides The Container
                    (container.parentElement as HTMLDivElement).removeAttribute("style") // Removes Hardcoded Style (style="border-bottom: none; border-bottom-right-radius: 0px; border-bottom-left-radius: 0px;") From The Container

                    if(tag_user_state.tagged_person.includes(" ")) {
                        const nearest_space_index:number = text.indexOf(" ", tag_start_index + 1) // Gets The Index Of The Nearest Space

                        const at:tag = {
                            tag_start_index,
                            tag_end_index: nearest_space_index - 1
                        }

                        storeAtSignPosition(at) // Stores The At Sign Position
                    }
                }
            }
        }

        catch(error) {
            console.error(gettext("An Error Occurred While Searching Tags."), error)
        }

        // finally {
        //     users_loading.classList.add("hidden") // Hides The Loader
        // }
    }
}

// Function For Render Users For Tag
function renderUsersForTag(data:taggedUser, container:HTMLDivElement) {
    const one_user:HTMLDivElement = document.createElement("div") // Creates One User Container
    const profile_picture:HTMLImageElement = document.createElement("img") // Creates Profile Picture Image
    const full_name:HTMLParagraphElement = document.createElement("p") // Creates Full Name Paragraph
    const username:HTMLParagraphElement = document.createElement("p") // Creates Username Paragraph

    one_user.classList.add("one_user") // Adds One User Class
    one_user.dataset["id"] = String(data.id) // Stores User's ID
    one_user.dataset["username"] = data.username // Stores User's Username
    one_user.title = gettext("Označiť") // Adds The Title
    container.appendChild(one_user) // Appends One User To The All Users Container

    profile_picture.classList.add("profile_picture") // Adds Profile Picture Class
    // profile_picture.classList.add("skeleton_loading") // Adds Skeleton Loading Class
    data.profile_picture_name ? profile_picture.src = `/../media/images/${data.id}/${data.profile_picture_name}` : profile_picture.src = "/../static/images/profile_picture.png" // Sets Profile Picture Name
    one_user.appendChild(profile_picture) // Appends The Profile Picture To The One User Container

    // full_name.classList.add("full_name") // Adds User Name Class
    // full_name.textContent = `${data.first_name} ${data.last_name}` // Sets First Name And Last Name
    // one_user.appendChild(full_name) // Appends The User Name To The One User Container

    username.classList.add("username") // Adds Username Class
    username.textContent = data.username // Sets The Username
    one_user.appendChild(username) // Appends The Username To The One User Container

    container.classList.add("active"); // Shows The Container
    (container.parentElement as HTMLDivElement).style.borderBottom = "none"; // Removes The Border
    (container.parentElement as HTMLDivElement).style.borderBottomRightRadius = "0px"; // Removes The Border
    (container.parentElement as HTMLDivElement).style.borderBottomLeftRadius = "0px" // Removes The Border
}

// Function For Tag The User
export function tagUser(username:string, container:HTMLDivElement, input:HTMLTextAreaElement):void {
    storeTaggedUser(container, username, input)
}