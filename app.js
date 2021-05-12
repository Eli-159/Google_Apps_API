const google = require('googleapis').google;

const credentials = require('./credentials.json');

const scopes = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, scopes);
const drive = google.drive({ version: 'v3', auth });

const test =  () => {
  return new Promise((resolve, reject) => {
    Promise.all([
      drive.files.get({fileId: '1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr', alt: 'media'}),
      drive.files.get({fileId: '1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr', fields: 'files(id, name)'})
    ])
    // .then(fileResponse => resolve({
    //   content: fileResponse[0].data,
    //   kind: fileResponse[1].data.kind,
    //   mimeType: fileResponse[1].data.mimeType,
    //   name: fileResponse[1].data.name,
    //   id: fileResponse[1].data.id,
    //   description: fileResponse[1].data.description
    // }))
    .then(fileResponse => resolve(fileResponse[1].data))
    .catch(err => console.log(err));
  });
}
test().then(d => console.log(d));