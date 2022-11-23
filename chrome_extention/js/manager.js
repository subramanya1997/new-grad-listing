class ExeManager {
    constructor(currentUrl) {
        this.currentUrl = currentUrl;
        this.isCompanyDataAvailable = false;
        this.isUserDataAvailable = false;
        this.companyData = null;
        this.userData = null;
        this.auto_fill = null;
    }

    change() {
        if (!this.isCompanyDataAvailable && this.companyData === null){
            this.isCompanyDataAvailable = true;
            this.companyData = new CompanyData(this.currentUrl, this);
            return;
        }
        if (!this.isUserDataAvailable && this.userData === null){
            this.isUserDataAvailable = true;
            this.userData = new UserData("https://raw.githubusercontent.com/subramanya1997/new-grad-listing/main/chrome_extention/assets/data.json", this);
            return;
        }
        if (this.isCompanyDataAvailable && this.isUserDataAvailable && this.companyData !== null && this.userData !== null) {
            this.auto_fill = new AutoFill(this.userData.resume_json, 
                this.userData.resume_file, 
                this.userData.cover_letter,
                this.companyData.job_portal_type,
                this);
            this.auto_fill.resume_task();
        }
        else {
            console.log("Something went wrong");
        } 
    }
}