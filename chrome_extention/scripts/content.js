chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: main,
    });
});

function main(){

    async function get_json(url){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                return JSON.parse(xhr.responseText);
            }
        }
    }

    data = get_json("https://raw.githubusercontent.com/subramanya1997/new-grad-listing/main/chrome_extention/assets/data.json");
    console.log(data);
    // Array.from(document.forms[0].elements).forEach(element => {
    //     if(element != null && element.type != 'hidden') {
    //         element.labels.forEach(label => {
    //             _label = label.innerText.replace(/(\r\n*|\n*|\r)/gm, "");
    //             if (label.innerText.includes('Full name')) {
    //                 element.value = 'John Doe';
    //             }
    //             if (label.innerText.includes('Email')) {
    //                 element.value = 'snagabhushan@umass.edu';
    //             }
                
    //         });
    //     }
    // });
}

