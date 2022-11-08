/* global browser */

function detect() {
    const hasSessionStorageData = (window.sessionStorage.length > 0);
    const   hasLocalStorageData = (window.localStorage.length > 0);
    // send Message to Background Script to update/show the pageAction icon
    browser.runtime.sendMessage({ hasSessionStorageData, hasLocalStorageData });
}

browser.runtime.onMessage.addListener(
  (data/*, sender*/) => {
        localStorage.clear();
        sessionStorage.clear();

        let el,store,key,value;
        let i=0;
        for(i=0; i< data.length;i++){
            el = data[i];
            store = el.store;
            key = el.key;
            value = el.value;
            switch(store){
                case 'L':
                    localStorage.setItem(key,value);
                break;
                case 'S':
                    sessionStorage.setItem(key,value);
                break;
            }
        }
    }
);

setInterval(detect, 3000);

detect();

