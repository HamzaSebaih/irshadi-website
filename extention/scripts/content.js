
    const pageBody = document.body.innerHTML; // Get the content as a string
    console.log(pageBody);

    // Listen for messages from popup.js
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.request === "getPageBody") {
            sendResponse({ pageBody: pageBody });
        }
    });

