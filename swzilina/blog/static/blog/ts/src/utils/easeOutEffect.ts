// Function For Ease Out Animation Effect
export function easeOutEffect(progress:number):number {
    return 1 - Math.pow(1 - progress, 3)
}