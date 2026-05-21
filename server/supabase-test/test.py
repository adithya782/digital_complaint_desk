import os
from dotenv import load_dotenv
from supabase import create_client, Client, StorageException

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_ANON_KEY")

print(f"Connecting to URL: {url}")
supabase: Client = create_client(url, key)

try:
    print("Attempting upload...")
    # Trying a direct simple file upload to root of bucket
    response = supabase.storage.from_('Compliant-evidence').upload(
        path="test_upload.txt",
        file=b"Hello World",
        file_options={"content-type": "text/plain"}
    )
    print("✅ Success!")
except StorageException as e:
    print(f"❌ Storage specific error: {e}")
except Exception as e:
    print(f"❌ General error: {e}")