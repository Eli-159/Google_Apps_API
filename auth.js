const google = require('googleapis').google;
const fs = require('fs');

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
const TOKEN_PATH = './google/token.json';

// Exports the scopes, so they are available in other files.
module.exports.scopes = SCOPES;

// Exports a function to get the OAuth2 details.
module.exports.getAuthDetails = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Resolves the promise, passing the file content as an object.
            resolve(JSON.parse(content));
        });
    });
}

// Exports a function to get the auth url.
module.exports.getAuthUrl = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Resolves the promise, passing the authentication url.
            resolve(oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                response_type: 'code',
                client_id: credentials.web.client_id,
                scope: SCOPES,
                redirect_uri: credentials.web.redirect_uris.find(uri => uri.includes(process.env.DOMAIN))
            }));
        });
    });
};

// Exports a function to create and save an access token.
module.exports.createTokenFromCode = (code) => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            const redirect_uri = credentials.web.redirect_uris.find(uri => uri.includes(process.env.DOMAIN));
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Gets a new OAuth token.
            oAuth2Client.getToken({code, redirect_uri}, (err, fetchedToken) => {
                // Rejects the error if one occurs.
                if (err) return reject(err);
                // Tests if the refresh token was given, so that an old file with a refresh token will not be overided.
                if (fetchedToken.refresh_token) {
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(fetchedToken), (err) => {
                        if (err) return console.error(err);
                    });
                }
                // Resolves the promise, parsing through whether or not a refresh token was given.
                resolve(fetchedToken.refresh_token ? true : false);
            });
        });
    });
};

// Exports a function to load the access token from the json file.
module.exports.loadToken = () => {
    // Returns a promise.
    return new Promise((resolve, reject) => {
        // Load client secrets from a local file.
        fs.readFile('./google/oauth-credentials.json', (err, content) => {
            // Rejects an error.
            if (err) return reject(err);
            // Loads the client auth data into variables.
            const credentials = JSON.parse(content);
            const client_secret = credentials.web.client_secret;
            const client_id = credentials.web.client_id;
            // Declares a new instance of the google OAuth2 client.
            const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
            // Reads the file where the would be a previously stored token.
            fs.readFile(TOKEN_PATH, (err, savedToken) => {
                // Rejects an error.
                if (err) return reject(err);
                // Sets the OAuth2 client credentials to the saved token.
                oAuth2Client.setCredentials(JSON.parse(savedToken.toString()));
                // Resolves the promise, returning the OAuth2 client, meaning that it can just be passed as the auth in an api.
                resolve(oAuth2Client);
            });
        });
    });
};