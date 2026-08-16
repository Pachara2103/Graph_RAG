import os
from neo4j import GraphDatabase
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

    def get_session(self):
        return self.driver.session(database=self.db_name)

db = Neo4jConnection()