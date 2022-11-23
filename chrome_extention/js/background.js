chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: main,
        args: [tab.url]
    });
});

function main(currentUrl) {
    var exeManager = new ExeManager(currentUrl);
    exeManager.change();
}