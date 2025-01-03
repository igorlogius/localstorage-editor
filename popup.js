/* global browser Tabulator */

let table = null;
let tableData = null;

// button refs
const impbtn = document.getElementById("impbtn");
const savbtn = document.getElementById("savbtn");
const disbtn = document.getElementById("disbtn");
const expbtn = document.getElementById("expbtn");
const cpybtn = document.getElementById("cpybtn");
const delbtn = document.getElementById("delbtn");
const addbtn = document.getElementById("addbtn");
const log = document.getElementById("log");
const tip = document.getElementById("tip");

const tips = [
  "Holding shift and click dragging over the row selector column to invert the selection state",
  "Use Copy & Import to quickly duplicate items",
  "Filtering doenst not change the item selection",
  "Copy & Download actions only take selected items into account",
  "Imported items get autoselected",
  "Cell validation erros get shown, when hovering over a cell",
  "Use the row handle to reorder rows for copy or downloading",
  "Use shift+enter in a value cell to submit",
];

let validateAndHighlightTimer;

function delayedValidateAndHighlight(data) {
  clearTimeout(validateAndHighlightTimer);
  validateAndHighlightTimer = setTimeout(() => {
    table.validate();
    if (dataDifferentFromInital(data)) {
      highlightChange();
    } else {
      unhighlightChange();
    }
  }, 1000);
}

let logTimerId;

function showLogMessage(msg) {
  log.innerText = msg;
  clearTimeout(logTimerId);
  logTimerId = setTimeout(() => {
    log.innerText = "...";
  }, 5000);
}

function dataDifferentFromInital(newTableData) {
  //const newTableData = table.getData();

  if (tableData.length !== newTableData.length) {
    return true;
  }
  // now we need to compare alle elements
  let equalFound;
  for (const i of newTableData) {
    equalFound = false;
    for (const j of tableData) {
      if (i.store === j.store && i.key === j.key && i.value === j.value) {
        equalFound = true;
      }
    }
    if (!equalFound) {
      return true;
    }
  }
  return false;
}

function getTimeStampStr() {
  const d = new Date();
  let ts = "";
  [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
  ].forEach((t, i) => {
    ts = ts + (i !== 3 ? "-" : "_") + (t < 10 ? "0" : "") + t;
  });
  return ts.substring(1);
}

async function getTblData() {
  let data = [];
  try {
    data = await browser.tabs.executeScript({
      file: "getStorage.js",
    });
  } catch (e) {
    data = [];
  }
  return data;
}

function highlightChange() {
  savbtn.style.borderColor = "green";
  disbtn.style.borderColor = "red";
}

function unhighlightChange() {
  savbtn.style.borderColor = "";
  disbtn.style.borderColor = "";
}

// add new items
addbtn.addEventListener("click", async () => {
  table.deselectRow();
  table.addRow(
    {
      store: "",
      key: "",
      value: "",
    },
    true
  ); // add at the top
  //highlightChange();
});

// delete selected items
delbtn.addEventListener("click", () => {
  //let changed = false;
  /*
    table.getSelectedRows().forEach( (row) =>  {
	row.delete();
	//changed = true;
    });
	*/
  table.deleteRow(table.getSelectedRows());
  /*
    if(changed){
	highlightChange();
    }
    */
});

// discard changes / reload
disbtn.addEventListener("click", () => {
  window.location.reload();
});

// save/commit changes
savbtn.addEventListener("click", async () => {
  if (table.validate() !== true) {
    table.alert("Validation failed. Submit cancelled!", "error");
    setTimeout(function () {
      table.clearAlert();
    }, 2500);
    return;
  }
  const data = table.getData();
  const tabs = await browser.tabs.query({
    currentWindow: true,
    active: true,
  });
  browser.tabs.sendMessage(tabs[0].id, data);
  //unhighlightChange();
  table.alert("Syncing Storage ... ", "msg");
  setTimeout(function () {
    //table.clearAlert();
    window.location.reload(); // keep it simple
  }, 1000);
});

// export/download as file
expbtn.addEventListener("click", async () => {
  let selectedRows = table.getSelectedRows();
  // order the selected by position
  selectedRows.sort((a, b) => {
    return a.getPosition() - b.getPosition();
  });
  const expData = [];
  selectedRows.forEach((row) => {
    const rowData = row.getData();
    expData.push(rowData);
  });

  if (expData.length > 0) {
    const tabs = await browser.tabs.query({
      currentWindow: true,
      active: true,
    });
    const url = new URL(tabs[0].url);

    const content = JSON.stringify(expData, null, 4);
    let dl = document.createElement("a");
    const href =
      "data:application/json;charset=utf-8," + encodeURIComponent(content);
    dl.setAttribute("href", href);
    dl.setAttribute(
      "download",
      "Storage Export " +
        getTimeStampStr() +
        " " +
        encodeURIComponent(url.hostname).replaceAll(".", "_") +
        ".json"
    );
    dl.setAttribute("visibility", "hidden");
    dl.setAttribute("display", "none");
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
    showLogMessage("Downloaded " + expData.length + " items");
  } else {
    showLogMessage("No items to download selected");
  }
});

