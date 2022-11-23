class AutoFill {
    constructor(resume_json, resume_file, cover_letter=null, job_portal_type=0, manager=null) {
        this.resume_json = resume_json;
        this.resume_file = resume_file;
        this.cover_letter = cover_letter;
        this.job_portal_type = job_portal_type;
        this.manager = manager;
        this.forms = null;
        this.form = null;
    }

    get_forms(){
        this.forms = document.forms;
        this.form = document.forms[0];
    }

    fill_text_field(field, label){
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase())){
                field.value = this.resume_json[key];
                field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                return;
            }
        }
    }

    fill_select_field(field, label){
        for(var key in this.resume_json){
            if (label.toLowerCase().includes(key.toLowerCase())){
                if (field.type == "select-one"){
                    for(var i = 0; i < field.options.length; i++){
                        if(field.options[i].text.toLowerCase().includes(this.resume_json[key].toLowerCase())){
                            field.options[i].selected = true;
                            field.options[i].dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                            break;
                        }
                    }
                }
                else {
                    if (Array.isArray(this.resume_json[key])){
                        this.resume_json[key].forEach(value => {
                            if (field.parentNode.innerText.toLowerCase().includes(value.toLowerCase())){
                                field.checked = true;
                                field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                            }
                        });
                    }else{
                        if (field.parentNode.innerText.toLowerCase().trim() == this.resume_json[key].toLowerCase().trim()){
                            field.checked = true;
                            field.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
                        }
                    }
                }
            }
        }
    }

    upload_files(){
        switch(this.job_portal_type){
            case CompanyType.greenhouse:
                this.upload_greenhouse();
                break;
            case CompanyType.lever:
                this.upload_lever();
                break;
        }   
        
    }

    fill_resume() {
        this.get_forms();
        var labels = this.form.getElementsByTagName("label");
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i].parentNode.innerText.split("\n")[0]
            var elements = labels[i].parentNode.getElementsByTagName("input");
            for(var j = 0; j < elements.length; j++){
                var element = elements[j];
                if(element != null && element.type != 'hidden') {
                    if (element.type == "text" || element.type == "email"){
                        this.fill_text_field(element, label);
                    }
                    else if (element.type == "radio" || element.type == "checkbox"){
                        this.fill_select_field(element, label);
                    }
                }
            }
            var elements = labels[i].parentNode.getElementsByTagName("select");
            for(var j = 0; j < elements.length; j++){
                var element = elements[j];
                if(element != null && element.type != 'hidden') {
                    this.fill_select_field(element, label);
                }
            }
        }
        this.upload_files();
    }

    resume_task() {
        if (this.resume_json !== null && this.resume_file !== null) {
            this.fill_resume();
        }
    }

    upload_greenhouse() {
        // Upload resume
        if (this.resume_file !== null) {
            var _form = document.getElementById("s3_upload_for_resume");
            var _file_input = _form.querySelector("input[type='file']");
            _file_input.files = this.resume_file.files;
            _file_input.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        }

        // Upload cover letter
        if (this.cover_letter !== null) {
            var _form = document.getElementById("s3_upload_for_cover_letter");
            var _file_input = _form.querySelector("input[type='file']");
            _file_input.files = this.cover_letter.files;
            _file_input.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
        }
    }

    upload_lever() {
        Array.from(this.form.elements).forEach(element => {
            // Upload resume
            if (element.type == "file" && element.name == "resume"){
                element.files = this.resume_file.files;
                element.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
            }
            // Upload cover letter
            if (element.type == "file" && element.name == "coverLetter"){
                element.files = this.cover_letter.files;
                element.dispatchEvent(new Event("change", { bubbles: !0, cancelable: !1 }));
            }
        });
    }
}