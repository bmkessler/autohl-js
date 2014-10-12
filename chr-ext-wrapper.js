chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Auto-highlighting ' + tab.url );
  chrome.tabs.executeScript(null,{
    file: "readability.js"
  }, function () {
    chrome.tabs.executeScript(null,{
      file: "autohl.js"
    });
  });
});
