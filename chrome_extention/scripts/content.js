chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: main,
    });
});

function main(){

    var resume_json = null;
    var resume_file = null;

    function storeDataLocally(data){
        console.log("Storing data locally");
    }

    function getDataLocally(){
        console.log("Getting data locally");
    }

    function get_form(){
        var form = document.forms[0];
        console.log(form);
        return form;
    }

    function fill_text_field(field){
        field.labels.forEach(label => {
            for(var key in resume_json){
                if(label.innerText.toLowerCase().includes(key.toLowerCase())){
                    field.value = resume_json[key];
                    return;
                }
            }
        });
        field.labels.forEach(label => {
            console.log(label.innerText)
        });
    }

    function fill_select_field(field){
        for(var key in resume_json){
            if (field.parentNode.parentNode.innerText.toLowerCase().includes(key.toLowerCase())){
                if (Array.isArray(resume_json[key])){
                    resume_json[key].forEach(value => {
                        if (field.parentNode.innerText.toLowerCase().includes(value.toLowerCase())){
                            field.checked = true;
                        }
                    });
                }else{
                    if (field.parentNode.innerText.toLowerCase().trim() == resume_json[key].toLowerCase().trim()){
                        field.checked = true;
                    }
                }
            }
        }
    }

    function fill_form(){
        console.log("Filling form");
        form = get_form();
        Array.from(form.elements).forEach(element => {
            if(element != null && element.type != 'hidden') {
                if (element.type == "text" || element.type == "email" ){
                    fill_text_field(element);
                }
                else if (element.type == "radio" || element.type == "checkbox"){
                    fill_select_field(element);
                }
                else if (element.type == "fieldset"){
                    // console.log(element);
                }
                else{
                    // console.log(element);
                }
            }
        });
    }

    function resume_task(){
        console.log("Resuming task");
        fill_form();
        console.log(resume_json);
        console.log(resume_file);
    }

    async function get_user_resume(url){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                resume_json = JSON.parse(xhr.responseText);
                resume_task();
            }
        }
    }

    get_user_resume("https://raw.githubusercontent.com/subramanya1997/new-grad-listing/main/chrome_extention/assets/data.json");
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

