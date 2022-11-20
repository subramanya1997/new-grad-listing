chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: main,
    });
});

function main(){

    function get_json(url){
        fetch(url).then(function(response){
            return response.json();
        }).then(function(json){
            return json;
        });
    }

    data = get_json("https://drive.google.com/file/d/1zHTEnobYL0U0CWpf-yBlbHcvY7sKPAry/view?usp=sharing");
    console.log(data);
    Array.from(document.forms[0].elements).forEach(element => {
        if(element != null && element.type != 'hidden') {
            element.labels.forEach(label => {
                _label = label.innerText.replace(/(\r\n*|\n*|\r)/gm, "");
                if (label.innerText.includes('Full name')) {
                    element.value = 'John Doe';
                }
                if (label.innerText.includes('Email')) {
                    element.value = 'snagabhushan@umass.edu';
                }
                
            });
        }
    });
}

