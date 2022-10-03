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
 python listing_daemon.py -y 2022
```

## To-do 
* [x] Get companies data.
* [ ] Get job listing from each company.
* [ ] Filter data for new grad postions.
* [ ] Build a website to show these listings

