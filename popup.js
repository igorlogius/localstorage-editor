/* global browser Tabulator */

let table = null;

// button refs
const impbtnWrp = document.getElementById('impbtn_wrapper');
//const impbtn = document.getElementById('impbtn');
const savbtn= document.getElementById('savbtn');
const discbtn= document.getElementById('discbtn');
const expbtn = document.getElementById('expbtn');
const cpybtn = document.getElementById('cpybtn');
const delbtn = document.getElementById('delbtn');
const addbtn = document.getElementById('addbtn');
const log = document.getElementById('log');

function highlightChange(){
    savbtn.style.borderColor='green';
    discbtn.style.borderColor='red';
}

function unhighlightChange(){
    savbtn.style.borderColor='';
    discbtn.style.borderColor='';
}

addbtn.addEventListener('click', async () => {
    table.deselectRow();
    table.addRow({
        store: '',
        key: '',
        value: '',
    },true); // add at the top
    highlightChange();
});


delbtn.addEventListener('click', () =>  {
    let changed = false;
    table.getSelectedRows().forEach( (row) =>  {
        row.delete();
        changed = true;
    });
    if(changed){
        highlightChange();
    }
});

discbtn.addEventListener('click', ()=> {
    window.location.reload();
});

//
savbtn.addEventListener('click', async ()=> {
    const data = table.getData();
    const tabs = await browser.tabs
    .query({
      currentWindow: true,
      active: true
    });
    browser.tabs.sendMessage(tabs[0].id, data);
    //unhighlightChange();
    window.location.reload();
});

expbtn.addEventListener('click', () => {

    let selectedRows = table.getSelectedRows();

    // order the selected by position

    selectedRows.sort( (a,b) => {
        return b.getPosition() - a.getPosition();
    });


    //let idx_count = 0;

    // fixup the export data
    const expData = [];
    selectedRows.forEach( (row) => {
        const rowData = row.getData();
        //rowData.idx = idx_count;
        expData.push(rowData);
    });
    const content = JSON.stringify(expData,null,4);
    //console.log(content);
    let dl = document.createElement('a');
    const href = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
    dl.setAttribute('href', href);
    dl.setAttribute('download', 'export.json');
    dl.setAttribute('visibility', 'hidden');
    dl.setAttribute('display', 'none');
    document.body.appendChild(dl);
    dl.click();
    document.body.removeChild(dl);
});

cpybtn.addEventListener('click', () => {

    let selectedRows = table.getSelectedRows();

    // order the selected by position

    selectedRows.sort( (a,b) => {
        return b.getPosition() - a.getPosition();
    });

    //let idx_count = 0;

    // fixup the export data
    const expData = [];
    selectedRows.forEach( (row) => {
        const rowData = row.getData();
        //rowData.idx = idx_count;
        expData.push(rowData);
    });

    const content = JSON.stringify(expData,null,4);
    navigator.clipboard.writeText(content);
});

// delegate to real import Button which is a file selector
impbtnWrp.addEventListener('click', async () => {
        table.deselectRow();
	try {
	let clipText = await navigator.clipboard.readText();
	/**/
	var config = JSON.parse(clipText);
	let imported_something = false;
	config.forEach( (selector) => {
	    table.addRow({
		store: selector.store,
		key: selector.key,
		value: selector.value,
	    }, false);
	    imported_something = true;
	});
	if(imported_something) {
	    highlightChange();
	}
	}catch(e){
   		log.innerText = 'Import failed: \n' + e.toString();
	}
	/**/
});

// read data from file into current table
/*
impbtn.addEventListener('input', function () {
	var file  = this.files[0];
	var reader = new FileReader();
            reader.onload = async function() {
            try {
                var config = JSON.parse(reader.result);
                let imported_something = false;
                config.forEach( (selector) => {
                    table.addRow({
                        store: selector.store,
                        key: selector.key,
                        value: selector.value,
                    }, false);
                    imported_something = true;
                });
                if(imported_something) {
                    highlightChange();
                }
            } catch (e) {
                console.error(e);
            }
        };
        reader.readAsText(file);
});
*/

/*
function tagValuesLookup (){
    const rows = table.getRows();
    const tags = [];
    for(const row of rows){
        const cell = row.getCell('tags');
        const vals = cell.getValue().split(/[\s,]+/);
        for(const val of vals){
            if(val !== '' && !tags.includes(val)){
                tags.push(val);
            }
        }
    }
    return tags;
}
*/

async function onDOMContentLoaded() {

    table = new Tabulator("#mainTable", {
        height: "480px",
	placeholder:"No Items Found",
        //virtualDom:false, //disable virtual DOM rendering
        layout:"fitDataStretch", //fit columns to width of table
        //responsiveLayout: "hide",//hide columns that dont fit on the table
        pagination: false,       //paginate the data
        //movableRows: false,
        /*
        groupBy: ["group"],
        groupUpdateOnCellEdit:true,
        groupStartOpen: false,
        initialSort: [
            {column: "key", dir: "asc"},
        ],
        */
        columns:[
            {formatter:"rowSelection", titleFormatter:"rowSelection", hozAlign:"left", headerSort:false, cellClick:function(e, cell){
                cell.getRow().toggleSelect();
            }},
            {title:'Store',field:"store",
                headerFilter: 'list',
                editor:"list", editorParams: { values: ["L", "S"] }
                ,headerFilterParams:{
                    values: ['S','L'], // get values
                    verticalNavigation:"hybrid", //navigate to new row when at the top or bottom of the selection list
                    multiselect: false, //allow multiple entries to be selected
                },headerFilterPlaceholder:"S+L"
            },
            {title:'Key',field:"key", width: "25%", headerFilter:"input", headerFilterPlaceholder:"Text filter",editor:"input" },
            {title:"Value", field:"value" , width: "45%", headerFilter:"input", headerFilterPlaceholder:"Text filter",editor:"textarea",
                editorParams: { verticalNavigation: "editor", } ,
                formatter: "plaintext"
            },
        ]
    });

    // Load data

    /**
     * Register Table Events
     */
    // hlchange if values change
    table.on("cellEdited", function(cell){
        if(cell.getValue() !== cell.getOldValue()){
            highlightChange();
	    status.innerText = 'Cell edited';
        }
    });

    // todo: determine if the row actually moved
	/*
    table.on("rowMoved", function(){
        highlightChange();
    });
	*/

    // invert the selected state of each row
    /*
    table.on("groupClick", function(e, group){
        group.getRows().forEach( (row) => {
            row.toggleSelect();
        });
    });
    */

    // after adding a row, open the group it is in and highlight/select it
    table.on("rowAdded", function(row){
        /*var group = row.getGroup();
        group.show();*/
        row.select();
    });

    const data = await getTblData();
    data.forEach((e) => {
        table.addRow(e,true);
    });
}

async function getTblData() {
	let data = [];
	try {
     data = await browser.tabs.executeScript({
        file: 'getStorage.js'
    });
	}catch(e){
		data = [];
	}
    return data;
}

document.addEventListener('DOMContentLoaded', onDOMContentLoaded);

