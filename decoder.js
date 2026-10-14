const maxLength = 10000;

// check empty input, size, and JWT structure
function validateInput(token) {

    // check if the input is empty (probably just clicked decode without pasting a tokenconsole.log(validateInput(""));)
    if (!token || token.trim() === "") {
        return "Please paste a token";
    }

    // limit input size to prevent abuse
    if (token.length > maxLength) {
        return "Input too large";
    }

    // split JWT into  three parts
    const parts = token.trim().split(".");

    // verify there are exactly 3 non-empty parts
    if (parts.length !== 3 || parts.some(part => part === "")) {
        return "Token must have three non-empty parts.";
    }
}

// Decode Base64URL and parse JSON
// it's own function to re-use for both header and paylod
function decodeSegment(segment) {

}

// Put the checks and decoding together
function decodeToken(token) {

}

// Safely display the decoded information
function displayResults(data) {

}

console.log(validateInput(""));
console.log(validateInput("   "));
console.log(validateInput("abc.def.ghi"));
console.log(validateInput("a".repeat(10001)));
console.log(validateInput("abc..ghi"));
console.log(validateInput("abc.def.ghi.xyz"));

console.log(decodeSegment("eyJhbGciOiJIUzI1NiJ9"));
console.log(decodeSegment("%%%hello"));