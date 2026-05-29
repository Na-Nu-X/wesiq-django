interface circle {
    generate():void,
    animate():void
}

"use strict"

document.addEventListener("DOMContentLoaded", function():void {
    // Background Canvas

    // Variables

    const background_canvas:HTMLCanvasElement = document.querySelector(".background_canvas") as HTMLCanvasElement // Gets The Background Canvas
    const ctx:CanvasRenderingContext2D = background_canvas.getContext("2d") as CanvasRenderingContext2D // Gets The Canvas Context

    const CIRCLES_AMOUNT:number = 20 // Sets The Amount Of Circles
    const COLORS:string[] = ["#011C6B33", "#01114233", "#01258F33", "#023BE633", "#0231BD33"] // Stores The Colors
    let circles:circle[] = [] // Stores All Circles

    background_canvas.width = window.innerWidth // Sets The Width Of The Background Canvas
    background_canvas.height = window.innerHeight // Sets The Height Of The Background Canvas

    // Classes

    // Defines The Circle Class
    class Circle {
        #radius:number
        #x:number
        #y:number
        #dx:number
        #dy:number
        #color:string

        constructor() {
            this.#radius = Math.floor(generateNumberRange(5, 10)) // Generates Random Radius Of The Circle Between 5 And 10
            this.#x = Math.floor(generateNumberRange(this.#radius * 2, background_canvas.width - this.#radius * 2)) // Generates Random Position On The Canvas
            this.#y = Math.floor(generateNumberRange(this.#radius * 2, background_canvas.height - this.#radius * 2)) // Generates Random Position On The Canvas
            this.#dx = generateNumberRange(-0.5, 0.5) // Sets Random Float Number Of Speed Between -0.5 And 0.5
            this.#dy = generateNumberRange(-0.5, 0.5) // Sets Random Float Number Of Speed Between -0.5 And 0.5
            this.#color = COLORS[Math.floor(generateNumberRange(0, COLORS.length - 1))] || "black" // Sets The Random Color
        }

        // Generates The Circle
        generate():void {
            ctx.fillStyle = this.#color
            ctx.beginPath()
            ctx.arc(this.#x, this.#y, this.#radius, 0, Math.PI * 2)
            ctx.fill()
        }

        // Animates The Circle
        animate():void {
            this.#x += this.#dx
            this.#y += this.#dy

            // Reverses The Direction On The X Axis When Hits One Of The X Borders
            if(
                this.#x >= background_canvas.width - this.#radius ||
                this.#x <= this.#radius
            ) {
                this.#dx = -this.#dx
            }

            // Reverses The Direction On The Y Axis When Hits One Of The Y Borders
            if(
                this.#y >= background_canvas.height - this.#radius ||
                this.#y <= this.#radius
            ) {
                this.#dy = -this.#dy
            }
        }
    }

    // Functions

    // Function For Generate Range Of Numbers
    function generateNumberRange(from:number, to:number):number {
        return Math.random() * (to - from + 1) + from
    }

    // Function For Generate The Circles
    function generateCircles(amount:number = 1):void {
        for(let i:number = 0; i < amount; i++) {
            const circle = new Circle() // Creates The Circle
            circles.push(circle) // Pushes The Circle To The Array Of All Circles
        }
    }

    // Function For Display The Circles
    function displayCircles(array:circle[]):void {
        for(let i:number = 0; i < array.length; i++) {
            const circle:circle|undefined = array[i] // Gets The Circle Object

            if(circle) {
                circle.generate() // Generates The Circle
                circle.animate() // Animates The Circle
            }
        }
    }

    // Function For Start The Main Animation Loop
    function initializeMainLoop():void {
        ctx.clearRect(0, 0, background_canvas.width, background_canvas.height) // Clears The Canvas
        displayCircles(circles) // Displays The Generated Circles
        requestAnimationFrame(initializeMainLoop) // Loops The Animation
    }

    // Events

    // Window Resize Functionality
    window.addEventListener("resize", function() {
        background_canvas.width = window.innerWidth // Sets The Width Of The Background Canvas
        background_canvas.height = window.innerHeight // Sets The Height Of The Background Canvas
        ctx.clearRect(0, 0, background_canvas.width, background_canvas.height) // Clears The Canvas
        circles = [] // Deletes The Previous Circles
        generateCircles(CIRCLES_AMOUNT) // Regenerates Circles
    })

    // Initialization

    generateCircles(CIRCLES_AMOUNT) // Generates Circles
    initializeMainLoop() // Initializes The Main Loop
})