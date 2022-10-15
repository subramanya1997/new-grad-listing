

import os
import logging
import argparse
import requests
from tqdm import tqdm
from urllib.parse import urlparse
from hashlib import sha256
import tldextract
from collections import defaultdict

from aslite.db import get_companies_db, get_job_listings_db

from selenium import webdriver
from selenium.webdriver.common.by import By

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

def get_listings_for_lever_co(browser, url, company_data):
    """
    Get listings from job.lever.co
    """
    print("-----------------")
    print(f"processing {company_data['company']} with {url}...")
    browser.get(url)
    _eles = browser.find_elements(By.CSS_SELECTOR, '.posting')
    _job_listing = {
        "company": company_data["company"],
        "icon": company_data["icon"],
        "loc": company_data["loc"],
        "id": company_data["id"],
        "jobs": []
    }
    for _ele in _eles:
        _title = _ele.find_element(By.TAG_NAME, 'h5').text
        _location = _ele.find_element(By.CSS_SELECTOR, '.sort-by-location').text
        _link = _ele.find_element(By.CSS_SELECTOR, '.posting-title').get_attribute('href')
        _team = ""
        _job_listing_data = {
            "title": _title,
            "location": _location,
            "link": _link,
            "team": _team,
        }
        try:
            _team = _ele.find_element(By.CSS_SELECTOR, '.sort-by-team').text
            _job_listing_data["team"] = _team
        except:
            pass
        _job_listing["jobs"].append(_job_listing_data)
    print(f"Found {len(_job_listing['jobs'])} jobs for {company_data['company']}")
    return _job_listing

def clean_url(url):
    """
    Clean url.
    """
    _path = urlparse(url)
    _paths = _path.path.split("/")
    _temp_subpath = ""
    for _subpath in _paths:
        if _subpath == "":
            continue
        _temp_subpath += f"/{_subpath}"
        _test_url = f"{_path.scheme}://{_path.netloc}{_temp_subpath}"
        if not checkRequest(_test_url):
            continue
        return _test_url
    return None
    

def process_url(url):
    """
    Process url.
    """
    # print(f"Processing {url}")
    _domain_data = tldextract.extract(url)
    url = clean_url(url)
    if url is None:
        return False, "", ""
    return True , url, _domain_data.domain

if __name__ == "__main__":

    cdb = get_companies_db(flag="r")
    ldb = get_job_listings_db(flag="c")

    def store(p):
        ldb[p['id']] = p

    def get_different_domains():
        """
        Get different domains from companies db
        """
        print("Grouping domains...")
        _domains = defaultdict(set)
        for _id, _data in cdb.items():
            for _link in _data["link"]:
                if "jobs.lever.co" not in _link:
                    continue
                _bool, _url, _domain_name = process_url(_link)
                if _bool:
                    _domains[_domain_name].add((_url, _id))
        return _domains

    _domains = get_different_domains()

    print("-----------------")
    for _domain, data in _domains.items():
        print(f"{_domain} has {len(data)} companies")
    print("-----------------")

    browser = webdriver.Chrome('./chromedriver')
    
    total_jobs = 0
    for _domain, data in _domains.items():
        if _domain == "lever":
            for _url, _id in data:
                _job_listings = get_listings_for_lever_co(browser, _url, cdb[_id])
                total_jobs += len(_job_listings["jobs"])
                store(_job_listings)

    print(f"Total jobs: {total_jobs}")
    browser.close()
