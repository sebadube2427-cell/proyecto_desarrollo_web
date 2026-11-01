
from pymongo import AsyncMongoClient

MONGO_URL = "mongodb://localhost:27017"
NOMBRE_DB = "production"

cliente = AsyncMongoClient(MONGO_URL)
db = cliente[NOMBRE_DB]


def get_db():
    return db


def get_colection(dbase, colection):
    return dbase[colection]
