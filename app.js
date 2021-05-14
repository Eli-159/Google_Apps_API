const Drive = require('./google-drive.js');

Drive.getDriveAccess();

Drive.getFileByName('clue-data.json').then(res => {
  res.content = undefined;
  const gDrive = new Drive(res);
  console.log(gDrive);
});