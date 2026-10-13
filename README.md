# Token Peek
### a simple JWT decoder

a practical utility for decoding, interpreting, and troubleshooting JSON Web Tokens (JWTs)

 ## 
 paste a token, poke around, and get a clearer picture of what's inside without having to dig through documentation

## what's inside

- decode a JWT and inspect its header and payload
- switch between raw JSON and plain-English explanations
- see when a token was issued, becomes valid, and expires
- dig a little deeper into individual claims 

## a note on privacy & limitations

everything is decoded locally in your browser
no backend, no sending your token off to a server

a few things worth knowing:

- **decoded doesn't mean verified.** Token Peek doesn't verify JWT signatures
- the claims are simply what's written in the token, not proof that they're **trustworthy**
- this isn't a replacement for proper token validation in your app
- be mindful of pasting sensitive production tokens into any debugging tool

## running it locally

Token Peek is built with vanilla HTML, CSS, and JavaScript. No build tools or dependencies required.

opens direclty in the browser

## status

building and refining things 
