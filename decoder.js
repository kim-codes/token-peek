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

    displayResults(result);
});

// safely display the decoded information
function displayResults(result) {
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

    // find the issuer card
    const issuerOutput = document.getElementById("issuer-value");

    // display the issuer, or a fallback if it's missing
    issuerOutput.textContent = result.payload.iss ?? "Not provided";

    // find the audience card
    const audienceOutput = document.getElementById("audience-value");

    // display the audience, or a fallback if it's missing
    // get the audience claim
    const audience = result.payload.aud;

    // check if the audience contains multiple values
    if (Array.isArray(audience)) {
        audienceOutput.textContent = audience.join(", ");
    } else {
        audienceOutput.textContent = audience ?? "Not provided";
    }

    // find the subject card
    const subjectOutput = document.getElementById("subject-value");

    // display the subject, or a fallback if it's missing
    subjectOutput.textContent = result.payload.sub ?? "Not provided";

    // find the expiration status heading
    const expirationStatus = document.getElementById("expiration-status");

    // get the expiration claim from the payload
    const exp = result.payload.exp;

    // check whether the token has an expiration time
    if (typeof exp !== "number" || !Number.isFinite(exp)) {
        expirationStatus.textContent = "unknown.";
    } else if (isTokenExpired(exp)) {
        expirationStatus.textContent = "expired.";
    } else {
        expirationStatus.textContent = "not expired.";
    }

    // find the issued date and time elements
    const issuedDate = document.getElementById("issued-date");
    const issuedTime = document.getElementById("issued-time");

    // get the issued-at claim
    const iat = result.payload.iat;

    // display the issued date and time if available
    if (typeof iat === "number" && Number.isFinite(iat)) {
        const date = getTokenDate(iat);

        issuedDate.textContent = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        issuedTime.textContent = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        });
    } else {
        issuedDate.textContent = "Not provided";
        issuedTime.textContent = "";
    }

    // find the expiration date and time elements
    const expiresDate = document.getElementById("expires-date");
    const expiresTime = document.getElementById("expires-time");

    // display the expiration date and time if available
    if (typeof exp === "number" && Number.isFinite(exp)) {
        const date = getTokenDate(exp);

        expiresDate.textContent = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        expiresTime.textContent = date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        });
    } else {
        expiresDate.textContent = "Not provided";
        expiresTime.textContent = "";
    }

    // find the current date and time elements
    const nowDate = document.getElementById("now-date");
    const nowTime = document.getElementById("now-time");

    // get the current date and time
    const now = new Date();

    // display today's date
    nowDate.textContent = now.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    // display the current time
    nowTime.textContent = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });

    // find the encoded token element
    const encodedTokenOutput = document.getElementById("encoded-token-output");

    // display the original token with color-coded segments
    colorCodeToken(tokenInput.value, encodedTokenOutput);

    // update the lifetime progress bar
    updateTokenLifetime(iat, exp);
}


/****************************************
 * HELPER FUNCTIONS
 ****************************************/

// check whether a token has expired
function isTokenExpired(exp) {

    // get the current time in seconds
    const currentTime = Math.floor(Date.now() / 1000);

    // compare the expiration time against the current time
    return currentTime >= exp;
}

// convert a JWT timestamp into a JavaScript Date
function getTokenDate(timestamp) {
    return new Date(timestamp * 1000);
}

// color code the three parts of the encoded JWT
function colorCodeToken(token, outputElement) {

    // split the original token into its three encoded parts
    const [header, payload, signature] = token.trim().split(".");

    // create a span for each part
    const parts = [
        { value: header, className: "token-header" },
        { value: payload, className: "token-payload" },
        { value: signature, className: "token-signature" }
    ];

    // clear the previous token
    outputElement.replaceChildren();

    // display each part with its own color
    parts.forEach((part, index) => {
        const span = document.createElement("span");

        span.className = part.className;
        span.textContent = part.value;

        outputElement.appendChild(span);

        // add the period between segments
        if (index < parts.length - 1) {
            outputElement.appendChild(document.createTextNode("."));
        }
    });
}

// update the token lifetime progress bar
function updateTokenLifetime(iat, exp) {

    // find the progress bar and its marker
    const progressBar = document.querySelector(".timeline-progress");
    const progressMarker = document.querySelector(".timeline-marker");

    // check that both timestamps are usable
    if (!Number.isFinite(iat) || !Number.isFinite(exp) || exp <= iat) {
        progressBar.style.width = "0%";
        progressMarker.style.display = "none";
        return;
    }

    // get the current time in seconds
    const now = Date.now() / 1000;

    // calculate how much of the token's lifetime has passed
    const elapsed = now - iat;
    const total = exp - iat;
    const percentage = (elapsed / total) * 100;

    // keep the percentage between 0 and 100
    const progress = Math.max(0, Math.min(100, percentage));

    // update the progress bar and marker
    progressBar.style.width = progress + "%";
    progressMarker.style.left = progress + "%";
    progressMarker.style.display = "";
}