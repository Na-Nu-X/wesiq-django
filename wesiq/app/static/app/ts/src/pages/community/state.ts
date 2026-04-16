export interface tag {
    tagged_user?:string, // Stores The Tagged User Only If The At Sign Represents The Tag And Isn't Just An Ordinary Symbol

    position: {
        tag_start_index:number, // Stores The Starting Position
        tag_end_index:number // Stores The Ending Position
    }
}

export const posts_preview_state:{
    current_files:File[]
    MAX_IMAGE_SIZE:number
    MAX_VIDEO_SIZE:number
} = {
    current_files: [], // Stores Current Selected Files
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_VIDEO_SIZE: 100 * 1024 * 1024 // 100MB
}

export const tag_user_state:{
    MAX_TAGGED_USERS:number,
    tagged_users:string[],
    tagged_user:string,

    tags:tag[]
} = {
    MAX_TAGGED_USERS: 10, // Sets Maximum Amount Of Tagged Users (10 By Default)
    tagged_users: [], // Stores All Tagged People
    tagged_user: "", // Stores The Tagged Person

    tags: [] // Stores All Tags And Their Position Or Only The Position Of An Ordinary At Sign
}