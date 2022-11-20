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
        return form;
    }

    function fill_text_field(field){
        field.labels.forEach(label => {
            for(var key in resume_json){
                if(label.innerText.toLowerCase().includes(key.toLowerCase())){
                    field.value = resume_json[key];
                    break;
                }
            }
        });
    }

    function recursive_update(prevText, selectedText, _field){
        for(var i =0; i < _field.children.length; i++){
            if (prevText == _field.children[i].innerText){
                if (_field.children[i].innerHTML != prevText){
                    recursive_update(prevText, selectedText, _field.children[i]);
                }else{
                    _field.children[i].innerHTML = selectedText;
                }
            }
            
        }
    }

    function fill_select_field(field){
        for(var key in resume_json){
            if (field.parentNode.parentNode.innerText.toLowerCase().includes(key.toLowerCase()) || field.parentNode.innerText.toLowerCase().includes(key.toLowerCase())){
                if (field.type == "select-one"){
                    for(var i = 0; i < field.options.length; i++){
                        if(field.options[i].text.toLowerCase().includes(resume_json[key].toLowerCase())){
                            for(var j = 0; j < field.parentNode.children.length; j++){
                                if (field.parentNode.children[j] != field && field.parentNode.children[j].innerText == field.options[field.options.selectedIndex].text){
                                    recursive_update(field.options[field.options.selectedIndex].text, field.options[i].text, field.parentNode.children[j]);
                                    break;
                                }
                            }
                            field.options[i].selected = true;
                            break;
                        }
                    }
                }
                else if (field.type == "checkbox"){
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
    }

    function upload_file(field){
        for(var key in resume_json){
            if (field.parentNode.innerText.toLowerCase().includes(key.toLowerCase())){
                console.log(field.parentNode.innerText, field);
                break;
            }
        }
    }

    function fill_form(){
        console.log("Filling form");
        form = get_form();
        console.log(Array.from(form.elements));
        Array.from(form.elements).forEach(element => {
            if(element != null && element.type != 'hidden') {
                if (element.type == "text" || element.type == "email" ){
                    fill_text_field(element);
                }
                else if (element.type == "radio" || element.type == "checkbox" || element.type == "select-one"){
                    fill_select_field(element);
                }
                else if (element.type == "fieldset" || element.type == "button"){
                    upload_file(element);
                }
                else{
                    // console.log(element);
                }
            }
        });
    }

    function resume_task(){
        if (resume_json != null && resume_file != null){
            fill_form();
        }
    }

    async function get_user_resume(url){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                resume_json = JSON.parse(xhr.responseText);
                get_resume_pdf();
            }
        }
    }

    async function get_resume_pdf(){
        var url = resume_json["resume_url"];
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.send();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var blob = new Blob([xhr.response], {type: 'application/pdf'});
                resume_file = URL.createObjectURL(blob);
                resume_json["resume"] = resume_file;
                console.log(resume_json, resume_file);
                resume_task();
            }
        }
    }
    form = get_form();
    console.log(form.files);
    get_user_resume("https://raw.githubusercontent.com/subramanya1997/new-grad-listing/main/chrome_extention/assets/data.json");
}