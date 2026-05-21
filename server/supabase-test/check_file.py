import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Connect using your correct API URL
URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(URL, KEY)

FILENAME_TO_CHECK = "test_upload.txt"

try:
    # 1. List all files in the root of the bucket
    files = supabase.storage.from_('Compliant-evidence').list()
    
    # 2. Extract just the names of the files
    file_names = [f['name'] for f in files]
    
    # 3. Check if our target file is in that list
    if FILENAME_TO_CHECK in file_names:
        print(f"🔍 Result: Found it! '{FILENAME_TO_CHECK}' still exists in the bucket.")
    else:
        print(f"🗑️ Result: Confirmed! '{FILENAME_TO_CHECK}' does NOT exist in the bucket.")
        
except Exception as e:
    print(f"❌ Failed to inspect bucket: {e}")