// copy/export to clipboard
cpybtn.addEventListener("click", () => {
  let selectedRows = table.getSelectedRows();
  // order the selected by position
  selectedRows.sort((a, b) => {
    return b.getPosition() - a.getPosition();
  });
  const expData = [];
  selectedRows.forEach((row) => {
    const rowData = row.getData();
    expData.push(rowData);
  });
  if (expData.length > 0) {
    const content = JSON.stringify(expData, null, 4);
    navigator.clipboard.writeText(content);
  }
  if (expData.length > 0) {
    showLogMessage("Copied " + expData.length + " items to clipboard");
  } else {
    showLogMessage("No items to copy selected");
  }
});

// import from clipboard
impbtn.addEventListener("click", async () => {
  table.deselectRow();
  try {
    const clipText = await navigator.clipboard.readText();
    const config = JSON.parse(clipText);
    let import_count = 0;
    config.forEach((selector) => {
      if (
        typeof selector.store === "string" &&
        typeof selector.key === "string" &&
        typeof selector.value === "string"
      ) {
        table.addRow(
          {
            store: selector.store,
            key: selector.key,
            value: selector.value,
          },
          false
        );
        import_count++;
      }
    });
    /*
		if(import_count  > 0) {
		    highlightChange();
		}
		*/
    showLogMessage("Imported " + import_count + " items");
  } catch (e) {
    showLogMessage("Import failed: \n" + e.toString());
  }
});

function storeHeaderFilter(headerValue, rowValue /*, rowData, filterParams*/) {
  return headerValue.length < 1 || headerValue.includes(rowValue);
}

var uniqueKey = function (cell, value, parameters) {
  //cell - the cell component for the edited cell
  //value - the new input value of the cell
  //parameters - the parameters passed in with the validator

  //return value % parameters.divisor; //don't allow values divisible by divisor ;

  //const val = cell.getValue();
  let tmp; // undefined

  for (let row of table.getData()) {
    if (row.key === value) {
      if (tmp === row.store) {
        return false; // find the same thing again
      } else {
        tmp = row.store; // find itself  or something else
      }
    }
  }
  return true;
};

async function onDOMContentLoaded() {
  tip.innerText = "Tip: " + tips[Math.floor(Math.random() * tips.length)];

  table = new Tabulator("#mainTable", {
    selectable: true,
    autoColumns: true,
    height: "460px",
    placeholder: "No items found",
    layout: "fitDataStretch",
    pagination: false,
    movableRows: true,
    validationMode: "highlight",
    initialSort: [
      { column: "key", dir: "asc" },
      { column: "store", dir: "asc" },
    ],
    columns: [
      {
        rowHandle: true,
        formatter: "handle",
        headerSort: false,
        frozen: true,
        width: 30,
        minWidth: 30,
      },
      {
        formatter: "rowSelection",
        titleFormatter: "rowSelection",
        titleFormatterParams: {
          rowRange: "active", //only toggle the values of the active filtered rows
        },
        hozAlign: "left",
        headerSort: false,
        cellClick: (e, cell) => {
          cell.getRow().toggleSelect();
        },
        width: 30,
        minWidth: 30,
      },
      {
        title: "Storage",
        field: "store",
        cellMouseOver: function (e, cell) {
          //e - the event object
          //cell - cell component
          const valid = cell.validate();
          if (valid !== true) {
            showLogMessage(
              "Cell Validation Errors: " + valid.map((el) => el.type).join(",")
            );
          }
        },
        hozAlign: "left",
        headerFilter: "list",
        editor: "list",
        editorParams: { values: ["Local", "Session"] },
        headerFilterPlaceholder: "Select",
        headerFilterFunc: storeHeaderFilter,
        headerFilterParams: {
          values: ["Local", "Session"],
          verticalNavigation: "hybrid",
          multiselect: true,
        },
        validator: ["in:Local|Session", "required"],
      },
      {
        title: "Key",
        field: "key",
        validator: [
          "required",
          {
            type: uniqueKey,
            parameters: { errmsg: "not unique" },
          },
        ],
        cellMouseOver: function (e, cell) {
          //e - the event object
          //cell - cell component
          const valid = cell.validate();
          if (valid !== true) {
            //console.debug(JSON.stringify(valid,null,4));
            showLogMessage(
              "Cell Validation Errors: " +
                valid
                  .map((el) => {
                    if (el.type === "function") {
                      return el.parameters.errmsg;
                    }
                    return el.type;
                  })
                  .join(",")
            );
          }
        },
        width: "25%",
        headerFilter: "input",
        headerFilterPlaceholder: "Filter",
        editor: "input",
      },
      {
        title: "Value",
        field: "value",
        headerFilter: "input",
        headerFilterPlaceholder: "Filter",
        editor: "textarea",
        editorParams: {
          verticalNavigation: "editor",
          shiftEnterSubmit: true,
        },
        formatter: "plaintext",
      },
    ],
  });

  /**
   * Register Table Events
   */

  // after adding a row highlight/select it
  table.on("rowAdded", function (row) {
    row.select();
  });

  // load data
  const data = await getTblData();
  data.forEach((e) => {
    table.addRow(e, true);
  });

  tableData = table.getData();

  // do this after the inital data load
  // hlchange any values changed
  // and call validate afterwards
  table.on("dataChanged", function (data) {
    //data - the updated table data
    delayedValidateAndHighlight(data);
    /*
	setTimeout(() => { table.validate() }, 1000);
	if(dataDifferentFromInital(data)){
		highlightChange();
	}else{
		unhighlightChange();
	}
	*/
  });
}

// init
document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
