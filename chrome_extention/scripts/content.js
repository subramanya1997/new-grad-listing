chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: () => {
            alert("Hello from the background script!");
            document.body.style.backgroundColor = 'red';
        }
    });
});