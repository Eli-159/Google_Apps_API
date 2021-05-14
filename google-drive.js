const google = require('googleapis').google;
const credentials = require('./credentials.json');

module.exports = class Drive {
  // Declares a constructor function for the Drive class.
  constructor(fileData) {
    // Tests that all of the required parameters were passed in, and throws the appropriate error if they aren't.
    if (typeof fileData != 'object') {
      throw 'The file data is required as an object.';
    } else if (typeof fileData.id != 'string') {
      throw 'The id of the file is required as a string.';
    } else if (typeof fileData.name == 'string') {
      throw 'The name of the file is required as a string.';
    } else if (fileData.content == undefined || fileData.content == null) {
      throw 'The content of the file is required.';
    } else {
      // Assigns the data passed in to the new Drive instance.
      Object.assign(this, fileData);
    }
  };

  // Declares an array of scopes.
  static scopes = ['https://www.googleapis.com/auth/drive'];

  // Declares a static variable to hold the google drive access token.
  static access = null;

  // Declares a static function to get access to google drive and then load the token into the access variable.
  static getDriveAccess() {
    // Gets the google JWT.
    const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, Drive.scopes);
    // Gets an instance of google drive with the JWT.
    const drive = google.drive({version: 'v3', auth});
    // Sets the static Drive access variable to the google drive instance.
    Drive.access = drive;
    // Returns the google drive instance.
    return drive;
  };

  // Declares a static function to get a file by id.
  static async getFileById(id) {
    // Returns a promise.
    return new Promise((resolve, reject) => {
      // Tests that the access variable isn't null and rejects the promise if it is.
      if (Drive.access == null) return reject('Drive Access Not Granted. Call \'getDriveAccess()\' method to resolve this issue.');
      // Fetches the content and metadata of the file.
      Promise.all([
        Drive.access.files.get({
          fileId: id, alt: 'media'
        }),
        Drive.access.files.get({
          fileId: id, 
          fields: 'kind, mimeType, id, name, description, starred, trashed, webViewLink, webContentLink, parents, owners, fileExtension'
        })
      ])
      // Resolves the promise, returning an object containing the data fetched.
      .then(fileResponse => resolve({
        content: fileResponse[0].data,
        kind: fileResponse[1].data.kind,
        mimeType: fileResponse[1].data.mimeType,
        id: fileResponse[1].data.id,
        name: fileResponse[1].data.name,
        description: fileResponse[1].data.description,
        starred: fileResponse[1].data.starred,
        trashed: fileResponse[1].data.trashed,
        viewLink: fileResponse[1].data.webViewLink,
        downloadLink: fileResponse[1].data.webContentLink,
        parents: fileResponse[1].data.parents,
        owners: fileResponse[1].data.owners,
        fileExtension: fileResponse[1].data.fileExtension
      }))
      // If an error occurs, the promise is rejected with that error.
      .catch(err => reject(err));
    });
  };

  // Declares a static function to get a file by name.
  static async getFileByName(name) {
    // Returns a promise.
    return new Promise((resolve, reject) => {
      // Gets an array of all the ids of files with the name given, limited to two.
      Drive.access.files.list({
        q: 'name=\'' + name + '\'',
        fields: 'files(id)',
        pageSize: 2
      }).then(res => {
        // Tests the number of ids returned.
        if (res.data.files.length == 1) {
          // Gets the file by id and returns the data if one file id is returned.
          Drive.getFileById(res.data.files[0].id).then(data => resolve(data)).catch(err => reject(err));
        } else if (res.files.length < 1) {
          // Rejects the promise if no files are found with the name provided.
          reject('No file found with that name.');
        } else {
          // Rejects the promise if multiple files are found with the name provided.
          reject('Too many files share that name.')
        }
      }).catch(err => reject(err));
    });
  }
}