"""
Database support functions.
The idea is that none of the individual scripts deal directly with the file system.
Any of the file system I/O and the associated settings are in this single file.
"""

import os
import sqlite3, zlib, pickle, tempfile
from sqlitedict import SqliteDict
from contextlib import contextmanager

# -----------------------------------------------------------------------------
# global configuration

DATA_DIR = 'data'

# -----------------------------------------------------------------------------
# utilities for safe writing of a pickle file

# Context managers for atomic writes courtesy of
# http://stackoverflow.com/questions/2333872/atomic-writing-to-file-with-python
@contextmanager
def _tempfile(*args, **kws):
    """ Context for temporary file.
    Will find a free temporary filename upon entering
    and will try to delete the file on leaving
    Parameters
    ----------
    suffix : string
        optional file suffix
    """

    fd, name = tempfile.mkstemp(*args, **kws)
    os.close(fd)
    try:
        yield name
    finally:
        try:
            os.remove(name)
        except OSError as e:
            if e.errno == 2:
                pass
            else:
                raise e

@contextmanager
def open_atomic(filepath, *args, **kwargs):
    """ Open temporary file object that atomically moves to destination upon
    exiting.
    Allows reading and writing to and from the same filename.
    Parameters
    ----------
    filepath : string
        the file path to be opened
    fsync : bool
        whether to force write the file to disk
    kwargs : mixed
        Any valid keyword arguments for :code:`open`
    """
    fsync = kwargs.pop('fsync', False)

    with _tempfile(dir=os.path.dirname(filepath)) as tmppath:
        with open(tmppath, *args, **kwargs) as f:
            yield f
            if fsync:
                f.flush()
                os.fsync(f.fileno())
        os.rename(tmppath, filepath)

def safe_pickle_dump(obj, fname):
    """
    prevents a case where one process could be writing a pickle file
    while another process is reading it, causing a crash. the solution
    is to write the pickle file to a temporary file and then move it.
    """
    with open_atomic(fname, 'wb') as f:
        pickle.dump(obj, f, -1) # -1 specifies highest binary protocol

# -----------------------------------------------------------------------------

class CompressedSqliteDict(SqliteDict):
    """ overrides the encode/decode methods to use zlib, so we get compressed storage """

    def __init__(self, *args, **kwargs):

        def encode(obj):
            return sqlite3.Binary(zlib.compress(pickle.dumps(obj, pickle.HIGHEST_PROTOCOL)))

        def decode(obj):
            return pickle.loads(zlib.decompress(bytes(obj)))

        super().__init__(*args, **kwargs, encode=encode, decode=decode)

# -----------------------------------------------------------------------------

"""
some docs to self:
flag='c': default mode, open for read/write, and creating the db/table if necessary
flag='r': open for read-only
"""

# stores info about papers, and also their lighter-weight metadata
COMPANIES_DB_FILE = os.path.join(DATA_DIR, 'companies.db')

def delete_dbs():
    os.remove(COMPANIES_DB_FILE)

def get_companies_db(flag='r', autocommit=True):
    assert flag in ['r', 'c']
    pdb = CompressedSqliteDict(COMPANIES_DB_FILE, tablename='companies', flag=flag, autocommit=autocommit)
    return pdb
