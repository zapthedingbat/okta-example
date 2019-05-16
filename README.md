OKTA Example
===

This repository demonstrates a stateless web application authenticating a user with OKTA.
It follows the *Authorization Code Flow* as described in [the OKTA documentation](https://developer.okta.com/authentication-guide/implementing-authentication/auth-code/).

## Running locally
You will need to configure an application in OKTA and record the client id and secret.

Set the environment variables 
`OKTA_CLIENT_ID` and 
`OKTA_CLIENT_SECRET`
with the the respective values from OKTA.

- Ensure your `.env` file in the root of the project has these values defined.
- Run `npm start`.
- The application will start listening on port 3000.
- Navigate to [localhost:3000](http://localhost:3000/) in your browser.
