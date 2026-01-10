// Function For Generate Random Color In The Specific Range
export function randomColor(from=0, to=255) {
    return `rgb(
        ${Math.floor(Math.random() * ((to + 1) - from) + from)},
        ${Math.floor(Math.random() * ((to + 1) - from) + from)},
        ${Math.floor(Math.random() * ((to + 1) - from) + from)}
    )`
}