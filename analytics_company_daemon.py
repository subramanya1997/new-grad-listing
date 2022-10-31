

import os
import logging
import argparse
import requests
from tqdm import tqdm
from urllib.parse import urlparse
import tldextract
from collections import defaultdict

from aslite.db import get_companies_db, get_analytics_db

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
    parser = argparse.ArgumentParser(description="Job listing daemon using selenium.")
    parser.add_argument("-dl", "--domain_list", default=[], help="List of domains to process.")
    args = parser.parse_args()
    print(args)

    cdb = get_companies_db(flag="r")
    adb = get_analytics_db(flag="c")

    def store(id, value):
        adb[id] = value

    def get_different_domains():
        """
        Get different domains from companies db
        """
        print("Grouping domains...")
        _domains = defaultdict(set)
        for _id, _data in tqdm(cdb.items(), total=len(cdb)):
            for _link in _data["link"]:
                if len(args.domain_list) != 0:
                    if _link not in args.domain_list:
                        continue
                _bool, _url, _domain_name = process_url(_link)
                if _bool:
                    _domains[_domain_name].add((_url, _id))
        return _domains

    _domains = get_different_domains()

    print("-----------------")
    for _domain, data in _domains.items():
        print(f"{_domain} has {len(data)} companies")
        store(_domain, data)
    print("-----------------")