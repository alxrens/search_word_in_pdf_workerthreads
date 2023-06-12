const { Worker } = require('worker_threads');
const fs = require('fs');
const path = require('path');

const threadCount = 5; //Set how many thread you'll use

function createWorker(pdfPaths, searchString) { 
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker2.js', {
      workerData: { pdfPaths, searchString },
    });

    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

function fromDir(startPath, filter) { // (start path, .pdf) mainly build for pdf
  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return [];
  }

  const files = fs.readdirSync(startPath);
  const pdfFiles = [];

  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fs.lstatSync(filename);

    if (stat.isDirectory()) { //recursive
      pdfFiles.push(...fromDir(filename, filter));
    } else if (filename.endsWith(filter)) {
      pdfFiles.push(filename);
    }
  }

  return pdfFiles;
}

async function main() {
  const pdfPaths = fromDir('your_pdf_dir_goes_here', '.pdf');
  const searchString = 'your_searched_text_goes_here'; 

  const workerPromises = [];

  for (let i = 0; i < threadCount; i++) {
    const workerPromise = createWorker( //inisiasi worker thread function.
      pdfPaths.slice(i * pdfPaths.length / threadCount, (i + 1) * pdfPaths.length / threadCount),
      searchString
    );
    workerPromises.push(workerPromise);
  }


//code bellow is for express(recommended)
//   const searchResults = await Promise.all(workerPromises);
//   const totalMatches = searchResults.reduce((sum, result) => sum + result, 0);
//   res.status(200).send(totalMatches);


//code bellow is for testing only
const threadResults = await Promise.all(workerPromises);
const matchedPaths = threadResults.reduce((matches, result) => matches.concat(result), []);

console.log('Matching PDF files:');
matchedPaths.forEach(path => console.log(path));
}

main();
