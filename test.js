const google = require('googleapis').google;

const credentials = require('./credentials.json');

const scopes = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, scopes);
const drive = google.drive({ version: 'v3', auth });

const test =  () => {
    return new Promise((resolve, reject) => {
        drive.files.list({
            q: 'name=\'' + 'clue-data.json' + '\'',
            fields: 'files(id)',
            pageSize: 2
        }).then(res => resolve(res.data));
    });
}
test().then(d => console.log(d));