window.addEventListener("DOMContentLoaded", (event) => {

  /** Dictionary for the different tags, brands and id endings
   * Format: Organization : [Tags, Brands, after]
  */
  const organizations = {
    "Solve Houston": ["houston_tx",	"Solve Pest Pros", "~HTX"],
    "Insight Emerald Coast": ["pensacola_fl",	"Insight Pest Solutions", "~IEC"],
    "Insight San Antonio": ["san_antonio_tx",	"Insight Pest Solutions", "~ISA"],
    "Blue Cactus Pest Control": ["mesa_az",	"Blue Cactus Pest Control", "~BC"],
    "Solve Pest Pros": ["jacksonville_fl",	"Solve Pest Pros", "~SFL"],
    "Solve Raleigh": ["raleigh_nc",	"Solve Pest Pros", "~SR"],
    "Bug Shark": ["bug_shark_oh",	"Bug Shark", "~BS"],
    "Insight Sioux Falls": ["sioux_falls_sd",	"Insight Pest Solutions", "~ISF"],
    "Protek Pest and Lawn": ["lehi_ut",	"Protek Pest and Lawn", "~PP"],
    "Synergy Pest Control": ["palm_bay_fl",	"Synergy Pest Control", "~SPC"],
    "Insight Maine": ["portland_mn",	"Insight Pest Solutions", "~IM"],
    "Insight South Bend": ["south_bend_IN",	"Insight Pest Solutions", "~ISB"],
    "Seaport Pest Solutions": ["hartford_ct",	"Seaport Pest Solutions", "~SPS"]
  }
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
    formatNewTable(event.target.result);
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

/** Formats 'data' into the correct column order for Zendesk to import*/
function formatNewTable(data) {
  const colOrder = [["First Name", 0], ["Last Name", 0], ["Email Address", 0], ["Customer ID", 0], ["Address", 0], ["Phone 1", 0], ["Office Name", 0]]
  const endOrder = ["name", "email", "external", "details", "phone", "role", "organization", "tags", "brand"]
  const orgIndex = 6;
  var table;
  var firstTable = true;
  var baseRowCount = 0;
  if(document.querySelector("#new-table-content") == null) {
    table = document.createElement("table");
  } else {
    table = document.getElementById("new-table-content")
    firstTable = false;
    baseRowCount = table.rows.length
  }
  table.id = "new-table-content"
  const rows = data.split("\n");
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].split(",");
    const row = table.insertRow(-1);
    console.log(cells)
    if(i==0) { //Titles row
      colOrder.forEach((element) => element[1] = cells.indexOf(element[0]))
      if(firstTable) {
        for(let j = 0; j < endOrder.length; j++) {
          row.insertCell(-1).innerHTML = endOrder[j];
        }
      }
    } else {
      row.insertCell(-1).innerHTML = cells[colOrder[0][1]].replaceAll("\"", "") + " " + cells[colOrder[1][1]].replaceAll("\"", "") // First and Last Name
      rowLoop: for(let j = 2; j < colOrder.length; j++) {
        switch(colOrder[j][0]) {
          case "Customer ID":
            let org = cells[colOrder[orgIndex][1]].replaceAll("\"", "");
            console.log(table.rows.length)
            let newID = cells[colOrder[j][1]].replaceAll("\"", "") + organizations[org][2];
            for(let k = 0; k < table.rows.length-1; k++) { //see if id is a duplicate
              if(newID == table.rows[k].children[2].innerHTML) {
                table.deleteRow(-1);
                break rowLoop;
              }
            }
            let curCell = row.insertCell(-1);
            curCell.innerHTML = newID
            curCell.id = "Customer-id";
            break;
          case "Office Name":
            row.insertCell(-1).innerHTML = "End-user";
            row.insertCell(-1).innerHTML = cells[colOrder[j][1]].replaceAll("\"", "")
            row.insertCell(-1).innerHTML = organizations[cells[colOrder[j][1]].replaceAll("\"", "")][0]
            break;
          case "Phone 1":
            let phone = "+1" + cells[colOrder[j][1]].replaceAll("\"", "");
            console.log("working")
            if(cells[colOrder[j][1]].replaceAll("\"", "") == "") { //check if phone # exists
              if(cells[colOrder[2][1]].replaceAll("\"", "") == "") { //check if email exists and break out of rowLoop if it doesn't
                table.deleteRow(-1);
                console.log("Working" + cells[colOrder[0][0]])
                break rowLoop;
              }
              phone = ""
            }
            row.insertCell(-1).innerHTML = phone
            break;
          default:
            row.insertCell(-1).innerHTML = cells[colOrder[j][1]].replaceAll("\"", "")
            break;
        }


        if(j==colOrder.length-1) {
          row.insertCell(-1).innerHTML = organizations[cells[colOrder[j][1]].replaceAll("\"", "")][1]
        }
      }
    }
    // if (cells.length > 1) {
    //   const row = table.insertRow(-1);
    //   for (let j = 0; j < cells.length; j++) {
    //     const cell = row.insertCell(-1);
    //     cell.innerHTML = cells[j];
    //   }
    // }
  }

  document.querySelector("#new-data-table-content").appendChild(table);
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
// Remove duplicates and blanks
// 

document.querySelector("#remove-doubles").addEventListener("click", removeDoubles);

function removeDoubles() {
  const idSlot = 1
  const tableElem = document.querySelector("#data-table-content table");
  let rows = tableElem.querySelectorAll('tr');
  let rowLength = rows.length
  //rows.forEach((element) => console.log(element.innerText))
  for(let i = 0; i < rows.length-1; i++) {
    let cols = rows[i].querySelectorAll('td, th');
    const idCheck = cols[idSlot].innerText;
    //console.log(idCheck)
    for(let j = i+1; j < rows.length; j++) {
      const curCols = rows[j].querySelectorAll('td, th');
      const curCheck = curCols[idSlot].innerText
      if(curCheck == idCheck) {
        tableElem.deleteRow(j)
        console.log(i + ", " + j)
        console.log(curCheck + " = " + idCheck + ", removing number " + curCols[0].innerText + ".");
        rows = tableElem.querySelectorAll('tr');
      }
    }
  }
}

// --------------------------------------------------------------
// Download CSV data
// https://stackoverflow.com/questions/15547198/export-html-table-to-csv-using-vanilla-javascript
// https://stackoverflow.com/a/56370447

document.querySelector("#save-as-csv").addEventListener("click", saveAsCSV);

function saveAsCSV() {
  const tableElem = document.getElementById("new-table-content");
  const rows = tableElem.querySelectorAll('tr');
  var numSets = Math.ceil((rows-1) / 999);
  var csv_strings = [];
  for(var i = 0; i < numSets; i++) {
    csv_strings.appendChild(convertTableDataToCsv(tableElem, i))
  }
  // csv_string = convertTableDataToCsv(tableElem);
  downloadCsv(csv_strings, "table");
}

function convertTableDataToCsv(tableElem, setNum, separator = ',') {
  // Select rows from table element
  const rows = tableElem.querySelectorAll('tr');
  // Construct csv array
  const csv = [];

  const row = [];
  const cols = rows[0].querySelectorAll('td, th');
  for (let j = 0; j < cols.length; j++) {
    // Clean innertext to remove multiple spaces and jumpline (break csv)
    let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/(\s\s)/gm, ' ')
    // Escape double-quote with double-double-quote (see https://stackoverflow.com/questions/17808511/properly-escape-a-double-quote-in-csv)
    data = data.replace(/"/g, '""');
    // Push escaped string
    row.push('"' + data + '"');
  }
  csv.push(row.join(separator));

  var setLenth = (rows.length < (setNum+1)*999)? rows.length: (setNum+1)*999;
  for (let i = setNum*999 + 1; i < setLenth; i++) {
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

function downloadCsv(csv_strings, table_id) {
  csv_strings.forEach((csv_string, i) => {
    const filename = 'export' + i + '_' + table_id + '_' + new Date().toLocaleDateString() + '.csv';
    const link = document.createElement('a');
    link.style.display = 'none';
    link.setAttribute('target', '_blank');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv_string));
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
});