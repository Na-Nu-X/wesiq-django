import { 
    generateStyledDescription,
    generatePostBars
} from "../functions/posts.js"

import {
    getUploadProgress,
    setCompletedUploadProgress,
    checkProcessingPosts
} from "../functions/processingPosts.js"

import { 
    editPostSettings,
    deletePost 
} from "../functions/postSocialInteractions.js"

import type { compressTask } from "../functions/processingPosts.js"

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Processing Posts

    // Variables

    const feed:HTMLDivElement = document.querySelector(".feed") as HTMLDivElement // Gets The Feed Container
    const all_processing_post_containers:NodeListOf<HTMLDivElement> = feed.querySelectorAll<HTMLDivElement>(".processing_post_container") // Gets All Processing Post Containers

    let processing_posts:compressTask[] = JSON.parse(localStorage.getItem("processing_posts") || "[]") // Gets The Processing Posts From The Local Storage

    console.log(processing_posts)

    const processing_posts_media_ids:number[] = processing_posts.map((one_task:compressTask) => one_task.post_media_id) // Gets All Current Media IDs From The Local Storage

    all_processing_post_containers.forEach(function(one_post_container:HTMLDivElement):void {
        // Functionalities For Every Processing Post

        // Variables

        const processing_post_settings:HTMLDivElement = one_post_container.querySelector(".header .right .top .processing_post_settings") as HTMLDivElement // Gets The Processing Post Settings Popover Menu
        const delete_processing_post:HTMLDivElement = one_post_container.querySelector(".header .right .top .delete_processing_post") as HTMLDivElement // Gets The Delete Processing Post Popover Menu

        const description:HTMLParagraphElement|null = one_post_container.querySelector(".description") as HTMLParagraphElement || null // Gets The Description

        const media_container:HTMLDivElement = one_post_container.querySelector(".media") as HTMLDivElement // Gets The Media Container
        const all_media:NodeListOf<HTMLDivElement> = media_container.querySelectorAll<HTMLDivElement>(".one_post") // Gets All Media From The Posts
        const post_bars:HTMLDivElement = one_post_container.querySelector(".post_bars") as HTMLDivElement // Gets The Post Bars Container

        const processing_post_report:HTMLParagraphElement = one_post_container.querySelector(".processing_post_report") as HTMLParagraphElement // Gets The Processing Post Report
        const post_id:number|undefined = Number(one_post_container.dataset["post_id"]) // Gets The Post ID Of The Post Container

        // Events

        // Processing Post Settings Click Functionality
        processing_post_settings.addEventListener("click", function(event:PointerEvent):void {
            const toggle_button:HTMLInputElement = event.target as HTMLInputElement // Gets The Toggle Button
            const icon:HTMLElement = (toggle_button.parentElement as HTMLDivElement).querySelector("i") as HTMLElement // Gets The Icon

            if(post_id) editPostSettings(post_id, toggle_button, icon) // Edits The Processing Post Settings
        })

        // Delete Processing Post Click Functionality
        delete_processing_post.addEventListener("click", function(event:PointerEvent):void {
            const option:HTMLButtonElement = event.target as HTMLButtonElement // Gets The Clicked Option (Yes / No)
            const action:string|null = option.dataset["action"] || null // Gets The Action Of The Clicked Option

            if(post_id && action && action === "delete") deletePost(post_id, one_post_container) // Deletes The Processing Post
        })

        // Initialization

        // Description
        if(description) {
            const tagged_users:string|null = description.dataset["tagged_users"] || null // Gets The Tagged Users Data
            const added_hashtags:string|null = description.dataset["added_hashtags"] || null // Gets The Added Hashtags
        
            if(tagged_users || added_hashtags) description.innerHTML = generateStyledDescription(description.textContent, tagged_users, added_hashtags) // Generates The Styled Description
        }

        // Bars
        generatePostBars(all_media, post_bars) // Generates The Post Bars

        // Upload Progress
        processing_posts.forEach(function(one_task:compressTask) {
            const one_post:HTMLDivElement|undefined = [...all_media].find(function(one_post:HTMLDivElement) {
                return one_post.dataset["post_media_id"] === String(one_task.post_media_id)
            })

            if(one_post) {
                const upload_progress:HTMLDivElement = one_post.querySelector(".upload_progress") as HTMLDivElement // Gets The Upload Progress Container
                getUploadProgress(one_task.task_id, one_task.post_id, upload_progress, processing_post_report) // Gets The Upload Progress
            }
        })

        all_media.forEach(function(one_post:HTMLDivElement):void {
            const media_id:string|undefined = one_post.dataset["post_media_id"] // Gets The Media ID From The Dataset

            // Shows The Completed Upload Progress For Already Completed Media In The Post
            if(media_id && !processing_posts_media_ids.includes(Number(media_id))) {
                const upload_progress:HTMLDivElement = one_post.querySelector(".upload_progress") as HTMLDivElement // Gets The Upload Progress Container
                setCompletedUploadProgress(upload_progress) // Sets The State For The Completed Upload Progress
            }
        })

        if(post_id) checkProcessingPosts(post_id, processing_post_report) // Checks If There Is Any Other Media From Selected Post In The Processing Posts
    })
})