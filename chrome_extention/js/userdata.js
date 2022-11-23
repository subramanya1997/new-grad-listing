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