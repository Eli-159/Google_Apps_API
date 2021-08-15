const fs = require('fs');
const google = require('googleapis').google;
const credentials = require('./credentials.json');

function findResErr(err) {
  if (err.errors && err.errors.length > 0) {
    return err.errors[0].message;
  } else {
    return err;
  }
}

function getFilePath(path, fileName) {
  if (typeof path != 'string' || path == '') path = './';
  const lastPathTerm = path.split(/\/|\\/)[path.split(/\/|\\/).length-1];
  if (lastPathTerm == '') {
    if (path.includes('\\')) {
      path = path + '\\';
    } else {
      path = path + '/';
    }
  }
  if (!lastPathTerm.includes('.')) path = path + fileName;
  return path;
}

module.exports = class Google {
  // Declares a Drive class as a sub-class of the Google class.
  static Drive = class Drive {
    // Declares a constructor function for the Drive class.
    constructor(fileData) {
      // Assigns the data passed in to the new Drive instance.
      Object.assign(this, fileData);
    };

    // Declares an array of scopes.
    static scopes = ['https://www.googleapis.com/auth/drive'];

    // Declares an array of fields.
    static fields = ['kind', 'mimeType', 'id', 'name', 'description', 'starred', 'trashed', 'webViewLink', 'webContentLink', 'parents', 'owners', 'fileExtension'];

    // Declares a static variable to hold the google drive access token.
    static access = null;

    // Declares a static function to get access to google drive and then load the token into the access variable.
    static getDriveAccess() {
      // Gets the google JWT.
      const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, Google.Drive.scopes);
      // Gets an instance of google drive with the JWT.
      const drive = google.drive({version: 'v3', auth, encoding: null});
      // Sets the static Drive access variable to the google drive instance.
      Google.Drive.access = drive;
      // Returns the google drive instance.
      return drive;
    };

    // Declares a static function to get a file by id.
    static async getFileById(id) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Tests that the access variable isn't null and rejects the promise if it is.
        if (Google.Drive.access == null) return reject('Drive Access Not Granted. Call \'getDriveAccess()\' method to resolve this issue.');
        // Fetches the content and metadata of the file.
        Promise.all([
          Google.Drive.access.files.get({
            fileId: id, alt: 'media'
          }),
          Google.Drive.access.files.get({
            fileId: id, 
            fields: Google.Drive.fields.join(', ')
          })
        ])
        // Resolves the promise, returning an object containing the data fetched.
        .then(res => resolve({
          content: res[0].data,
          ...res[1].data
        }))
        // If an error occurs, the promise is rejected with that error.
        .catch(err => reject(findResErr(err)));
      });
    };

    // Declares a static function to get a file by name.
    static async getFileByName(name) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Gets an array of all the ids of files with the name given, limited to two.
        Google.Drive.access.files.list({
          q: 'name=\'' + name + '\'',
          fields: 'files(id)',
          pageSize: 2
        }).then(res => {
          // Tests the number of ids returned.
          if (res.data.files.length == 1) {
            // Gets the file by id and returns the data if one file id is returned.
            Google.Drive.getFileById(res.data.files[0].id).then(data => resolve(data)).catch(err => reject(findResErr(err)));
          } else if (res.data.files.length < 1) {
            // Rejects the promise if no files are found with the name provided.
            reject('No file found with that name.');
          } else {
            // Rejects the promise if multiple files are found with the name provided.
            reject('Too many files share that name.')
          }
        }).catch(err => reject(findResErr(err)));
      });
    };

    // Declares a static function to get a file by id.
    static async downloadFileById(id, path) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Tests that the access variable isn't null and rejects the promise if it is.
        if (Google.Drive.access == null) return reject('Drive Access Not Granted. Call \'getDriveAccess()\' method to resolve this issue.');
        // Fetches the metadata of the file.
        Google.Drive.access.files.get({
          fileId: id, 
          fields: Google.Drive.fields.join(', ')
        }).then(metadata => {
          Google.Drive.access.files.get({fileId: id, alt: 'media'}, {responseType: 'stream'}).then(res => {
            const filePath = getFilePath(path, metadata.data.name);
            const dest = fs.createWriteStream(filePath);
            res.data.on('end', () => {
              resolve(metadata.data);
            }).on('error', err => {
              reject(err);
            }).pipe(dest);
          });
        }).catch(err => reject(findResErr(err)));
      });
    };

    // Declares a static function that tests if a file with the id provided exists.
    static async testFileExist(id) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Tests that the id provided is of type string.
        if (typeof id == 'string') {
          // Runs a request for the file, returning only the id, and resolving the promise returned with a value of true if successful.
          Google.Drive.access.files.get({
            fileId: id,
            fields: 'id'
          }).then((res) => resolve(true)).catch(err => {
            // Tests if the error was that the file was not found.
            if (err.errors && err.errors.length > 0 && err.errors[0].reason == 'notFound') {
              // Resolves the promise returned with a value of false.
              resolve(false);
            } else {
              // Rejects the promise returned.
              reject(findResErr(err));
            }
          });
        } else {
          // Resolves the promise returned with a value of false.
          resolve(false);
        }
      });
    }

    // Declares a static function to create (upload a new) file on Google Drive.
    static async createFile(data) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Runs a create request (multipart) with the data provided.
        Google.Drive.access.files.create({
          uploadType: 'multipart',
          resource: {
            mimeType: data.mimeType,
            name: data.name,
            description: data.description,
            starred: data.starred,
            parents: [data.parent]
          },
          media: {
            mimeType: data.mimeType,
            body: data.content
          },
          supportsAllDrives: true,
          fields: Google.Drive.fields.join(', ')
        }).then((res) => {
          // Resolves the promise, returning the metadata from the response.
          resolve(res.data);
        }).catch(err => reject(findResErr(err)));
      });
    };

    static async updateFile(data) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Runs a create request (multipart) with the data provided.
        Google.Drive.access.files.update({
          uploadType: 'multipart',
          fileId: data.id,
          resource: {
            mimeType: data.mimeType,
            name: data.name,
            description: data.description,
            starred: data.starred
          },
          media: {
            mimeType: data.mimeType,
            body: data.content
          },
          fields: Google.Drive.fields.join(', ')
        }).then((res) => {
          if (res.data.parents[0] != data.parent) {
            console.log(res.data.parents)
            console.log(data.parent);
            Google.Drive.access.files.update({
              uploadType: 'multipart',
              fileId: data.id,
              addParents: [data.parent],
              removeParents: res.data.parents,
              fields: Google.Drive.fields.join(', ')
            }).then(res => {
              // Resolves the promise, returning the metadata from the response.
              resolve(res.data).catch(err => reject(findResErr(err)));;
            }).catch(err => reject(findResErr(err)));
          } else {
            // Resolves the promise, returning the metadata from the response.
            resolve(res.data);
          }
        }).catch(err => reject(findResErr(err)));
      });
    }

    static async saveFileLocal(path, fileContent, fileName) {
      const filePath = getFilePath(path, fileName);
      return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }

    // Declares a static function to delete a file from Google Drive.
    static async deleteFile(id) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Calls the delete function, resolving the promise with the response data if successful or rejecting the error if one occurs.
        Google.Drive.access.files.delete({
          fileId: id
        }).then(res => resolve(res.data)).catch(err => reject(findResErr(err)));
      });
    }

    // Declares a function to load the data from Google Drive based on an id or name currently in saved in the instance of this class.
    async load() {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Declares a varaible to hold the fetch promise.
        let promise;
        // Tests if the current instance of this class has a string id or name, and fetches the file appropriatly.
        if (typeof this.id == 'string') {
          promise = Google.Drive.getFileById(this.id);
        } else if (typeof this.name == 'string') {
          promise = Google.Drive.getFileByName(this.name);
        } else {
          // Rejects the promise if neither an id or name is found.
          reject('The current instance of this class must have either an id or name in string format for this function to be called.');
        }
        // Waits for the selected promise to resolve.
        promise.then(data => {
          // Assigns the data to the current instance of this class and resolves the promise, with the data.
          Object.assign(this, data);
          resolve(data);
        }).catch(err => reject(findResErr(err)));
      });
    }

    // Declares a funciton to create a file on Google Drive with the class's values.
    async create() {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Runs the createFile function.
        Google.Drive.createFile(this).then((res) => {
          // Assigns the response data to the current instance of the class and then resolves the returned promise with the response data.
          Object.assign(this, res);
          resolve(res);
        }).catch(err => reject(findResErr(err)));
      });
    };

    // Declares a funcion to update a file on Google Drive to the class's values.
    async update() {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Runs the updateFile funciton.
        Google.Drive.updateFile(this).then(res => {
          // Assigns the response data to the current instance of the class and then resolves the returned promise with the response data.
          Object.assign(this, res);
          resolve(res);
        }).catch(err => reject(findResErr(err)));
      });
    }

    // Detects whether a file has a valad id, creating a new one if id doesn't and updating the existing one if it does.
    async upload() {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Tests if the file exists on Google Drive.
        Google.Drive.testFileExist(this.id).then(fileExist => {
          // Defines a variable to hold the upload promise.
          let uploadPromise;
          if (fileExist) {
            // Sets uploadPromise to the updateFile function.
            uploadPromise = Google.Drive.updateFile(this);
          } else {
            // Sets uploadPromise to the createFile function.
            uploadPromise = Google.Drive.createFile(this);
          }
          uploadPromise.then(res => {
            // Assigns the response data to the current instance of the class and then resolves the returned promise with the response data.
            Object.assign(this, res);
            resolve(res);
          }).catch(err => reject(findResErr(err)));
        }).catch(err => reject(findResErr(err)));
      });
    }

    // Declares a function to save the file metadata locally.
    async saveMetadataLocal(path) {
      // Declares a constant version of the current instance of this class and removes the content property.
      const metadata = {...this};
      delete metadata.content;
      // Reformats the name to default to.
      const name = this.name.split('.' + this.fileExtension)[0] + '_metadata.' + this.fileExtension;
      // Returns the saveFileLocal function with standard inputs.
      return Google.Drive.saveFileLocal(path, JSON.stringify(metadata), name);
    }

    // Declares a function to save the file content locally.
    async saveContentLocal(path) {
      // Declares a variable with the current data, stringifying it if it is a json.
      console.log(this);
      const content = (this.mimeType=='application/json'||this.fileExtension=='json' ? JSON.stringify(this.content) : this.content);
      // Reformats the name to default to.
      const name = this.name.split('.' + this.fileExtension)[0] + '_content.' + this.fileExtension;
      // Returns the saveFileLocal function with standard inputs.
      return Google.Drive.saveFileLocal(path, content, name);
    }

    // Declares a function to save the file metadata locally.
    async saveLocal(path) {
      // Returns the saveFileLocal function with standard inputs.
      return Google.Drive.saveFileLocal(path, JSON.stringify(this), this.name);
    }

    async download(path) {
      return Google.Drive.downloadFileById(this.id, path);
    }
    
    // Declares a function to delete the file on the server.
    async delete() {
      // Returns the deleteFile function response.
      return Google.Drive.deleteFile(this.id);
    }
  }

  // Declares a Sheets class as a sub-class of the Google class.
  static Sheets = class Sheets {

    // Declares an array of scopes.
    static scopes = ['https://www.googleapis.com/auth/spreadsheets'];

    // Declares a static variable to hold the google sheets access token.
    static access = null;

    // Declares a static function to get access to google sheets and then load the token into the access variable.
    static getSheetsAccess() {
      // Gets the google JWT.
      const auth = new google.auth.JWT(credentials.client_email, null, credentials.private_key, Google.Sheets.scopes);
      // Gets an instance of google sheets with the JWT.
      const sheets = google.sheets({version: 'v4', auth, encoding: null});
      // Sets the static Sheets access variable to the google drive instance.
      Google.Sheets.access = sheets;
      // Returns the google sheets instance.
      return sheets;
    };

    // Gets the basic spreadsheet infomation. Requires the spreadsheet id and an optional object of options.
    // The options for this function are ranges (array of strings), and includeGridData (boolean).
    static getSpreadsheet(id, options) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Gets the spreadsheet data.
        Google.Sheets.access.spreadsheets.get({spreadsheetId: id, ...options})
        .then(res => resolve(res.data))
        .catch(err => reject(findResErr(err)));
      });
    };

    // Gets data from the sheet.
    // The options for this function are majorDimension (string), valueRenderOption (string), and dateTimeRenderOption (string).
    static getSheetData(id, range, options) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Gets data from the spreadsheet.
        Google.Sheets.access.spreadsheets.values.get({spreadsheetId: id, range, ...options})
        .then(res => resolve(res.data))
        .catch(err => reject(findResErr(err)));
      });
    };

    // Clears a sheet range.
    static clearSheetData(id, range) {
      // Returns a promise.
      return new Promise((resolve, reject) => {
        // Clears data from the spreadsheet.
        Google.Sheets.access.spreadsheets.values.clear({spreadsheetId: id, range})
        .then(res => resolve(res.data))
        .catch(err => reject(findResErr(err)));
      });
    };
  }
}