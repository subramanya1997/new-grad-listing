# New Grad Openings
A project to pull all the new grad openings and make it easier to search. 

## Requirements
Install via requirements:
```bash
 pip install -r requirements.txt
```

## Get companies data
Get the list of companies from [levels.fyi](www.levels.fyi/) and store it in data/companies.db 
```bash
 python company_listing_daemon.py
 python job_listing_daemon.py
```

## To-do 
* [x] Get companies data.
* [ ] Get job listing from each company. (Current number of companies it can fetch from 250)
* [ ] Filter data for new grad postions.
* [ ] Build a website to show these listings
* [ ] Chrome extension to auto fill. [Extention Page](chrome_extention/)