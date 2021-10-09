const google = require('googleapis').google;
const fs = require('fs');
const credentials = require('./credentials.json');
const Google = require('./google-data.js');

Google.Sheets.getSheetsAccess();
const range = new Google.Sheets.Range('Sheet1!A1', [['Test 1', 'Test 2'], ['Test 3', 'Test 4']]);
Google.Sheets.writeSheetData('1NkH0rJkivbyvnZYOqNhPUeUQsuQQkCNwyww54Omu5E0', range).then(data => console.log(data)).catch(err => console.log(err));
