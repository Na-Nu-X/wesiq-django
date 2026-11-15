// Create Post Steps (Like The Native Upload Sheet): 1. Media → 2. Details → 3. Audience → Uploading → Done

import { posts_preview_state } from "../state.js"
import { syncFiles } from "./postPreview.js"

export type uploadStep = "media"|"details"|"audience"|"uploading"|"done"

export interface uploadStepsController {
    goTo:(step:uploadStep) => void,
    showError:(message:string) => void,
    setProgress:(percentage:number) => void,
    isDirty:() => boolean,
    reset:() => void,
    onCancelUpload:(handler:() => void) => void
}

const STEP_INDEXES:Record<uploadStep, number> = { media: 0, details: 1, audience: 2, uploading: 3, done: 3 } // Index Of Each Step In The Indicator
const MAX_DESCRIPTION_LENGTH:number = 500 // Same As The Description Input Limit

// Function For Initialize The Steps Of The Upload Post Form
export function initializeUploadPostSteps(dialog:HTMLDialogElement, form:HTMLFormElement):uploadStepsController {
    // Variables

    const title:HTMLHeadingElement = form.querySelector(".upload_title") as HTMLHeadingElement // Gets The Title
    const subtitle:HTMLParagraphElement = form.querySelector(".upload_subtitle") as HTMLParagraphElement // Gets The Subtitle
    const indicator_bars:NodeListOf<HTMLSpanElement> = form.querySelectorAll<HTMLSpanElement>(".step_indicator span") // Gets The Step Indicator Bars
    const sections:NodeListOf<HTMLElement> = form.querySelectorAll<HTMLElement>(".upload_step") // Gets The Step Sections

    const posts_preview:HTMLDivElement = form.querySelector(".posts_preview") as HTMLDivElement // Gets The Posts Preview
    const select_posts:HTMLInputElement = form.querySelector("#select_posts") as HTMLInputElement // Gets The Select Posts Input

    const description:HTMLDivElement = form.querySelector(".description") as HTMLDivElement // Gets The Description
    const description_counter:HTMLSpanElement = form.querySelector(".description_counter") as HTMLSpanElement // Gets The Description Counter
    const location_input:HTMLInputElement = form.querySelector(".location") as HTMLInputElement // Gets The Location Input

    const public_visibility:HTMLInputElement = form.querySelector("#public_visibility") as HTMLInputElement // Gets The Public Visibility Checkbox (Checked = Everyone)
    const audience_options:NodeListOf<HTMLButtonElement> = form.querySelectorAll<HTMLButtonElement>(".audience_option") // Gets The Audience Options
    const audience_hint:HTMLParagraphElement = form.querySelector(".audience_hint") as HTMLParagraphElement // Gets The Audience Hint

    const summary_media:HTMLDivElement = form.querySelector(".summary_media") as HTMLDivElement // Gets The Summary Thumbnail
    const summary_meta:HTMLParagraphElement = form.querySelector(".summary_meta") as HTMLParagraphElement // Gets The Summary Meta Line
    const summary_caption:HTMLParagraphElement = form.querySelector(".summary_caption") as HTMLParagraphElement // Gets The Summary Caption

    const form_report:HTMLParagraphElement = form.querySelector(".form_report") as HTMLParagraphElement // Gets The Error Card
    const upload_percent:HTMLParagraphElement = form.querySelector(".upload_percent") as HTMLParagraphElement // Gets The Upload Percentage
    const upload_track:HTMLDivElement = form.querySelector(".upload_track") as HTMLDivElement // Gets The Upload Progress Track
    const upload_fill:HTMLDivElement = form.querySelector(".upload_fill") as HTMLDivElement // Gets The Upload Progress Fill
    const upload_hint:HTMLParagraphElement = form.querySelector(".upload_hint") as HTMLParagraphElement // Gets The Upload Hint
    const upload_hint_default:string = upload_hint.textContent?.trim() || ""

    const step_back:HTMLButtonElement = form.querySelector(".step_back") as HTMLButtonElement // Gets The Back Button
    const step_next:HTMLButtonElement = form.querySelector(".step_next") as HTMLButtonElement // Gets The Continue Button
    const submit:HTMLButtonElement = form.querySelector(".upload_post_form_submit") as HTMLButtonElement // Gets The Share Button
    const upload_cancel:HTMLButtonElement = form.querySelector(".upload_cancel") as HTMLButtonElement // Gets The Cancel Upload Button
    const upload_done:HTMLButtonElement = form.querySelector(".upload_done") as HTMLButtonElement // Gets The Done Button

    let cancel_upload_handler:(() => void)|null = null // Aborts The Running Upload

    // Functions

    // Function For Get The Current Step
    const getStep = ():uploadStep => (form.dataset["step"] as uploadStep) || "media"

    // Function For Check The Selected Media (Like The Native Upload Sheet, Invalid Files Block The Next Step)
    function getMediaState():{ count:number, has_invalid:boolean, is_loading:boolean } {
        const posts:HTMLDivElement[] = [...posts_preview.querySelectorAll<HTMLDivElement>(".post")] // Gets The Selected Media

        return {
            count: posts.length,
            has_invalid: posts.some(one_post => one_post.querySelector(".tooltip") !== null), // The Preview Adds A Tooltip To Too Large / Long / Short Files
            is_loading: posts.some(one_post => !one_post.dataset["filename"]) // The Filename Is Set When The Preview Has Loaded
        }
    }

    // Function For Update The Continue Button Of The Media Step
    function updateMediaButton():void {
        if(getStep() !== "media") return

        const media_state = getMediaState() // Gets The Media State
        const label:HTMLSpanElement = step_next.querySelector("span") as HTMLSpanElement // Gets The Label

        label.textContent = media_state.has_invalid ? step_next.dataset["invalid_label"] || "" : step_next.dataset["label"] || ""
        step_next.disabled = media_state.count === 0 || media_state.has_invalid || media_state.is_loading
        posts_preview.classList.toggle("has_media", media_state.count > 0) // Switches The Picker Card To The Small Add Tile
    }

    // Function For Update The Description Counter
    function updateDescriptionCounter():void {
        const length:number = description.innerText.replace(/\n$/, "").length // Gets The Description Length
        description_counter.textContent = `${length}/${MAX_DESCRIPTION_LENGTH}`
        description_counter.classList.toggle("full", length >= MAX_DESCRIPTION_LENGTH)
    }

    // Function For Select The Audience
    function selectAudience(audience:"everyone"|"followers"):void {
        public_visibility.checked = audience === "everyone" // Updates The Real Checkbox Sent With The Form

        audience_options.forEach(function(one_option:HTMLButtonElement):void {
            const is_selected:boolean = one_option.dataset["audience"] === audience
            one_option.classList.toggle("selected", is_selected)
            one_option.setAttribute("aria-selected", String(is_selected))
        })

        audience_hint.textContent = audience === "everyone" ? audience_hint.dataset["hint_everyone"] || "" : audience_hint.dataset["hint_followers"] || ""
    }

    // Function For Render The Summary Of The Post (Audience Step)
    function renderSummary():void {
        const first_post:HTMLDivElement|null = posts_preview.querySelector<HTMLDivElement>(".post") // Gets The Cover Media
        const media:HTMLImageElement|HTMLVideoElement|null = first_post ? first_post.querySelector<HTMLImageElement|HTMLVideoElement>("img, video") : null

        summary_media.innerHTML = "" // Deletes The Previous Thumbnail

        if(media) {
            const thumbnail:HTMLImageElement|HTMLVideoElement = media.cloneNode(false) as HTMLImageElement|HTMLVideoElement // Copies The Preview Without Its Controls
            thumbnail.removeAttribute("class")
            if(thumbnail instanceof HTMLVideoElement) thumbnail.muted = true
            summary_media.appendChild(thumbnail)
        }

        const count:number = getMediaState().count // Gets The Media Count
        const location:string = location_input.value.trim() // Gets The Location
        summary_meta.textContent = (summary_meta.dataset["files_label"] || "").replace("%(count)s", String(count)) + (location ? ` · ${location}` : "")

        const caption:string = description.innerText.trim() // Gets The Caption
        summary_caption.textContent = caption || summary_caption.dataset["empty_label"] || ""
        summary_caption.classList.toggle("empty", !caption)
    }

    // Function For Go To A Step
    function goTo(step:uploadStep):void {
        form.dataset["step"] = step // Stores The Step (The Stylesheet Shows The Matching Footer Buttons)

        sections.forEach(one_section => one_section.hidden = one_section.dataset["step"] !== step) // Shows Only The Current Step

        const step_index:number = STEP_INDEXES[step] // Gets The Step Index
        indicator_bars.forEach((one_bar:HTMLSpanElement, index:number) => one_bar.classList.toggle("active", index <= step_index))

        title.textContent = title.dataset[`title_${step}`] || title.textContent
        subtitle.textContent = step_index < 3 ? interpolate(gettext("Krok %(step)s z %(count)s"), { step: step_index + 1, count: 3 }, true) : ""

        if(step !== "audience") form_report.textContent = "" // The Error Card Only Belongs To The Last Step
        if(step === "media") updateMediaButton()
        if(step === "details") updateDescriptionCounter()
        if(step === "audience") renderSummary()

        if(step === "uploading") {
            setProgress(0)
            upload_hint.textContent = upload_hint_default
        }

        dialog.scrollTop = 0 // Starts Each Step At The Top
    }

    // Function For Show An Upload Error (Back On The Audience Step With A Retry Button)
    function showError(message:string):void {
        goTo("audience")
        form_report.textContent = message

        const label:HTMLSpanElement = submit.querySelector("span") as HTMLSpanElement // Gets The Label
        label.textContent = submit.dataset["retry_label"] || ""
    }

    // Function For Show The Upload Progress
    function setProgress(percentage:number):void {
        const rounded:number = Math.max(0, Math.min(100, Math.round(percentage))) // Gets The Rounded Percentage

        upload_percent.textContent = `${rounded}%`
        upload_fill.style.width = `${rounded}%`
        upload_track.setAttribute("aria-valuenow", String(rounded))
        if(rounded >= 100) upload_hint.textContent = upload_hint.dataset["finishing_label"] || ""
    }

    // Function For Check If There Is Something To Lose
    const isDirty = ():boolean => getMediaState().count > 0 || description.innerText.trim().length > 0 || location_input.value.trim().length > 0

    // Function For Reset The Draft
    function reset():void {
        posts_preview_state.current_files = [] // Deletes The Selected Files
        syncFiles(select_posts, posts_preview) // Synchronizes Files

        description.innerHTML = "" // Deletes The Description
        description.dispatchEvent(new Event("input")) // Lets The Tag And Hashtag Handlers Clear Their State

        location_input.value = "" // Deletes The Location
        ;(form.querySelector(".latitude") as HTMLInputElement).value = ""
        ;(form.querySelector(".longitude") as HTMLInputElement).value = ""

        selectAudience(audience_hint.dataset["is_private_account"] === "true" ? "followers" : "everyone")
        ;(form.querySelector("#allow_comments") as HTMLInputElement).checked = true
        ;(form.querySelector("#hide_likes") as HTMLInputElement).checked = false

        const label:HTMLSpanElement = submit.querySelector("span") as HTMLSpanElement // Gets The Share Button Label
        label.textContent = submit.dataset["label"] || ""

        goTo("media")
    }

    // Events

    step_next.addEventListener("click", function():void {
        if(getStep() === "media") goTo("details")
        else if(getStep() === "details") goTo("audience")
    })

    step_back.addEventListener("click", function():void {
        if(getStep() === "details") goTo("media")
        else if(getStep() === "audience") goTo("details")
    })

    audience_options.forEach(function(one_option:HTMLButtonElement):void {
        one_option.addEventListener("click", () => selectAudience(one_option.dataset["audience"] === "followers" ? "followers" : "everyone"))
    })

    upload_cancel.addEventListener("click", function():void {
        if(cancel_upload_handler) cancel_upload_handler()
    })

    upload_done.addEventListener("click", () => window.location.reload()) // Reloads The Feed, Which Shows The Processing Post

    description.addEventListener("input", updateDescriptionCounter)

    // Watches The Preview, Because The Files Are Added And Validated Asynchronously
    new MutationObserver(updateMediaButton).observe(posts_preview, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-filename"] })

    // Initialization

    selectAudience(audience_hint.dataset["is_private_account"] === "true" || !public_visibility.checked ? "followers" : "everyone")
    goTo("media")

    return {
        goTo,
        showError,
        setProgress,
        isDirty,
        reset,
        onCancelUpload: (handler:() => void) => cancel_upload_handler = handler
    }
}
