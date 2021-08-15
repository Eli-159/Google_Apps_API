const google = require('googleapis').google;
const fs = require('fs');
const credentials = require('./credentials.json');
const Google = require('./google-data.js');

Google.Sheets.getSheetsAccess();
Google.Sheets.clearSheetData('1NkH0rJkivbyvnZYOqNhPUeUQsuQQkCNwyww54Omu5E0', 'A1:F1').then(data => console.log(data)).catch(err => console.log(err));