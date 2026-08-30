import os
import ssl
import certifi
from neo4j import GraphDatabase
import psycopg2.pool
from contextlib import contextmanager
from dotenv import load_dotenv
load_dotenv()


def _tls(uri):
    """
    A "+s" URI makes the driver build its own SSL context, which on Windows
    trusts only the roots Windows happens to have cached locally. Aura's
    certificate is issued by SSL.com, and that root is not always there, so the
    handshake fails and the driver reports it as "Unable to retrieve routing
    information" — nothing to do with the credentials.

    Dropping the "+s" and handing over a context built on certifi's bundle
    keeps the connection just as encrypted and verified, only against a trust
    store that ships with the app instead of one that varies per machine.
    """
    if not uri:
        return uri, {}

    scheme, _, rest = uri.partition("://")
    if not scheme.endswith("+s"):
        return uri, {}

    return (
        f"{scheme[:-2]}://{rest}",
        {"ssl_context": ssl.create_default_context(cafile=certifi.where())},
    )

class Neo4jConnection:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.user = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.db_name = os.getenv("NEO4J_DATABASE") 

        uri, tls = _tls(self.uri)

        self.driver = GraphDatabase.driver(
            uri, 
            auth=(self.user, self.password),
            **tls,
            max_connection_pool_size=50,       
            connection_timeout=30.0,         
            max_connection_lifetime=3600.0 
        )

    def close(self):
        self.driver.close()


    @contextmanager
    def get_session(self):
        session = self.driver.session(database=self.db_name)
        tx = session.begin_transaction()
        try:
            yield tx
            tx.commit()  
        except Exception:
            tx.rollback() 
            raise
        finally:
            session.close()


graph_db = Neo4jConnection()


class PostgresPool:
    def __init__(self):
        database_url = os.getenv("DATABASE_PUBLIC_URL")
        self.pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=database_url
        )

    @contextmanager
    def get_cursor(self):
        conn = self.pool.getconn()
        try:
            with conn.cursor() as cursor:
                yield cursor
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self.pool.putconn(conn)
    
    @contextmanager
    def get_connection(self):
        conn = self.pool.getconn()
        try:
            yield conn
        finally:
            self.pool.putconn(conn)

    def close(self):
        self.pool.closeall()

pg_db = PostgresPool()