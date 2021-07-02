const Drive = require('./google-drive.js');
const fs = require('fs');

Drive.getDriveAccess();

// 1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr

// Drive.downloadFileById('1wexSa0TVmko5L79kr5jR5p3zYGLlTW1F').catch(err => console.log(err));

const gDrive = new Drive({id: '15qv42wmVoRx6F2Lbr3bhWnDWbmdSsEA8'});
gDrive.load().then(() => {
  // console.log(gDrive);
  // gDrive.saveLocal('./data.json').catch(err => console.log(err));
  // gDrive.saveMetadataLocal('./').catch(err => console.log(err));
  // gDrive.saveContentLocal('').catch(err => console.log(err));
  // gDrive.upload().then(file => console.log(file)).catch(err => console.log(err));
  gDrive.download();
}).catch(err => console.log(err));

// Drive.testFileExist('1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr').then(res => console.log(res)).catch(err => console.log(err));

// Drive.deleteFile('1cvWuUBljXXQDghbt3FeinP2hicVUatmM').then(() => console.log('Success!')).catch((err) => console.log(err));