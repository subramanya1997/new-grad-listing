chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        function: main,
        args: [tab.url]
    });
});

function main(currentUrl) {

    // variables
    var companyData = null;
    var userData = null;

    class CompanyData{
        constructor(currentUrl, exeManager){
            this.currentUrl = currentUrl;
            this.job_portal_name = this.getJobPortalName();
            this.company_name = this.getCompanyName();
            exeManager.change();
        }

        getCompanyName(){
            if (this.job_portal_name === 'greenhouse'){
                return this.currentUrl.split('/')[3];
            }
        }

        getJobPortalName(){
            if (this.currentUrl.includes('greenhouse')){
                return 'greenhouse';
            }
        }

        printCompanyData(){
            console.log(`Compnay Name: ${this.company_name}`);
            console.log(`Portal Name: ${this.job_portal_name}`);
        }
    }

    class UserData{
        constructor(user_data_url, exeManager){
            this.user_data_url = user_data_url;
            this.resume_json = null;
            this.resume_file = null;
            this.cover_letter = null;
            this.exeManager = exeManager
            this.get_user_data(this.user_data_url);

        }

        async get_resume_pdf(url){
            var obj = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.send();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var dataTransfer = new DataTransfer();
                    dataTransfer.items.add(new File([xhr.response], "resume.pdf", {type: "application/pdf"}));
                    obj.resume_file = dataTransfer;
                    obj.exeManager.change();
                }
            }
        }

        async get_cover_pdf(url){
            var obj = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'blob';
            xhr.send();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    var dataTransfer = new DataTransfer();
                    dataTransfer.items.add(new File([xhr.response], "cover_letter.pdf", {type: "application/pdf"}));
                    obj.cover_letter = dataTransfer;
                }
            }
        }

        async get_user_data(url){
            var obj = this;
            var xhrUData = new XMLHttpRequest();
            xhrUData.open('GET', url, true);
            xhrUData.send();
            xhrUData.onreadystatechange = function () {
                if (xhrUData.readyState === 4 && xhrUData.status === 200) {
                    obj.resume_json = JSON.parse(xhrUData.responseText);
                }
            }
            xhrUData.onloadend = function() {
                if (obj.resume_json.hasOwnProperty("resume_url") && obj.resume_json["resume_url"] !== ''){
                    obj.get_resume_pdf(obj.resume_json["resume_url"]);
                }
                if (obj.resume_json.hasOwnProperty("cover_letter_url") && obj.resume_json["cover_letter_url"] !== ''){
                    obj.get_cover_pdf(obj.resume_json["cover_letter_url"]);
                }
            }
        }

        printUserData(){
            console.log(`User data: ${this.resume_json}`);
        }

    }

    class ExeManager {
        constructor() {
            this.CompanyData = false;
            this.UserData = false;
            this.autoFill = false;
        }

        change() {
            if (!this.CompanyData){
                this.CompanyData = true;
                companyData = new CompanyData(currentUrl, this);
                return;
            }
            if (!this.UserData){
                this.UserData = true;
                userData = new UserData("https://raw.githubusercontent.com/subramanya1997/new-grad-listing/main/chrome_extention/assets/data.json", this);
                return;
            }
            if (!this.autoFill){
                this.autoFill = true;
                resume_task();
            }
        }
    }

    var exeManager = new ExeManager();
    exeManager.change();

    function get_form(){
        var form = document.forms[0];
        return form;
    }

    function fill_text_field(field){
        field.labels.forEach(label => {
            for(var key in userData.resume_json){
                if(label.innerText.toLowerCase().includes(key.toLowerCase())){
                    field.value = userData.resume_json[key];
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
        for(var key in userData.resume_json){
            if (field.parentNode.parentNode.innerText.toLowerCase().includes(key.toLowerCase()) || field.parentNode.innerText.toLowerCase().includes(key.toLowerCase())){
                if (field.type == "select-one"){
                    for(var i = 0; i < field.options.length; i++){
                        if(field.options[i].text.toLowerCase().includes(userData.resume_json[key].toLowerCase())){
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
                    if (Array.isArray(userData.resume_json[key])){
                        userData.resume_json[key].forEach(value => {
                            if (field.parentNode.innerText.toLowerCase().includes(value.toLowerCase())){
                                field.checked = true;
                            }
                        });
                    }else{
                        if (field.parentNode.innerText.toLowerCase().trim() == userData.resume_json[key].toLowerCase().trim()){
                            field.checked = true;
                        }
                    }
                }
            }
        }
    }

    function upload_files(){
        var _form = document.getElementById("s3_upload_for_resume");
        var _file_input = _form.querySelector("input[type='file']");
        _file_input.files = userData.resume_file.files;
        _file_input.dispatchEvent(new Event("change", { bubbles: !0 }));
    }

    function fill_form(){
        form = get_form();
        Array.from(form.elements).forEach(element => {
            if(element != null && element.type != 'hidden') {
                if (element.type == "text" || element.type == "email" ){
                    fill_text_field(element);
                }
                else if (element.type == "radio" || element.type == "checkbox" || element.type == "select-one"){
                    fill_select_field(element);
                }
            }
        });
        upload_files();
    }

    function resume_task(){
        if (userData.resume_json != null && userData.resume_file != null){
            fill_form();
        }
    }

    
    // get_user_data("https://raw.githubusercontent.com/subramanya1997/new-grad-listing/main/chrome_extention/assets/data.json");
}