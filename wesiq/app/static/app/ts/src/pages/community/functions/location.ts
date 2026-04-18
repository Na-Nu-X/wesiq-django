interface NominatimPlace {
    display_name:string
    lat:string
    lon:string
    [key:string]:any
}

import { location_state } from "../state.js"

// Function For Get Unique Places From Fetched Data
function getUniquePlaces(data:NominatimPlace[]):NominatimPlace[] {
    return data.filter(function(one_place:NominatimPlace, index:number, self:NominatimPlace[]) {
        return index === self.findIndex(function(p:NominatimPlace) {
            return p.display_name === one_place.display_name
        })
    })
}

// Function For Store Coordinates To The Hidden Inputs
function storeCoordinates(data:NominatimPlace[], searched_location:string, latitude:HTMLInputElement, longitude:HTMLInputElement):boolean {
    const matching_location:NominatimPlace|null = data.find(one_place => one_place.display_name === searched_location) || null // Gets The Matching Location If There is Any

    if(matching_location) {
        latitude.value = matching_location.lat // Sets The Latitude
        longitude.value = matching_location.lon // Sets The Longitude
        
        return true // Returns True If The Coordinates Were Stored
    }

    else {
        latitude.value = "" // Deletes The Latitude
        longitude.value = "" // Deletes The Longitude

        return false // Returns False If The Coordinates Were Not Stored
    }
}

// Function For Get Locations By Searched Location
export async function getLocation(searched_location:string, location_results:HTMLDivElement, location:HTMLInputElement, latitude:HTMLInputElement, longitude:HTMLInputElement):Promise<void> {
    const url:string = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searched_location)}&addressdetails=1&limit=10&featuretype=settlement` // Nominatim API https://nominatim.org/

    const location_loading:HTMLDivElement = (location_results.parentNode as HTMLDivElement).querySelector(".loading") as HTMLDivElement // Gets The Loading

    try {
        const response:Response = await fetch(url, {
            headers: {
                "Accept-Language": navigator.language, // Gets Results In Users System Language
                "User-Agent": "Wesiq (behulpatrik@gmail.com)" // Sends User Agent Informations
            }
        })

        const data:NominatimPlace[] = await response.json() // Gets The Data
        const unique_data:NominatimPlace[] = getUniquePlaces(data) // Gets Only The Unique Data

        // Stores The Coordinates
        if(storeCoordinates(unique_data, searched_location, latitude, longitude)) {
            location.style.borderColor = "#52cf20" // Sets Green Border To The Location Input
        }

        else {
            location.removeAttribute("style") // Removes Hardcoded Style (style="border-color: rgb(82, 207, 32);") From The Location Input
        }

        renderLocationResults(unique_data, location_results, location, latitude, longitude) // Renders Location Results
    }
    
    catch(error) {
        console.error("Chyba pri načítaní polohy:", error)
    }

    finally {
        location_loading.classList.add("hidden") // Hides The Loader
    }
}

// Function For Render Location Results
function renderLocationResults(results:any[], location_results:HTMLDivElement, location:HTMLInputElement, latitude:HTMLInputElement, longitude:HTMLInputElement):void {
    location_results.innerHTML = "" // Deletes Location Results
    
    if(results.length === 0) {
        location_results.classList.add("hidden") // Hides The Location Results
        return
    }

    results.forEach(function(one_place):void {
        const place:HTMLDivElement = document.createElement("div") // Creates The Place Container

        place.classList.add("place") // Adds The Place Class
        place.textContent = one_place.display_name // Sets The Location Name To The Place Container
        place.tabIndex = -1 // Makes The Element Focusable
        
        // Adds The Location Name To The Location Input Value After Click
        place.addEventListener("click", function():void {
            location.value = one_place.display_name // Sets The Location Input Value
            location.style.borderColor = "#52cf20" // Sets Green Border To The Location Input
            
            location_results.classList.add("hidden") // Hides The Location Results

            latitude.value = one_place.lat // Sets The Latitude
            longitude.value = one_place.lon // Sets The Longitude
        })
        
        location_results.appendChild(place) // Appends The Place To The Location Results
    })

    location_results.classList.remove("hidden") // Shows The Location Results
}

// Function For Change Focused Place
export function changeFocusedPlace(index:number, location_results:HTMLDivElement):void {
    const all_places:NodeListOf<HTMLDivElement> = location_results.querySelectorAll(".place") // Gets All Places

    location_state.focused_place_index = index // Updates Focused Place Index

    if(index > all_places.length - 1) location_state.focused_place_index = 0 // Sets Focused Place Index To Minimum
    if(index < 0) location_state.focused_place_index = all_places.length - 1; // Sets Focused Place Index To Maximum

    (all_places[location_state.focused_place_index] as HTMLDivElement).focus() // Focuses The Place
}