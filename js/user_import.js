window.addEventListener("DOMContentLoaded", (event) => {
    // --------------------------------------------------------------
// Define drop zone
// https://web.dev/read-files/#define-drop-zone 

const dropArea = document.getElementById('drop-area');

dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  // Style the drag-and-drop as a "copy file" operation
  event.dataTransfer.dropEffect = 'copy';
});

dropArea.addEventListener('drop', (event) => {
  event.stopPropagation();
  event.preventDefault();
  const fileList = event.dataTransfer.files;
  getMetadataForFileList(fileList);
  readCsvFile(fileList[0]);
});

// --------------------------------------------------------------
// Read file metadata
// https://web.dev/read-files/#read-metadata

function getMetadataForFileList(fileList) {
  let html = "";
  for (const file of fileList) {
    // Not supported in Safari for iOS.
    const name = file.name ? file.name : 'NOT SUPPORTED';
    // Not supported in Firefox for Android or Opera for Android.
    const type = file.type ? file.type : 'NOT SUPPORTED';
    // Unknown cross-browser support.
    const size = file.size ? file.size : 'NOT SUPPORTED';
    //console.log({ file, name, type, size });
    html += `<span>${name}</span><span>${type}</span><span>${size}</span>`;
  }
  document.querySelector("#metadata").innerHTML = html;
}

// --------------------------------------------------------------
// Read file metadata
// https://web.dev/read-files/#read-content

function readCsvFile(file) {
  // Check if the file is an image.
  if (file.type && !file.type.startsWith('text/csv')) {
    console.log('File is not a comma separated (CSV) file.', file.type, file);
    return;
  }

  const reader = new FileReader();
  reader.addEventListener('load', (event) => {
    parseDataIntoTable(event.target.result);
  });
  reader.readAsText(file);
}

// --------------------------------------------------------------
// Parse data into an HTML table
// https://stackoverflow.com/a/14991797/5535143

function parseDataIntoTable(data) {
  // Display the parsed data in the console for
  // debugging purposes only.
  const parsedData = parseCSV(data);
  console.log(parsedData);

  // https://www.aspsnippets.com/Articles/Import-CSV-File-to-HTML-Table-using-JavaScript.aspx
  const table = document.createElement("table");
  const rows = data.split("\n");
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].split(",");
    if (cells.length > 1) {
      const row = table.insertRow(-1);
      for (let j = 0; j < cells.length; j++) {
        const cell = row.insertCell(-1);
        cell.innerHTML = cells[j];
      }
    }
  }

  document.querySelector("#data-table-content").appendChild(table);
}

function parseCSV(str) {
  const arr = [];
  let quote = false; // 'true' means we're inside a quoted field

  // Iterate over each character, keep track of current row and column (of the returned array)
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    let cc = str[c],
      nc = str[c + 1]; // Current character, next character
    arr[row] = arr[row] || []; // Create a new row if necessary
    arr[row][col] = arr[row][col] || ''; // Create a new column (start with empty string) if necessary

    // If the current character is a quotation mark, and we're inside a
    // quoted field, and the next character is also a quotation mark,
    // add a quotation mark to the current column and skip the next character
    if (cc == '"' && quote && nc == '"') {
      arr[row][col] += cc;
      ++c;
      continue;
    }

    // If it's just one quotation mark, begin/end quoted field
    if (cc == '"') {
      quote = !quote;
      continue;
    }

    // If it's a comma and we're not in a quoted field, move on to the next column
    if (cc == ',' && !quote) {
      ++col;
      continue;
    }

    // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
    // and move on to the next row and move to column 0 of that new row
    if (cc == '\r' && nc == '\n' && !quote) {
      ++row;
      col = 0;
      ++c;
      continue;
    }

    // If it's a newline (LF or CR) and we're not in a quoted field,
    // move on to the next row and move to column 0 of that new row
    if (cc == '\n' && !quote) {
      ++row;
      col = 0;
      continue;
    }
    if (cc == '\r' && !quote) {
      ++row;
      col = 0;
      continue;
    }

    // Otherwise, append the current character to the current column
    arr[row][col] += cc;
  }
  return arr;
}

// --------------------------------------------------------------
// Add data to table
// 

document.querySelector("#add-to-table").addEventListener("click", addRowToTable);

function addRowToTable() {
  const tableElem = document.querySelector("#data-table-content table");

  const tableBodyElem = tableElem.querySelector("tbody");
  const trLastElem = tableBodyElem.querySelector("tr:last-of-type");
  const trNewElem = trLastElem.cloneNode(true);

  trNewElem.querySelectorAll('td').forEach(el => {
    el.innerHTML = "";
  });

  trNewElem.querySelector("td:nth-of-type(1)").innerHTML =
    document.querySelector("#col-1").value;

  trNewElem.querySelector("td:nth-of-type(2)").innerHTML =
    document.querySelector("#col-2").value;

  trNewElem.querySelector("td:nth-of-type(3)").innerHTML =
    document.querySelector("#col-3").value;

  tableBodyElem.appendChild(trNewElem);

  // 'scrollIntoView()' over scrolls even with
  // 'overscroll-behavior: none;' set on the
  // '#data-table-content' element.
  // trNewElem.scrollIntoView();
  // Therefore, the method selected as the answer:
  // https://stackoverflow.com/questions/270612/scroll-to-bottom-of-div
  document.querySelector("#data-table-content").scrollTop =
    document.querySelector("#data-table-content").scrollHeight;
}

// --------------------------------------------------------------
// Download CSV data
// https://stackoverflow.com/questions/15547198/export-html-table-to-csv-using-vanilla-javascript
// https://stackoverflow.com/a/56370447

document.querySelector("#save-as-csv").addEventListener("click", saveAsCSV);

function saveAsCSV() {
  const tableElem = document.querySelector("#data-table-content table");
  const csv_string = convertTableDataToCsv(tableElem);
  downloadCsv(csv_string, "table");
}

function convertTableDataToCsv(tableElem, separator = ',') {
  // Select rows from table element
  const rows = tableElem.querySelectorAll('tr');
  // Construct csv array
  const csv = [];
  for (let i = 0; i < rows.length; i++) {
    const row = [];
    const cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      // Clean innertext to remove multiple spaces and jumpline (break csv)
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
      // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
      data = data.replace(/"/g, '""');
      // Push escaped string
      row.push('"' + data + '"');
    }
    csv.push(row.join(separator));
  }
  return csv.join('\n');
}

function downloadCsv(csv_string, table_id) {
  const filename = 'export_' + table_id + '_' + new Date().toLocaleDateString() + '.csv';
  const link = document.createElement('a');
  link.style.display = 'none';
  link.setAttribute('target', '_blank');
  link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
});