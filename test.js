const google = require('googleapis').google;
const fs = require('fs');
const credentials = require('./credentials.json');
const Google = require('./google-data.js');

Google.Sheets.getSheetsAccess();
