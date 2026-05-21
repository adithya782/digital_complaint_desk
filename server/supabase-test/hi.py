import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from supabase import create_client, Client
from flask_cors import CORS


# Load environment credentials
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize Supabase Client
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

BUCKET_NAME = "Compliant-evidence"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Helper function to check if file extension is a valid image type."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Renders the HTML submission frontend form page."""
    return render_template('index.html')

@app.route('/submit-complaint', methods=['POST'])
def submit_complaint():
    """Handles frontend file parsing, validates it, and streams it to Supabase."""
    
    # 1. Check if the post request actually contains a file part
    if 'complaint_image' not in request.files:
        return jsonify({"error": "No file part found in form submission"}), 400
        
    file_obj = request.files['complaint_image']
    
    # 2. Check if the user submitted the form without picking a file
    if file_obj.filename == '':
        return jsonify({"error": "No file selected for upload"}), 400
        
    # 3. Validate file extension type
    if not allowed_file(file_obj.filename):
        return jsonify({"error": "Invalid file type. Only standard images are allowed."}), 400

    try:
        # 4. Extract filename and configuration parameters directly out of the file stream
        original_filename = file_obj.filename
        mime_type = file_obj.content_type  # Detects 'image/jpeg', 'image/png' etc.
        
        # 5. Read the file out of temporary server memory into raw binary bytes
        file_bytes = file_obj.read()
        
        print(f"🚀 Streaming '{original_filename}' directly to Supabase...")
        
        # 6. Fire the payload stream over to your configured bucket
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path=original_filename,
            file=file_bytes,
            file_options={"content-type": mime_type}
        )
        
        # 7. Generate a public access URL so you can present it to users/admins later
        public_url_res = supabase.storage.from_(BUCKET_NAME).get_public_url(original_filename)
        clean_url = str(public_url_res)
        
        return jsonify({
            "status": "success",
            "message": "File uploaded perfectly without writing to local server disks!",
            "file_name": original_filename,
            "cdn_url": clean_url
        }), 200

    except Exception as e:
        print(f"❌ Transaction Failure: {e}")
        return jsonify({"error": f"Failed to upload to cloud storage: {str(e)}"}), 500
    
@app.route('/get-vault-links')
def get_vault_links():
    """API endpoint that queries Supabase storage maps and outputs raw JSON catalogs."""
    try:
        files = supabase.storage.from_(BUCKET_NAME).list()
        gallery_items = []
        
        for file_info in files:
            filename = file_info['name']
            if filename == '.emptyFolderPlaceholder':
                continue
                
            public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET_NAME}/{filename}"
            gallery_items.append({
                "name": filename,
                "url": public_url
            })
            
        return jsonify(gallery_items), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)