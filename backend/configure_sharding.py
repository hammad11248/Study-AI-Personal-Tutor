import os
import sys
import logging
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from pathlib import Path
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Load env variables
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "studyai")

def configure_sharding():
    logger.info(f"Connecting to MongoDB at {MONGODB_URI.split('@')[-1]}...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=3000)
    
    try:
        # Check connection
        client.admin.command("ping")
        logger.info("MongoDB connection successful.")
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        sys.exit(1)
        
    db = client[DB_NAME]
    admin_db = client.admin
    
    print("\n=======================================================")
    print("      MongoDB Sharding Configuration Tool")
    print("=======================================================\n")
    
    try:
        # 1. Enable sharding on the database
        logger.info(f"Enabling sharding on database: {DB_NAME}")
        admin_db.command("enableSharding", DB_NAME)
        logger.info(f"[OK] Sharding enabled on database '{DB_NAME}'.")
        
        # 2. Shard the 'sessions' collection by 'user_id'
        logger.info("Indexing 'sessions' collection for shard key 'user_id'...")
        db.sessions.create_index("user_id")
        logger.info("Sharding 'sessions' collection...")
        admin_db.command("shardCollection", f"{DB_NAME}.sessions", key={"user_id": 1})
        logger.info("[OK] 'sessions' collection sharded successfully.")
        
        # 3. Shard the 'messages' collection by 'session_id'
        logger.info("Indexing 'messages' collection for shard key 'session_id'...")
        db.messages.create_index("session_id")
        logger.info("Sharding 'messages' collection...")
        admin_db.command("shardCollection", f"{DB_NAME}.messages", key={"session_id": 1})
        logger.info("[OK] 'messages' collection sharded successfully.")
        
        # 4. Shard the 'quizzes' collection by 'user_id'
        logger.info("Indexing 'quizzes' collection for shard key 'user_id'...")
        db.quizzes.create_index("user_id")
        logger.info("Sharding 'quizzes' collection...")
        admin_db.command("shardCollection", f"{DB_NAME}.quizzes", key={"user_id": 1})
        logger.info("[OK] 'quizzes' collection sharded successfully.")
        
        # 5. Shard the 'flashcards' collection by 'user_id'
        logger.info("Indexing 'flashcards' collection for shard key 'user_id'...")
        db.flashcards.create_index("user_id")
        logger.info("Sharding 'flashcards' collection...")
        admin_db.command("shardCollection", f"{DB_NAME}.flashcards", key={"user_id": 1})
        logger.info("[OK] 'flashcards' collection sharded successfully.")
        
        print("\n=======================================================")
        print("[SUCCESS] All collections successfully indexed and sharded!")
        print("=======================================================\n")
        
    except PyMongoError as e:
        logger.error(f"Sharding command failed: {e}")
        print("\n-------------------------------------------------------")
        print("[NOTE] MongoDB Sharding Information:")
        print("Sharding commands can only be run on a MongoDB Sharded Cluster.")
        print("If you are running a local Standalone (non-clustered) MongoDB instance,")
        print("sharding is not supported by the database engine by default.")
        print("\nTo set up a cluster on Windows for sharding, you need:")
        print("1. Start Config Server replica set: mongod --configsvr ...")
        print("2. Start Shard Replica Sets: mongod --shardsvr ...")
        print("3. Start Mongos Routing service: mongos --configdb <config_repl_set> ...")
        print("4. Add Shards using sh.addShard() command.")
        print("-------------------------------------------------------\n")

if __name__ == "__main__":
    configure_sharding()
