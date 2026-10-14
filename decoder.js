const maxLength = 10000;

// check empty input, size, and JWT structure
function validateInput(token) {

    // check if the input is empty (e.g. clicked decode without pasting a token)
    if (!token || token.trim() === "") {
        return "Please paste a token";
    }

    // limit input size to prevent abuse
    if (token.length > maxLength) {
        return "Input too large";
    }

    // split JWT into three parts
    const parts = token.trim().split(".");

    // verify there are exactly 3 non-empty parts
    if (parts.length !== 3 || parts.some(part => part === "")) {
        return "Token must have three non-empty parts.";
    }

    // no errors found so far
    return null;
}


// check that the Base64URL encoding is correct
function validateBase64URL(segment, binary) {

    // re-encode the binary data to Base64URL
    const reencoded = btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    // check whether the 'new' encoding matches the original
    if (reencoded !== segment) {
        throw new Error("Invalid Base64URL encoding.");
    }
}


// decode Base64URL and parse JSON
// its own function to re-use for both header and payload
function decodeSegment(segment) {

    // check for invalid Base64URL characters
    if (!/^[A-Za-z0-9_-]+$/.test(segment)) {
        throw new Error("Invalid Base64URL encoding.");
    }

    // check for an impossible Base64URL length
    if (segment.length % 4 === 1) {
        throw new Error("Invalid Base64URL length.");
    }

    // convert to standard Base64
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");

    // decode Base64 into bytes
    const binary = atob(base64);

    // check that the encoding is 'correct'
    validateBase64URL(segment, binary);

    // convert the decoded binary data into an array of bytes
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));

    // convert bytes into UTF-8 text
    const decodedText = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    // parse as JSON
    const parsed = JSON.parse(decodedText);

    // verify it's a JSON object
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Decoded segment must contain a JSON object.");
    }

    return parsed;
}


// put the validation and decoding together
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
            payload: payload,
            signature: parts[2]
        };

    } catch (error) {
        // return a readable error instead of crashing
        return { error: "Unable to decode token: " + error.message };
    }
}


// safely display the decoded information
function displayResults(data) {

}

// get the textarea and decode button from the HTML page
const tokenInput = document.getElementById("jwt-input");
const decodeButton = document.getElementById("decode-button");

decodeButton.addEventListener("click", function () {

    const token = tokenInput.value;

    // pass input to the decoder
    const result = decodeToken(token);

    // find where we'll display errors
    const errorMessage = document.getElementById("token-error");

    if (result.error) {
        // display the error as plain text, not HTML
        errorMessage.textContent = result.error;
        errorMessage.hidden = false;
        return;
    }

    // clear any previous error when decoding succeeds
    errorMessage.textContent = "";
    errorMessage.hidden = true;

    // find the header code block
    const headerOutput = document.getElementById("header-json");

    // format the decoded header as readable JSON
    headerOutput.textContent = JSON.stringify(result.header, null, 2);

    // find the payload code block
    const payloadOutput = document.getElementById("payload-json");

    // format the decoded payload as readable JSON
    payloadOutput.textContent = JSON.stringify(result.payload, null, 2);

    // find the signature code block
    const signatureOutput = document.getElementById("signature-output");

    // display the encoded signature (not verified)
    signatureOutput.textContent = result.signature;
});