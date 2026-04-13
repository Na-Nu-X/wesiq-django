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
    MAX_TAGGED_PEOPLE:number,
    tagged_people:string[]
} = {
    MAX_TAGGED_PEOPLE: 2, // Sets Maximum Amount Of Tagged People (10 By Default)
    tagged_people: [] // Stores All Tagged People
}