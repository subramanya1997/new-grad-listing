const CompanyType  = {
    greenhouse: 'greenhouse'
}

class CompanyData{
    constructor(currentUrl, exeManager){
        this.currentUrl = currentUrl;
        this.job_portal_type = this.getJobPortalName();
        this.company_name = this.getCompanyName();
        exeManager.change();
    }

    getCompanyName(){
        if (this.job_portal_type === 'greenhouse'){
            return this.currentUrl.split('/')[3];
        }
    }

    getJobPortalName(){
        if (this.currentUrl.includes('greenhouse')){
            return CompanyType.greenhouse;
        }
    }

    printCompanyData(){
        console.log(`Compnay Name: ${this.company_name}`);
        console.log(`Portal Name: ${this.job_portal_type}`);
    }
}