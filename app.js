const Drive = require('./google-drive.js');
const fs = require('fs');

Drive.getDriveAccess();

// 1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr

const gDrive = new Drive({id: '1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr'});
gDrive.load().then(() => {
  console.log(gDrive);
  gDrive.upload().then(file => console.log(file)).catch(err => console.log(err));
}).catch(err => console.log(err));

// Drive.testFileExist('1bM90RO5Y2-6A-ViOWLI_7Xw_4RVgGWdr').then(res => console.log(res)).catch(err => console.log(err));

// Drive.deleteFile('1cvWuUBljXXQDghbt3FeinP2hicVUatmM').then(() => console.log('Success!')).catch((err) => console.log(err));