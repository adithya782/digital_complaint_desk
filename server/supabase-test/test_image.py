import os
from mimetypes import guess_type
from dotenv import load_dotenv
from supabase import create_client, Client, StorageException

load_dotenv()

URL = os.environ.get("SUPABASE_URL")
KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(URL, KEY)

IMAGE_PATH = "sample.jpg"  # Ensure this file exists in your folder!
REMOTE_FILENAME = "complaint_evidence_image.jpg"

print(f"Connecting to URL: {URL}")

if not os.path.exists(IMAGE_PATH):
    print(f"❌ Error: Please place a file named '{IMAGE_PATH}' in this folder first!")
    exit()

try:
    print(f"Reading '{IMAGE_PATH}' binary data...")
    with open(IMAGE_PATH, "rb") as f:
        file_bytes = f.read()

    # Automatically determine content-type (e.g., image/jpeg or image/png)
    mime_type, _ = guess_type(IMAGE_PATH)
    mime_type = mime_type or "image/jpeg"

    print("Attempting image upload...")
    response = supabase.storage.from_('Compliant-evidence').upload(
        path=REMOTE_FILENAME,
        file=file_bytes,
        file_options={"content-type": mime_type}
    )
    print(f"✅ Success! Image uploaded cleanly as '{REMOTE_FILENAME}'.")

except StorageException as e:
    print(f"❌ Storage specific error: {e}")
except Exception as e:
    print(f"❌ General error: {e}")