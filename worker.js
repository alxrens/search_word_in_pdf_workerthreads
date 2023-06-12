const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const PDFParser = require('pdf-parse');

async function searchInPDF(pdfPath, searchString) {
  return new Promise((resolve, reject) => {
    fs.readFile(pdfPath, async (error, buffer) => {
      if (error) {
        console.error(`Error reading PDF ${pdfPath}:`, error);
        resolve([]);
      } else {
        try {
          const data = await PDFParser(buffer);
          const text = data.text;
          const regex = new RegExp(searchString, 'gi');
          const matches = regex.test(text);

          if (matches) {
            resolve([pdfPath]);
          } else {
            resolve([]);
          }
        } catch (error) {
          console.error(`Error processing PDF ${pdfPath}:`, error);
          resolve([]);
        }
      }
    });
  });
}

async function searchInPDFs(pdfPaths, searchString) {
  const searchPromises = pdfPaths.map(pdfPath => searchInPDF(pdfPath, searchString));
  const searchResults = await Promise.all(searchPromises);
  const matchedPaths = searchResults.reduce((matches, result) => matches.concat(result), []);
  parentPort.postMessage(matchedPaths);
}

searchInPDFs(workerData.pdfPaths, workerData.searchString);
