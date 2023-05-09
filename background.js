/* global browser */

browser.runtime.onMessage.addListener((data, sender) => {
  //console.debug(data,sender);
  //return Promise.resolve('done');
  // return false;
  // change pageAction icon depending if data is available
  let text = "";
  let tabId = sender.tab.id;

  if (data.hasSessionStorageData) {
    text += "S";
  }
  if (data.hasLocalStorageData) {
    text += "L";
  }
  browser.browserAction.setBadgeText({ tabId, text });
  browser.browserAction.enable(tabId);
});

browser.browserAction.disable();
