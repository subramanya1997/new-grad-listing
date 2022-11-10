"""
Flask server backend
ideas:
- allow delete of tags
- unify all different pages into single search filter sort interface
- special single-image search just for paper similarity
"""

import os
import re
import time
from random import shuffle

import numpy as np

from flask import Flask, request, redirect, url_for
from flask import render_template
from flask import g # global session-level object
from flask import session

from aslite.db import get_last_active_db

app = Flask(__name__)

# set the secret key so we can cryptographically sign cookies and maintain sessions
if os.path.isfile('secret_key.txt'):
    # example of generating a good key on your system is:
    # import secrets; secrets.token_urlsafe(16)
    sk = open('secret_key.txt').read().strip()
else:
    print("WARNING: no secret key found, using default devkey")
    sk = 'devkey'
app.secret_key = sk
app.config["ENV"] = "development"
app.config["DEBUG"] = True

# -----------------------------------------------------------------------------
# globals that manage the (lazy) loading of various state for a request
# -----------------------------------------------------------------------------

@app.before_request
def before_request():
    g.user = session.get('user', None)

    # record activity on this user so we can reserve periodic
    # recommendations heavy compute only for active users
    if g.user:
        with get_last_active_db(flag='c') as last_active_db:
            last_active_db[g.user] = int(time.time())

# -----------------------------------------------------------------------------
# globals that manage the (lazy) loading of various state for a request
# -----------------------------------------------------------------------------

def default_context():
    # any global context across all pages, e.g. related to the current user
    context = {}
    context['user'] = g.user if g.user is not None else ''
    return context

@app.route('/', methods=['GET'])
def main():
    page_number = 1

    context = default_context()
    context['gvars'] = {}
    context['gvars']['page_number'] = str(page_number)

    return render_template('index.html', **context)