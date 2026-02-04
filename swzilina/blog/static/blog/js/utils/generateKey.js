const NUMBERS_CHAR_CODES = fromToNumbers(48, 57) // 0 - 9
const CAPITAL_LETTERS_CHAR_CODES = fromToNumbers(65, 90) // A - Z
const SMALL_LETTERS_CHAR_CODES = fromToNumbers(97, 122) // a - z
const CHARACTERS_CHAR_CODES = fromToNumbers(33, 47).concat(fromToNumbers(58, 64)).concat(fromToNumbers(91, 96)).concat(fromToNumbers(123, 126)) // Characters Char Codes

// Function For Create An Array From The Selected Range
function fromToNumbers(from, to) {
    const all_numbers = [] // Stores All Numbers

    for(let i = from; i <= to; i++) {
        all_numbers.push(i) // Pushes A Number To All Numbers
    }

    return all_numbers // Returns An Array Of All Numbers
}

// Function For Generate Random Key
export function generateKey(length, numbers=true, capital_letters=true, small_letters=true, characters=true) {
    const all_characters = [] // Stores All Characters

    // Selects Characters
    if(numbers) {
        NUMBERS_CHAR_CODES.forEach(function(one_code) {
            all_characters.push(String.fromCharCode(one_code))
        })
    }

    if(capital_letters) {
        CAPITAL_LETTERS_CHAR_CODES.forEach(function(one_code) {
            all_characters.push(String.fromCharCode(one_code))
        })
    }

    if(small_letters) {
        SMALL_LETTERS_CHAR_CODES.forEach(function(one_code) {
            all_characters.push(String.fromCharCode(one_code))
        })
    }

    if(characters) {
        CHARACTERS_CHAR_CODES.forEach(function(one_code) {
            all_characters.push(String.fromCharCode(one_code))
        })
    }

    const generated_key = [] // Stores Generated Key

    for(let i = 0; i < length; i++) {
        const all_characters_index = Math.floor(Math.random() * all_characters.length - 1) + 1 // Generates Random Index From Array Of All Characters

        generated_key.push(all_characters[all_characters_index]) // Pushes A Character To The Generated Key
    }

    return generated_key.join("") // Returns Generated Key
}