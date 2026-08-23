import os
from neo4j import GraphDatabase
import psycopg2.pool
from contextlib import contextmanager
from dotenv import load_dotenv
load_dotenv()

class Neo4jConnection:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.user = os.getenv("NEO4J_USERNAME")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.db_name = os.getenv("NEO4J_DATABASE") 
        
        self.driver = GraphDatabase.driver(
            self.uri, 
            auth=(self.user, self.password)
        )

    def close(self):
        self.driver.close()
        
    @contextmanager
    def get_session(self):
        session = self.driver.session(database=self.db_name)
        try:
            yield session
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

    def close(self):
        self.pool.closeall()

pg_db = PostgresPool()