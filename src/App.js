import { React } from "react";
import { Archive } from "libarchive.js";
import "bootstrap/dist/css/bootstrap.min.css";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropzone from "react-dropzone";

Archive.init({
  workerUrl: "libarchive.js/dist/worker-bundle.js",
});

const read = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => resolve(event.target.result);
  reader.onerror = reject;
  reader.readAsText(blob);
});

function download(file, fileName) {
  let url = URL.createObjectURL(file);
  let a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function App() {

  async function handleChange(e) {
    const inputFile = e[0];
    const outputName = inputFile.name.replace(".epub", "_fixed.epub");
    const archive = await Archive.open(inputFile);

    let outFiles = [];

    const filesArray = await archive.getFilesArray();
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      let extracted = await file.file.extract();

      if (file.file._path.endsWith(".css")) {
        let content = await read(extracted);
        let fixed = content.replace(/font-family: .+?;/g, "");
        extracted = new Blob([fixed]);
      }

      outFiles.push({file: extracted, pathname: file.file._path});
    }

    const archiveFileName = "archive.zip";

    const zip = new window.Module.Zip(archiveFileName);

    for (const entry of outFiles) {
      const buffer = await entry.file.arrayBuffer();
      const a = new Uint8Array(buffer);
      zip.addEntry(entry.pathname, a);
    }

    const zipFile = zip.finish();
    const blob = new Blob([zipFile], {type: "octet/stream"});
    download(blob, outputName);

  }

  return (
    <div className="App">
      <Container>
        <Row>
          <Col>
            <h1>Fix my EPUB</h1>
            <p>If you are not able to change the font of your ebook on Kobo, it's likely that the publisher has locked down the font family. Fix your EPUB and enable changing fonts.</p>
          </Col>
        </Row>
        <Row>
          <Col>
            <Dropzone onDrop={handleChange}>
              {({getRootProps, getInputProps}) => (
                <section>
                  <div className="drop" {...getRootProps()}>
                    <input {...getInputProps()} />
                    Drop your EPUB here or click to select a file
                  </div>
                </section>
              )}
            </Dropzone>
          </Col>
        </Row>
        <Row className="mt-4">
          <Col>
            <p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" className="mb-1"><path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"></path></svg> <a rel="noreferrer" className="text-black" href="https://twitter.com/PieterPrvst" target="_blank">PieterPrvst</a></p>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default App;