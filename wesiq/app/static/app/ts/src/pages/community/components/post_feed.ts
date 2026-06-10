import { 
    addComment,
    toggleShowReplies,
    toggleReplyOnComment
} from "../functions/postForum.js"

import { 
    loadPosts,
    generateStyledDescription,
    generatePostBars,
    seenPostObserver
} from "../functions/posts.js"

import { 
    togglePostLike,
    sharePost,
    togglePostSave,
    reportPost,
    editPostSettings,
    deletePost
} from "../functions/postSocialInteractions.js"

import { 
    togglePostCommentLike,
    reportComment,
    deleteComment 
} from "../functions/postForumSocialInteractions.js"

import {
    playPauseVideo,
    stepBack,
    stepFurther,
    muteUnmuteVideo,
    changeVideoSpeed,
    toogleVideoFullscreen,
    changeVideoVolume,
    changePost
} from "../functions/customVideoPlayback.js"

import { focusAtEnd } from "../functions/customTextarea.js"
import { toggleFollow } from "../functions/toggleFollow.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Post Feed

    // Variables

    const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container
    const all_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".post_container") // Gets All Post Containers
    const feed_report:HTMLParagraphElement|null = feed.querySelector(".feed_report") as HTMLParagraphElement || null // Gets The Feed Report

    // Global Event Delegations

    // Feed Click Functionalities
    feed.addEventListener("click", function(event:PointerEvent):void {
        // Post Container
        if((event.target as HTMLElement).closest(".post_container") as HTMLDivElement) {
            // Follow Button Click Functionalities
            if((event.target as HTMLDivElement).classList.contains("follow_button")) {
                event.preventDefault() // Prevents Redirect To The User's Profile

                const follow_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Follow Button
                const clicked_user_id:number|null = Number(follow_button.dataset["id"]) || null // Gets Clicked User ID
                toggleFollow(null, follow_button, clicked_user_id)
            }

            // Toggle Post Like Click Functionality
            if(
                (event.target as HTMLElement).classList.contains("fa-heart") &&
                (event.target as HTMLElement).closest(".society")
            ) {
                const toggle_like:HTMLElement = event.target as HTMLElement // Gets The Heart Icon
                const likes_counter:HTMLParagraphElement|null = (toggle_like.parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement || null // Gets The Likes Counter
                const post_container:HTMLDivElement = toggle_like.closest(".post_container") as HTMLDivElement // Gets The Post Container
                const particles:HTMLDivElement = post_container.querySelector(".media .particles") as HTMLDivElement // Gets The Particles Container

                if(post_container.dataset["post_id"]) togglePostLike(toggle_like, likes_counter, Number(post_container.dataset["post_id"]), particles) // Adds Or Removes Like From The Post
            }

            // Share Post
            if((event.target as HTMLElement).classList.contains("fa-share-nodes")) {
                const share_icon:HTMLElement = event.target as HTMLElement // Gets The Share Icon
                const share:HTMLDivElement = share_icon.closest(".share") as HTMLDivElement // Gets The Share Container
                const post_container:HTMLDivElement = share_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                if(post_container.dataset["post_id"] && share.dataset["author"]) sharePost(Number(post_container.dataset["post_id"]), share.dataset["author"]) // Shares The Post
            }

            // Save Post
            if((event.target as HTMLElement).classList.contains("fa-bookmark")) {
                const save_icon:HTMLElement = event.target as HTMLElement // Gets The Save Icon
                const post_container:HTMLDivElement = save_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                if(post_container.dataset["post_id"]) togglePostSave(save_icon, Number(post_container.dataset["post_id"])) // Saves Or Unsaves The Post
            }

            // Report Post
            if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("report_post")) {
                const report_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Report Button
                const post_container:HTMLDivElement = report_button.closest(".post_container") as HTMLDivElement // Gets The Post Container
                const report_reason:string|null = report_button.dataset["reason"] || null // Gets The Report Reason

                if(post_container.dataset["post_id"] && report_reason) reportPost(Number(post_container.dataset["post_id"]), report_reason) // Reports The Post
            }

            // Edit Post Settings
            if(
                (event.target as HTMLButtonElement).closest(".post_settings") &&
                event.target instanceof HTMLInputElement
            ) {
                const toggle_button:HTMLInputElement = event.target as HTMLInputElement // Gets The Toggle Button
                const post_container:HTMLDivElement = toggle_button.closest(".post_container") as HTMLDivElement // Gets The Post Container
                const icon:HTMLElement = (toggle_button.parentElement as HTMLDivElement).querySelector("i") as HTMLElement // Gets The Icon

                if(post_container.dataset["post_id"]) editPostSettings(Number(post_container.dataset["post_id"]), toggle_button, icon) // Edits The Post Settings
            }

            // Delete Post
            if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("delete_post")) {
                const option:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Clicked Option (Yes / No)
                const post_container:HTMLDivElement = option.closest(".post_container") as HTMLDivElement // Gets The Post Container
                const action:string|null = option.dataset["action"] || null // Gets The Action Of The Clicked Option

                if(post_container.dataset["post_id"] && action && action === "delete") deletePost(Number(post_container.dataset["post_id"]), post_container) // Deletes The Post
            }

            // Comment Forum

            // Toggle Show / Hide Comment Forum
            if(
                (event.target as HTMLElement).classList.contains("fa-comment") &&
                ((event.target as HTMLElement).parentElement as HTMLDivElement).classList.contains("comments")
            ) {
                const comment_forum:HTMLDivElement|null = (((event.target as HTMLElement).closest(".society") as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".comment_forum") as HTMLDivElement || null // Gets The Comment Forum (Null If The Comments Are Turned Off)

                if(comment_forum) {
                    !comment_forum.classList.contains("hidden") ? comment_forum.classList.add("hidden") : comment_forum.classList.remove("hidden") // Shows or Hides The Comment Forum
                }
            }

            // Add Emoji To The Write Comment Input
            if(
                (event.target as HTMLElement).classList.contains("add_emoji") &&
                (event.target as HTMLElement).closest(".write_comment_form")
            ) {
                const add_emoji:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Add Emoji Button
                const emoji_picker_container:HTMLDivElement = (add_emoji.parentElement as HTMLDivElement).querySelector(".emoji_picker_container") as HTMLDivElement // Gets The Emoji Picker Container

                event.stopPropagation() // Prevents The Closing Of The Emoji Picker Container
                emoji_picker_container.classList.toggle("hidden") // Shows Or Hides The Emoji Picker Container
            }

            // Send Comment
            if((event.target as HTMLButtonElement).classList.contains("send")) {
                const send_comment:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Send Comment Button
                const post_container:HTMLDivElement = send_comment.closest(".post_container") as HTMLDivElement // Gets The Post Container
                const comments_counter:HTMLParagraphElement = post_container.querySelector(".society .comments .comments_counter") as HTMLParagraphElement // Gets The Comments Counter
                const write_comment_form:HTMLDivElement = post_container.querySelector(".comment_forum .write_comment_form") as HTMLDivElement // Gets The Write Comment Form
                const comment:HTMLDivElement = write_comment_form.querySelector(".comment") as HTMLDivElement // Gets The Comment Input
                const all_comments:HTMLDivElement = post_container.querySelector(".comment_forum .all_comments") as HTMLDivElement // Gets All Comments Container
                const parent_id:number|null = Number(write_comment_form.dataset["parent_id"]) || null // Gets The Parent ID If Is Available

                if(post_container.dataset["post_id"] && comment.innerText.length > 0) addComment(Number(post_container.dataset["post_id"]), write_comment_form, all_comments, feed, parent_id, comments_counter) // Adds Comment To The Post
            }

            // Toggle Reply On Comment
            if(
                (event.target as HTMLElement).closest(".interactions") &&
                ((event.target as HTMLElement).classList.contains("fa-comment") ||
                (event.target as HTMLElement).classList.contains("fa-comment-slash"))
            ) {
                const icon:HTMLElement = event.target as HTMLElement // Gets The Reply Icon
                const write_comment_form:HTMLDivElement = (icon.closest(".comment_forum") as HTMLDivElement).querySelector(".write_comment_form") as HTMLDivElement // Gets The Write Comment Form
                const one_comment:HTMLDivElement = icon.closest(".one_comment") as HTMLDivElement // Gets The One Comment

                toggleReplyOnComment(icon, write_comment_form, one_comment)
            }

            // Toggle Comment Like Click Functionality
            if(
                (event.target as HTMLElement).classList.contains("fa-heart") &&
                (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement
            ) {
                const one_comment:HTMLDivElement = (event.target as HTMLElement).closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                const comment_likes_counter:HTMLParagraphElement = ((event.target as HTMLElement).parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter

                if(one_comment.dataset["comment_id"]) togglePostCommentLike(event.target as HTMLElement, comment_likes_counter, Number(one_comment.dataset["comment_id"])) // Adds Or Removes Like From The Comment
            }

            // Show Replies
            if(((event.target as HTMLElement).parentElement as HTMLDivElement).classList.contains("show_replies")) {
                const show_replies_icon:HTMLElement = event.target as HTMLElement // Gets The Show Replies Icon
                const one_comment:HTMLDivElement = show_replies_icon.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                const reply_container:HTMLDivElement = one_comment.querySelector(".reply_container") as HTMLDivElement // Gets The Reply Container
                
                toggleShowReplies(show_replies_icon, reply_container) // Toggles Visibility Of The Comment Replies
            }

            // Report Comment
            if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("report_comment")) {
                const report_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Report Button
                const one_comment:HTMLDivElement = report_button.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                const report_reason:string|null = report_button.dataset["reason"] || null // Gets The Report Reason

                if(one_comment.dataset["comment_id"] && report_reason) reportComment(Number(one_comment.dataset["comment_id"]), report_reason) // Reports The Comment
            }

            // Delete Comment
            if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("delete_comment")) {
                const option:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Clicked Option (Yes / No)
                const one_comment:HTMLDivElement = option.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                const action:string|null = option.dataset["action"] || null // Gets The Action Of The Clicked Option
                const post_container:HTMLDivElement = option.closest(".post_container") as HTMLDivElement // Gets The Post Container
                const comments_counter:HTMLParagraphElement = post_container.querySelector(".society .comments .comments_counter") as HTMLParagraphElement // Gets The Comments Counter

                if(one_comment.dataset["comment_id"] && action && action === "delete") deleteComment(Number(one_comment.dataset["comment_id"]), one_comment, comments_counter) // Deletes The Comment
            }
        }
        
        // Post Bars Click Functionalities
        if((event.target as HTMLDivElement).classList.contains("bar")) {
            const clicked_bar:HTMLDivElement = event.target as HTMLDivElement // Gets The Clicked Bar
            const media_container:HTMLDivElement = clicked_bar.closest(".media") as HTMLDivElement // Gets The Media Container
            const post_bars:HTMLDivElement = clicked_bar.parentElement as HTMLDivElement // Gets The Post Bars Container
            const clicked_bar_index:number = [...post_bars.querySelectorAll<HTMLDivElement>(".bar")].indexOf(clicked_bar) // Gets The Clicked Bar Index

            changePost(clicked_bar_index, media_container, post_bars) // Changes The Post
        }

        // Previous Post
        if(
            (event.target as HTMLButtonElement).classList.contains("previous") && 
            !(event.target as HTMLButtonElement).classList.contains("hidden")
        ) {
            const previous:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Previous Button
            const media_container:HTMLDivElement = previous.closest(".media") as HTMLDivElement // Gets The Media Container
            const post_bars:HTMLDivElement = ((previous.parentElement as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
            const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
            const post_index:number = [...all_media].indexOf(previous.parentElement as HTMLDivElement) - 1 // Gets The Previous Post Index

            changePost(post_index, media_container, post_bars) // Changes The Post
        }

        // Next Post
        if(
            (event.target as HTMLButtonElement).classList.contains("next") && 
            !(event.target as HTMLButtonElement).classList.contains("hidden")
        ) {
            const next:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Next Button
            const media_container:HTMLDivElement = next.closest(".media") as HTMLDivElement // Gets The Media Container
            const post_bars:HTMLDivElement = ((next.parentElement as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
            const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
            const post_index:number = [...all_media].indexOf(next.parentElement as HTMLDivElement) + 1 // Gets The Next Post Index

            changePost(post_index, media_container, post_bars) // Changes The Post
        }

        // Play / Pause Video
        if((event.target as HTMLButtonElement).classList.contains("play_pause")) {
            const play_pause_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Play / Pause Icon
            const play_pause_indicator:HTMLDivElement = (play_pause_icon.closest(".video_container") as HTMLDivElement).querySelector(".play_pause_indicator") as HTMLDivElement // Gets The Play / Pause Indicator
            const video:HTMLVideoElement = (play_pause_icon.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

            playPauseVideo(play_pause_icon, play_pause_indicator, video) // Plays Or Pauses The Video
        }

        // Step Back
        if((event.target as HTMLButtonElement).classList.contains("step_back")) {
            const step_back_indicator:HTMLDivElement = ((event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement).querySelector(".step_back_indicator") as HTMLDivElement // Gets The Step Back Indicator
            const video:HTMLVideoElement = ((event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

            stepBack(step_back_indicator, video) // Rewinds The Video 5 Seconds
        }

        // Step Further
        if((event.target as HTMLButtonElement).classList.contains("step_further")) {
            const step_further_indicator:HTMLDivElement = ((event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement).querySelector(".step_further_indicator") as HTMLDivElement // Gets The Step Further Indicator
            const video:HTMLVideoElement = ((event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

            stepFurther(step_further_indicator, video) // Fast Forwards The Video 5 Seconds
        }

        // Mute / Unmute Video
        if((event.target as HTMLButtonElement).classList.contains("mute_unmute")) {
            const volume_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Volume Icon
            const volume_input:HTMLInputElement = (volume_icon.closest(".volume_container") as HTMLDivElement).querySelector(".volume") as HTMLInputElement // Gets the Volume Input
            const video:HTMLVideoElement = (volume_icon.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

            muteUnmuteVideo(volume_icon, volume_input, video) // Mutes Or Unmutes The Video
        }

        // Change Video Speed
        if(((event.target as HTMLButtonElement).parentElement as HTMLDivElement).classList.contains("video_speed")) {
            const speed_button:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Video Speed Button
            const all_speed_buttons:NodeListOf<HTMLButtonElement> = (speed_button.parentElement as HTMLDivElement).querySelectorAll<HTMLButtonElement>(".speed_button") // Gets All Speed Buttons
            const speed:number|null = Number(speed_button.dataset["speed"]) || null // Gets The Speed Value
            const video:HTMLVideoElement = (speed_button.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

            if(speed) changeVideoSpeed(speed, video, speed_button, all_speed_buttons) // Changes The Video Speed
        }

        // Toogle Video Fullscreen
        if((event.target as HTMLButtonElement).classList.contains("fullscreen")) {
            const toggle_fullscreen_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Toggle Fullscreen Icon
            const video_container:HTMLDivElement = (event.target as HTMLButtonElement).closest(".video_container") as HTMLDivElement // Gets The Video Container

            toogleVideoFullscreen(toggle_fullscreen_icon, video_container) // Plays Or Pauses The Video
        }

        return
    })

    // Feed Mouse Down Functionality
    feed.addEventListener("mousedown", function(event:MouseEvent):void {
        // Add Emoji To The Write Comment Input
        if(
            ((event.target as HTMLElement).classList.contains("add_emoji") ||
            (event.target as HTMLElement).classList.contains("emoji_picker_container")) &&
            (event.target as HTMLElement).closest(".write_comment_form")
        ) {
            event.preventDefault() // Prevents Default Behaviour
        }
    })

    // Feed Emoji Click Functionality
    feed.addEventListener("emoji-click", function(event:Event):void {
        // Add Emoji To The Write Comment Input
        if(
            (event.target as HTMLElement).tagName.toLowerCase() === "emoji-picker" &&
            (event.target as HTMLElement).closest(".write_comment_form")
        ) {
            const picker:Element = event.target as Element // Gets The Emoji Picker
            const comment:HTMLDivElement = (picker.closest(".write_comment_form") as HTMLDivElement).querySelector(".comment") as HTMLDivElement // Gets The Comment Input

            const custom_event:CustomEvent<{
                unicode:string
            }> = event as CustomEvent<{ unicode: string }>
        
            const emoji:string = custom_event.detail.unicode // Gets The Clicked Emoji
            const selection:Selection|null = window.getSelection()
            const isInsideEditable:boolean|null = selection && selection.rangeCount > 0 && comment.contains(selection.anchorNode)

            if(!isInsideEditable) focusAtEnd(comment)

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
        }
    })

    // Feed Mouse Over Functionality
    feed.addEventListener("mouseover", function(event:MouseEvent):void {
        // Save Icon
        if((event.target as HTMLElement).classList.contains("fa-bookmark") && !(event.target as HTMLElement).classList.contains("active")) {
            const save_icon:HTMLElement = event.target as HTMLElement // Gets The Save Icon

            save_icon.classList.replace("fa-regular", "fa-solid")
        }
    })

    // Feed Mouse Out Functionality
    feed.addEventListener("mouseout", function(event:MouseEvent):void {
        // Save Icon
        if((event.target as HTMLElement).classList.contains("fa-bookmark") && !(event.target as HTMLElement).classList.contains("active")) {
            const save_icon:HTMLElement = event.target as HTMLElement // Gets The Save Icon

            save_icon.classList.replace("fa-solid", "fa-regular")
        }
    })

    // Feed Key Functionalities
    feed.addEventListener("keydown", function(event:KeyboardEvent):void {
        const post_container:HTMLDivElement|null = (event.target as HTMLElement).closest(".post_container") as HTMLDivElement || null // Gets The Post Container

        if(post_container) {
            const media_container:HTMLDivElement = post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container

            if(event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault() // Prevents Default Behaviour

            // Change Video Volume
            if((event.target as HTMLInputElement).classList.contains("volume")) {
                // Lower Volume
                if(event.key === "ArrowLeft") {
                    const volume_input:HTMLInputElement = event.target as HTMLInputElement // Gets The Volume Input
                    const volume_icon:HTMLElement = (volume_input.closest(".volume_container") as HTMLDivElement).querySelector(".mute_unmute i") as HTMLElement // Gets the Volume Icon
                    const video:HTMLVideoElement = (volume_input.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

                    changeVideoVolume(volume_input, volume_icon, video, -0.05) // Decreases The Video Volume
                }

                // Higher Volume
                else if(event.key === "ArrowRight") {
                    const volume_input:HTMLInputElement = event.target as HTMLInputElement // Gets The Volume Input
                    const volume_icon:HTMLElement = (volume_input.closest(".volume_container") as HTMLDivElement).querySelector(".mute_unmute i") as HTMLElement // Gets the Volume Icon
                    const video:HTMLVideoElement = (volume_input.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

                    changeVideoVolume(volume_input, volume_icon, video, 0.05) // Increases The Video Volume
                }
            }

            // Change Video Time
            else if(media_container.querySelector(".video_container:hover")) {
                const video_container:HTMLDivElement = media_container.querySelector(".video_container:hover") as HTMLDivElement // Gets The Video Container
                const video:HTMLVideoElement = video_container.querySelector(".video") as HTMLVideoElement // Gets The Video

                // Step Back
                if(event.key === "ArrowLeft") {
                    const step_back_indicator:HTMLDivElement = video_container.querySelector(".step_back_indicator") as HTMLDivElement // Gets The Step Back Indicator
                    stepBack(step_back_indicator, video) // Rewinds The Video 5 Seconds
                }

                // Step Further
                else if(event.key === "ArrowRight") {
                    const step_further_indicator:HTMLDivElement = video_container.querySelector(".step_further_indicator") as HTMLDivElement // Gets The Step Further Indicator
                    stepFurther(step_further_indicator, video) // Fast Forwards The Video 5 Seconds
                }
            }

            // Change Post
            else {
                const post_bars:HTMLDivElement = media_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container

                // Previous Post
                if(event.key === "ArrowLeft") {
                    const post_index:number = Number(media_container.dataset["active_index"]) - 1 // Gets The Previous Post Index
                    changePost(post_index, media_container, post_bars) // Changes The Post (Shows The Previous Post)
                }

                // Next Post
                else if(event.key === "ArrowRight") {
                    const post_index:number = Number(media_container.dataset["active_index"]) + 1 // Gets The Next Post Index
                    changePost(post_index, media_container, post_bars) // Changes The Post (Shows The Next Post)
                }
            }
        }

        if(event.key === "Enter") {
            // Post Container
            if((event.target as HTMLElement).closest(".post_container") as HTMLDivElement) {
                // Toggle Post Like
                if(
                    (event.target as HTMLButtonElement).classList.contains("likes") &&
                    (event.target as HTMLElement).closest(".society")
                ) {
                    const toggle_like:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Heart Icon
                    const likes_counter:HTMLParagraphElement|null = (toggle_like.parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement || null // Gets The Likes Counter
                    const post_container:HTMLDivElement = toggle_like.closest(".post_container") as HTMLDivElement // Gets The Post Container
                    const particles:HTMLDivElement = post_container.querySelector(".media .particles") as HTMLDivElement // Gets The Particles Container

                    if(post_container.dataset["post_id"]) togglePostLike(toggle_like, likes_counter, Number(post_container.dataset["post_id"]), particles) // Adds Or Removes Like From The Post
                }

                // Share Post
                if((event.target as HTMLButtonElement).classList.contains("share")) {
                    const share_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Share Icon
                    const share:HTMLDivElement = share_icon.closest(".share") as HTMLDivElement // Gets The Share Container
                    const post_container:HTMLDivElement = share_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                    if(post_container.dataset["post_id"] && share.dataset["author"]) sharePost(Number(post_container.dataset["post_id"]), share.dataset["author"]) // Shares The Post
                }

                // Save Post
                if((event.target as HTMLButtonElement).classList.contains("save")) {
                    const save_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Save Icon
                    const post_container:HTMLDivElement = save_icon.closest(".post_container") as HTMLDivElement // Gets The Post Container

                    if(post_container.dataset["post_id"]) togglePostSave(save_icon, Number(post_container.dataset["post_id"])) // Saves Or Unsaves The Post
                }

                // Edit Post Settings
                if(
                    event.target instanceof HTMLLabelElement && ((event.target as HTMLLabelElement).parentElement as HTMLDivElement).classList.contains("public_visibility_container") ||
                    event.target instanceof HTMLLabelElement && ((event.target as HTMLLabelElement).parentElement as HTMLDivElement).classList.contains("allow_comments_container") ||
                    event.target instanceof HTMLLabelElement && ((event.target as HTMLLabelElement).parentElement as HTMLDivElement).classList.contains("hide_likes_container")
                ) {
                    const toggle_button:HTMLInputElement = ((event.target as HTMLLabelElement).parentElement as HTMLDivElement).querySelector("input[type='checkbox']") as HTMLInputElement // Gets The Toggle Button
                    const post_container:HTMLDivElement = toggle_button.closest(".post_container") as HTMLDivElement // Gets The Post Container
                    const icon:HTMLElement = (toggle_button.parentElement as HTMLDivElement).querySelector("i") as HTMLElement // Gets The Icon

                    toggle_button.checked = !toggle_button.checked // Checks / Unchecks The Toggle Button
                    if(post_container.dataset["post_id"]) editPostSettings(Number(post_container.dataset["post_id"]), toggle_button, icon) // Edits The Post Settings
                }

                // Comment Forum

                // Toggle Show / Hide Comment Forum
                if((event.target as HTMLButtonElement).classList.contains("comments")) {
                    const comment_forum:HTMLDivElement = (((event.target as HTMLButtonElement).closest(".society") as HTMLDivElement).parentElement as HTMLDivElement).querySelector(".comment_forum") as HTMLDivElement // Gets The Comment Forum

                    !comment_forum.classList.contains("hidden") ? comment_forum.classList.add("hidden") : comment_forum.classList.remove("hidden") // Shows or Hides The Comment Forum
                }

                // Toggle Reply On Comment
                if(
                    (event.target as HTMLButtonElement).closest(".interactions") &&
                    ((event.target as HTMLButtonElement).classList.contains("reply") ||
                    ((event.target as HTMLButtonElement).querySelector("i") as HTMLElement).classList.contains("fa-comment-slash"))
                ) {
                    const icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Reply Icon
                    const write_comment_form:HTMLDivElement = (icon.closest(".comment_forum") as HTMLDivElement).querySelector(".write_comment_form") as HTMLDivElement // Gets The Write Comment Form
                    const one_comment:HTMLDivElement = icon.closest(".one_comment") as HTMLDivElement // Gets The One Comment

                    toggleReplyOnComment(icon, write_comment_form, one_comment)
                }

                // Toggle Comment Like
                if(
                    (event.target as HTMLButtonElement).classList.contains("likes") &&
                    (event.target as HTMLButtonElement).closest(".one_comment") as HTMLDivElement
                ) {
                    const icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Icon
                    const one_comment:HTMLDivElement = (event.target as HTMLButtonElement).closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                    const comment_likes_counter:HTMLParagraphElement = ((event.target as HTMLButtonElement).parentElement as HTMLDivElement).querySelector(".likes_counter") as HTMLParagraphElement // Gets The Likes Counter

                    if(one_comment.dataset["comment_id"]) togglePostCommentLike(icon, comment_likes_counter, Number(one_comment.dataset["comment_id"])) // Adds Or Removes Like From The Comment
                }

                // Show Replies
                if((event.target as HTMLButtonElement).classList.contains("show_replies")) {
                    const show_replies_icon:HTMLElement = (event.target as HTMLButtonElement).querySelector("i") as HTMLElement // Gets The Show Replies Icon
                    const one_comment:HTMLDivElement = show_replies_icon.closest(".one_comment") as HTMLDivElement // Gets The One Comment Container
                    const reply_container:HTMLDivElement = one_comment.querySelector(".reply_container") as HTMLDivElement // Gets The Reply Container
                    
                    toggleShowReplies(show_replies_icon, reply_container) // Toggles Visibility Of The Comment Replies
                }
            }

            // Post Bars Click Functionalities
            if((event.target as HTMLDivElement).classList.contains("bar")) {
                const clicked_bar:HTMLDivElement = event.target as HTMLDivElement // Gets The Clicked Bar
                const media_container:HTMLDivElement = clicked_bar.closest(".media") as HTMLDivElement // Gets The Media Container
                const post_bars:HTMLDivElement = clicked_bar.parentElement as HTMLDivElement // Gets The Post Bars Container
                const clicked_bar_index:number = [...post_bars.querySelectorAll<HTMLDivElement>(".bar")].indexOf(clicked_bar) // Gets The Clicked Bar Index

                changePost(clicked_bar_index, media_container, post_bars) // Changes The Post
            }
        }
    })

    // Feed Input Functionality
    feed.addEventListener("input", function(event:Event):void {
        // Change Video Volume
        if((event.target as HTMLInputElement).classList.contains("volume")) {
            const volume_input:HTMLInputElement = event.target as HTMLInputElement // Gets The Volume Input
            const volume_icon:HTMLElement = (volume_input.closest(".volume_container") as HTMLDivElement).querySelector(".mute_unmute i") as HTMLElement // Gets the Volume Icon
            const video:HTMLVideoElement = (volume_input.closest(".video_container") as HTMLDivElement).querySelector(".video") as HTMLVideoElement // Gets The Video

            changeVideoVolume(volume_input, volume_icon, video) // Changes The Video Volume
        }
    })

    all_post_containers.forEach(function(one_post_container:HTMLDivElement):void {
        // Functionalities For Every Post

        // Variables

        const description:HTMLParagraphElement|null = one_post_container.querySelector(".description") as HTMLParagraphElement || null // Gets The Description

        const media_container:HTMLDivElement = one_post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
        const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
        const post_bars:HTMLDivElement = one_post_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container
        
        // Initialization

        // Description
        if(description) {
            const tagged_users:string|null = description.dataset["tagged_users"] || null // Gets The Tagged Users Data
            const added_hashtags:string|null = description.dataset["added_hashtags"] || null // Gets The Added Hashtags
        
            if(tagged_users || added_hashtags) description.innerHTML = generateStyledDescription(description.textContent, tagged_users, added_hashtags) // Generates The Styled Description
        }

        // Bars
        generatePostBars(all_media, post_bars) // Generates The Post Bars
    })

    // Document Click Functionality
    document.addEventListener("click", function(event:PointerEvent):void {
        // When The User Clicks Outside The Emoji Picker Container
        if(
            !(event.target as HTMLDivElement).classList.contains("emoji_picker_container") &&
            !(event.target as HTMLDivElement).closest(".emoji_picker_container")
        ) {
            const all_emoji_picker_containers:NodeListOf<HTMLDivElement> = document.querySelectorAll<HTMLDivElement>(".emoji_picker_container") // Gets All Emoji Picker Containers
            all_emoji_picker_containers.forEach((one_emoji_picker_container) => one_emoji_picker_container.classList.add("hidden")) // Hides Every Emoji Picker Container
            return
        }
    })

    // Initialization

    seenPostObserver(feed) // Initializes The Post Observation

    // Infinite Feed Scroll
    if(feed_report) {
        const infinite_feed_scroll_observer:IntersectionObserver = new IntersectionObserver(function(entries:IntersectionObserverEntry[]):void {
            if(entries[0] && entries[0].isIntersecting) {
                loadPosts(feed, feed_report) // Loads The Posts
            }
        }, {
            root: null,
            rootMargin: "250px", // 250PX Before The End Of The Feed
            threshold: 0.1
        })
        
        loadPosts(feed, feed_report) // Loads The Posts
        infinite_feed_scroll_observer.observe(feed_report) // Starts The Observation
    }
})