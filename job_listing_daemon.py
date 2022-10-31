

import os
import logging
import argparse
import requests
from tqdm import tqdm
from urllib.parse import urlparse
from hashlib import sha256
import time

from aslite.db import get_companies_db, get_job_listings_db, get_analytics_db

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def get_listings_for_lever_co(browser, url, company_data):
    """
    Get listings from job.lever.co
    """
    print("\n-----------------")
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
        _job_listing_data = {
            "title": None,
            "location": None,
            "link": None,
            "team": None,
        }
        try:
            _title = _ele.find_element(By.TAG_NAME, 'h5').text
            _job_listing_data["title"] = _title
        except:
            pass
        try:
            _location = _ele.find_element(By.CSS_SELECTOR, '.sort-by-location').text
            _job_listing_data["location"] = _location
        except:
            pass
        try:
            _link = _ele.find_element(By.CSS_SELECTOR, '.posting-title').get_attribute('href')
            _job_listing_data["link"] = _link
        except:
            pass
        try:
            _team = _ele.find_element(By.CSS_SELECTOR, '.sort-by-team').text
            _job_listing_data["team"] = _team
        except:
            pass
        _job_listing["jobs"].append(_job_listing_data)
    print(f"Found {len(_job_listing['jobs'])} jobs for {company_data['company']}")
    return _job_listing

def get_listings_for_greenhouse_io(browser, url, company_data):
    """
    Get listings from greenhouse.io
    """
    print("\n-----------------")
    print(f"processing {company_data['company']} with {url}...")
    browser.get(url)
    _eles = browser.find_elements(By.CSS_SELECTOR, '.opening')
    _job_listing = {
        "company": company_data["company"],
        "icon": company_data["icon"],
        "loc": company_data["loc"],
        "id": company_data["id"],
        "jobs": []
    }
    for _ele in _eles:
        _job_listing_data = {
            "title": None,
            "location": None,
            "link": None,
            "team": None,
        }
        _department_ids = _ele.get_attribute('department_id').split(',')
        _departments = []
        for _department_id in _department_ids:
            try:
                _departments.append(browser.find_element(By.ID, _department_id).text)
            except:
                pass
        _job_listing_data["location"] = _ele.find_element(By.CSS_SELECTOR, '.location').text
        _job_listing_data["title"] = _ele.find_element(By.TAG_NAME, 'a').text
        _job_listing_data["link"] = _ele.find_element(By.TAG_NAME, 'a').get_attribute('href')
        _job_listing_data["team"] = ', '.join(_departments)

        _job_listing["jobs"].append(_job_listing_data)
    print(f"Found {len(_job_listing['jobs'])} jobs for {company_data['company']}")
    return _job_listing

def get_listings_for_myworkdayjobs(browser, url, company_data):
    """
    Get listings from workable.com
    """
    print("\n-----------------")
    print(f"processing {company_data['company']} with {url}...")
    browser.get(url)
    _eles = browser.find_elements(By.CSS_SELECTOR, '.opening')
    _job_listing = {
        "company": company_data["company"],
        "icon": company_data["icon"],
        "loc": company_data["loc"],
        "id": company_data["id"],
        "jobs": []
    }
    _temp = True
    while _temp:
        time.sleep(4)
        _temp = False
        _sections = browser.find_elements(By.TAG_NAME, 'section')
        _section = None
        for _sec in _sections:
            if _sec.get_attribute('data-automation-id') == 'jobResults':
                _section = _sec
                _eles = _sec.find_elements(By.TAG_NAME, 'li')
        for _ele in _eles:
            _job_listing_data = {
                "title": None,
                "link": None,
            }
            try:
                _job_listing_data["title"] = _ele.find_element(By.TAG_NAME, "a").text
                _job_listing_data["link"] = _ele.find_element(By.TAG_NAME, "a").get_attribute('href')
            except:
                pass
            if _job_listing_data["title"] is not None:
                _job_listing["jobs"].append(_job_listing_data)
    
        _buttons = browser.find_elements(By.TAG_NAME, "button")
        for _button in _buttons:
            if _button.get_attribute("aria-label") == "next":
                _button.click()
                _temp = True
    
    print(f"Found {len(_job_listing['jobs'])} jobs for {company_data['company']}")
    return _job_listing


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Job listing daemon using selenium.")
    parser.add_argument("-dl", "--domain_list", default=[], help="List of domains to process. If not provided, all domains will be processed.")
    parser.add_argument("-hl", "--headless", action="store_true", help="Run in headless mode.")
    parser.add_argument("-dp", "--driver_path", default="./chromedriver", type=str, help="Path to chromedriver.")
    args = parser.parse_args()
    print(args)

    cdb = get_companies_db(flag="r")
    adb = get_analytics_db(flag="r")
    ldb = get_job_listings_db(flag="c")

    def store(p):
        '''
        Store data.
        '''
        ldb[p['id']] = p

    driver_options = Options()
    if args.headless:
        driver_options.add_argument("--headless")
    browser = webdriver.Chrome(executable_path=args.driver_path, options=driver_options)
    
    total_jobs = 0
    for _domain, data in adb.items():
        if _domain == "lever":
            for _url, _id in tqdm(data, desc=f"Processing {_domain}", total=len(data)):
                _job_listings = get_listings_for_lever_co(browser, _url, cdb[_id])
                total_jobs += len(_job_listings["jobs"])
                store(_job_listings)
        if _domain == "greenhouse":
            for _url, _id in tqdm(data, desc=f"Processing {_domain}", total=len(data)):
                _job_listings = get_listings_for_greenhouse_io(browser, _url, cdb[_id])
                total_jobs += len(_job_listings["jobs"])
                store(_job_listings)
        if _domain == "myworkdayjobs":
            for _url, _id in tqdm(data, desc=f"Processing {_domain}", total=len(data)):
                _job_listings = get_listings_for_myworkdayjobs(browser, _url, cdb[_id])
                total_jobs += len(_job_listings["jobs"])
                store(_job_listings)

    print(f"Total jobs: {total_jobs}")
    browser.close()
