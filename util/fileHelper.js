const fs = require("fs");

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.log(err);
  });
}

exports.deleteFile = deleteFile;
