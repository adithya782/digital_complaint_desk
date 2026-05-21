- This folder contains required code for running the backend server
- All the required python modules are in the 'requirements.txt'
- Make sure you're in the virtual environment

## SETUP:
Make sure terminal is opened in the `server` directory
- ``python -m venv virtual_env_name``
- ``pip install -r requirements.txt``
- To run the server: `python app.py`

## NOTE:
The files: 
- `test.py` is used to test the upload of files in supabase's storage
- `check_file.py` is used to test the presence of file in supabase's storage
- `delete_file.py` is used to test the deletion of file in supabase's storage
- `test_image.py` is used to test uploading image into supabase's storage
- `hi.py` is a sample python backend server to mediate transfer of files (images especially) between the html `index.html` and the supabase storagae
### To test:
- `python -m venv virtual_env_name`
- `pip install -r requirements.txt`
- `python hi.py`
- now open live server 

=> make sure you have .env file for things to work smoothly