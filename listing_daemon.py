"""
This script is intended to wake up every 2 hours or so (eg via cron),
it checks for any new companies added to levels.fyi and check for new job posting in each of those companies 
"""
import os
import logging
import argparse
import requests
from tqdm import tqdm
from urllib.parse import urlparse
from hashlib import sha256
import re

from aslite.db import get_companies_db, delete_dbs

def get_json(url):
    """
    Get jsson from levels.fyi with companies list.
    """
    return requests.get(url).json()

def checkRequest(url):
    """
    Check for valid reuest.
    """
    headers = {"User-Agent": "Mozilla/5.0 (X11; CrOS x86_64 12871.102.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.141 Safari/537.36"}
    try:
        if requests.get(url, headers=headers, timeout=10).status_code == 200:
            return True
    except:
        print(f"Could not connect to: {url}")
        return False
    return False

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(name)s %(levelname)s %(asctime)s %(message)s", datefmt="%m/%d/%Y %I:%M:%S %p")

    parser = argparse.ArgumentParser(description="Listing Daemon")
    parser.add_argument("-u", "--url", type=str, default="https://www.levels.fyi/js/internshipData.json", help="up to how many papers to fetch")
    parser.add_argument("-y", "--year", type=str, help="up to how many papers to fetch")

    args = parser.parse_args()
    print(args)
    """
    Quick note on the break_after argument: In a typical setting where one wants to update
    the companies database it is better to break out early in case we"ve reached older listings 
    that are already part of the database, to spare the companies website.
    """
    delete_dbs()
    cdb = get_companies_db(flag="c")
    
    def store(p):
        _store_data = {
            "id": p["id"],
            "company": p["company"],
            "icon": p["icon"] if p["icon"] is not None else None,
            "loc": [p["loc"]] if p["loc"] is not None else [],
            "link": [p["link"]] if p["link"] is not None else [],
        }
        if _store_data["id"] in cdb:
            _store_data["loc"].extend(cdb[_store_data["id"]]["loc"])
            _store_data["link"].extend(cdb[_store_data["id"]]["link"])
        cdb[_store_data["id"]] = _store_data
    
    def cleanupdb():
        _delete_ids = []
        for _id, _data in tqdm(cdb.items()):
            _data["link"] = set(_data["link"])
            if len(_data["link"]) == 0:
                _delete_ids.append(_id)
            cdb[_id] = _data
        for _id in _delete_ids:
            del cdb[_id]

    def company_stats():
        """
        Print stats of companies stored
        """
        companies_links = 0
        for _id, _data in cdb.items():
            if len(_data["link"]) > 0:
                companies_links+=1
        print(f"Total Number of companies: {len(cdb)}")
        print(f"Total Number of companies with links: {companies_links}")
        
    jdata = get_json(args.url)

    """
    save company data to companies db 
    """
    for data in tqdm(jdata):
        _company_name = data["company"]
        if args.year is not None:
            if args.year not in data["yr"]:
                continue
        if "link" in data:
            _urlData = urlparse(data["link"])
            _link = f"{_urlData.scheme}://{_urlData.netloc}{_urlData.path}"
            _link = _link if _link != "" else None
            if not checkRequest(_link) or _urlData.path == "/" or _urlData.path == "":
                _link = None
            
        _data = {
            "id": sha256(_company_name.encode()).hexdigest(),
            "company": data["company"],
            "icon": data["icon"] if "icon" in data else None,
            "loc": data["loc"] if "loc" in data else None,
            "link": _link if "link" in data else None,
        }
        store(_data)

    cleanupdb()
    company_stats()


        
