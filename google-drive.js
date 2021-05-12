const google = require('googleapis').google;
const credentials = require('./credentials.json');

module.exports = class Drive {
    constructor(id, name) {
        if (typeof id == 'string') {
            this.id = id;
        }
    };

    static scopes = ['https://www.googleapis.com/auth/drive'];

    static getDriveAccess() {
        const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, scopes);
        const drive = google.drive({ version: 'v3', auth });
        return drive;
    };

    static async getFileById() {
      return new Promise((resolve, reject) => {
        Promise.all([
          drive.files.get({fileId: '1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr', alt: 'media'}),
          drive.files.get({fileId: '1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr'}, {fields: 'files(name, id, kind, mimeType, description)'})
        ])
        .then(fileResponse => resolve({
          content: fileResponse[0].data,
          kind: fileResponse[1].data.kind,
          mimeType: fileResponse[1].data.mimeType,
          name: fileResponse[1].data.name,
          id: fileResponse[1].data.id,
          description: fileResponse[1].data.description
        }))
        .catch(err => reject(err));
      });
    }

    static getFileByName() {

    };
}


const drive = module.exports.getDriveAccess();
drive.files.list({
    pageSize: 5,
    fields: 'files(name, id)',
    orderBy: 'createdTime desc'
  }, (err, res) => {
    if (!err) {
      res.data.files.map(entry => {
        if (entry.name == 'clue-data.json') {
          drive.files.get({
            fileId: entry.id,
            alt: 'media'
          }).then(fileResponse => console.log(fileResponse.data));
        }
      });
    } else {
      console.log(err);
    }
  });