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
    // check for invalid Base64URL characters
    if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
        throw new Error("Invalid Base64URL encoding.");
    }

    // convert to standard Base64
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");

    // decode into text
    const decodedText = atob(base64);

    // parse as JSON
    const parsed = JSON.parse(decodedText);

    // verify it's a JSON object
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Decoded segment must contain a JSON object.");
    }

    return parsed;
}

function decodeToken(token) {
    // validate input 
    const validationError = validateInput(token);

    if (validationError) {
        return { error: validationError };
    }

    try {
        // split the token into its three parts
        const parts = token.trim().split(".");

        // decode the header and payload
        const header = decodeSegment(parts[0]);
        const payload = decodeSegment(parts[1]);

        // return the decoded information
        return {
            header: header,
            payload: payload
        };

    } catch (error) {
        return { error: "Unable to decode token: " + error.message };
    }
}

// Safely display the decoded information
function displayResults(data) {

}