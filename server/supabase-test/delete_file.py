import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(URL, KEY)

def delete_evidence_file(filename: str):
    try:
        print(f"🗑️ Attempting to remove: {filename}...")
        
        # .remove() requires a list of paths, even for a single file
        response = supabase.storage.from_('Compliant-evidence').remove([filename])
        
        # If successful, the response contains a list of successfully deleted file details
        if response:
            print(f"✅ Success! Removed file info: {response}")
        else:
            print(f"⚠️ File might not have existed, but no error was thrown.")
            
    except Exception as e:
        print(f"❌ Failed to delete file: {e}")

# Test the function
delete_evidence_file("test_upload.txt")