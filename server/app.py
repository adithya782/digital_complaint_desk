import uuid
import math
import pickle
import os
from flask import Flask, Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, timedelta, datetime, timezone
from flask_restful import Api, reqparse, marshal_with, fields, Resource
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity, JWTManager
from flask_cors import CORS
from models import db, User, Complaint, Resolution, Staff, Department, UserRole, Transaction, Office, office_department, ComplaintEvent
from dotenv import load_dotenv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pathlib import Path
from supabase import Client, create_client
from sqlalchemy import func
# from tasks import ai_training
from flask_migrate import Migrate
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import joinedload
import secrets 

# LOGGING
import logging
import sys

# Configure logging to write to stdout
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)
############################################


# env_path = Path(__file__).resolve().parent / '.env'
# load_dotenv(dotenv_path=env_path)
load_dotenv()

app = Flask(__name__)

prod_url = os.environ.get('DATABASE_URL')
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")

# Initialize your storage client using the environment variables
supabase_storage: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

if prod_url:
    # Handle SQLAlchemy syntax requirements for production strings
    if prod_url.startswith("postgres://"):
        prod_url = prod_url.replace("postgres://", "postgresql://", 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = prod_url
else:
    # Use the local configurations loaded by python-dotenv
    user = os.environ.get('DB_USER')
    password = os.environ.get('DB_PASSWORD')
    host = os.environ.get('DB_HOST')
    port = os.environ.get('DB_PORT')
    name = os.environ.get('DB_NAME')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = f'postgresql://{user}:{password}@{host}:{port}/{name}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
app.secret_key = os.environ.get('SECRET_KEY')  
db.init_app(app)
CORS(app, resources={r"/*": {"origins": [r"http://.*", r"https://.*"]}}, supports_credentials=True)
jwt = JWTManager(app)
api = Api(app)
migrate = Migrate(app,db)
auth_bp = Blueprint('auth', __name__)


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, ngrok-skip-browser-warning'
        }
        return '', 200, headers

@auth_bp.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json() or {}
    token = data.get('id_token')
    if not token:
        return jsonify({'error': 'Missing Google ID token'}), 400
    try:
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        id_info = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        '''
        Uncomment the above lines and comment the mock oauth part below during actual production!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
        '''
        # ---- MOCK OAUTH FOR LOCAL POSTMAN TESTING ----
        # if token.startswith("mock_google_token_"):
        #     # Simulate what Google normally sends back after verification
        #     mock_id = token.replace("mock_google_token_", "")
        #     id_info = {
        #         'sub': f'google_sub_{mock_id}',
        #         'email': f'mockuser_{mock_id}@gmail.com',
        #         'name': f'Mock User {mock_id.capitalize()}'
        #     }
        # else:
        #     # Fall back to real verification when you link Google Cloud Console
        #     client_id = os.environ.get('GOOGLE_CLIENT_ID')
        #     id_info = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        # ----------------------------------------------

        google_id = id_info.get('sub')
        email = id_info.get('email').lower()
        full_name = id_info.get('name')
        
        user = User.query.filter((User.google_id==google_id) | (User.email == email)).first()
        
        if not user:
            user = User(fullname = full_name, email = email, google_id = google_id, auth_provider = 'google', role=UserRole.USER.value)
            # Password: None, phone -> null as of now, will be updated later
            db.session.add(user)
            db.session.commit()
        
        access_token = create_access_token(identity=str(user.user_id), additional_claims={'role': user.role})
        
        if not user.phone:
            return jsonify({
                'message': 'Google Authentication Successful',
                'registration_incomplete': True,
                'access_token': access_token,
                'email': user.email
                            }), 200
        
        return jsonify({
            'message': 'Login Successful',
            'registration_incomplete': False,
            'access_token': access_token,
            'user': {
                'id': user.user_id,
                'email': user.email,
                'phone': user.phone,
                'fullname': user.fullname,
                'role': user.role
            }
        }),200

    except ValueError:
        return jsonify({'error': 'Invalid or expired Google Token'}), 401
    except Exception as e:
        return jsonify({'error': f'Internal Server Error: {str(e)}'}), 500

@auth_bp.route('/api/auth/google/complete-profile', methods=['POST'])
@jwt_required()
def complete_profile():
    profile_parser = reqparse.RequestParser()
    profile_parser.add_argument(
        'phone_number', 
        type=str, 
        required=True, 
        help='Phone number is required and cannot be blank'
    )
    profile_parser.add_argument(
        'password', 
        type=str, 
        required=True, 
        help='Phone number is required and cannot be blank'
    )
    args = profile_parser.parse_args()
    phone_number = args['phone_number'].strip()
    password = generate_password_hash(args['password'].strip())
    try:
        user_id = get_jwt_identity()
        user = db.session.get(User,int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user.phone = phone_number
        user.password = password
        db.session.commit()
        return jsonify({
            'success': 'Profile completed successfully!',
            'user': {
                'id': user.user_id,
                'email': user.email,
                'fullname': user.fullname,
                'phone_number': user.phone,
                'role': user.role
                }
        }), 200
    except (ValueError, TypeError):
        return jsonify({'error':'Invalid Token Identity structure'}),422

@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    parser = reqparse.RequestParser()
    parser.add_argument('email', required = True, help='Please enter email')
    parser.add_argument('password', required = True, help='Please enter Password')
    data = parser.parse_args()
    email = data['email'].strip().lower()
    password = data['password']

    user = User.query.filter_by(email=email).first()
    

    if not user :
        return jsonify({'error':'User not found, please register'}),404
    

    # if user.auth_provider == 'google':
    #     return jsonify({'message': "Seems you've registered through google signin, please sign-in using google"}), 400

    if check_password_hash(user.password,password):
        access_token = create_access_token(identity=str(user.user_id), additional_claims={'role': user.role})
        if user.role == UserRole.STAFF.value:
            if user.staff:
                return jsonify({'success': 'Login Successful', 'access_token': access_token, 'role': 'staff', 'staff_id': user.staff.staff_id}),200
            else:
                return jsonify({'error': 'Staff profile missing for this account'}), 404 
        if user.role == UserRole.ADMIN.value:
            return jsonify({'success': 'Login successful', 'access_token': access_token, 'role': 'admin'}),200
        return jsonify({'success': 'Login Successful', 'access_token': access_token, 'role': 'user'}),200
    return jsonify({'error': 'incorrect password!'}), 400

@auth_bp.route('/api/auth/register', methods=['POST'])
def register():
    parser = reqparse.RequestParser()
    parser.add_argument('fullname', required=True)
    parser.add_argument('email', required=True)
    parser.add_argument('password', required=True)
    parser.add_argument('phone', required=True)
    data = parser.parse_args()
    fullname = data['fullname']
    email = data['email'].strip().lower()
    password = generate_password_hash(data['password'])
    phone = data['phone'].strip()
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({'error': 'user with the same email already exists'}), 409
    user = User(fullname=fullname, email=email, password = password, phone=phone,auth_provider='manual', role=UserRole.USER.value)
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': 'registration successful'}),200

@auth_bp.route('/api/auth/register_staff', methods=['POST'])
@jwt_required()
def register_staff():
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if not identity:
        return jsonify({"Unauthorized": 'Please login first'}), 401
    if role != UserRole.ADMIN.value:
        return jsonify({"Forbidden": 'Only Admins can create staff'}), 403
    
    admin_user = db.session.get(User,int(identity))
    if admin_user.role != UserRole.ADMIN.value:
        return jsonify({"Forbidden": 'Only Admins can create staff'}), 403
    
    parser = reqparse.RequestParser()
    parser.add_argument('fullname', required=True, help='Fullname is required')
    parser.add_argument('email', required=True, help='Email is required')
    parser.add_argument('password', required=True, help='Password is required')
    parser.add_argument('phone', required=True, help='Phone is required')
    parser.add_argument('department_id', type=int, required=True, help='Department ID is required')
    parser.add_argument('office_id', type=int, required=True, help='Office ID is required')
    parser.add_argument('confirm_upgrade', type=bool, default=False)
    data = parser.parse_args()

    existing_user = User.query.filter_by(email=data['email'].strip().lower()).first()
    if existing_user:
        # return jsonify({'error': 'An account with this email already exists'}), 409
        if existing_user.role == UserRole.STAFF.value:
            return jsonify({'error': 'A staff account with this email exists already'}), 409
        if existing_user.role == UserRole.ADMIN.value:
            return jsonify({'error': 'Cannot downgrade an existing Administrator to Staff.'}), 409
        
        if not data['confirm_upgrade']:
            return jsonify({
                'requires_confirmation': True,
                'message': f"'{existing_user.fullname}' already has a basic user account. Do you want to upgrade them to Staff?"
            }), 200
        
        try:
            existing_user.role=UserRole.STAFF.value
            staff_record = Staff.query.filter_by(user_id=existing_user.user_id).first()
            
            if staff_record:
                # If they exist, just update their details
                staff_record.department_id = data['department_id']
                staff_record.office_id = data['office_id']
            else:
                # If they don't have a record, create a new one
                new_staff = Staff(
                    user_id=existing_user.user_id,
                    department_id=data['department_id'],
                    office_id=data['office_id']
                )
                db.session.add(new_staff)
            db.session.commit()
            return jsonify({'success':True, 'message': f"Existing user '{existing_user.fullname}' has been successfully upgraded to Staff."}),200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to upgrade user profile: {str(e)}'}), 500
    
    try:
        new_user = User(
            fullname=data['fullname'].strip(),
            email=data['email'].strip().lower(),
            password=generate_password_hash(data['password']),
            phone=data['phone'].strip(),
            auth_provider='manual',
            role=UserRole.STAFF.value
        )
        db.session.add(new_user)
        db.session.flush() # Flushes record to grab the new primary key ID

        new_staff = Staff(
            user_id=new_user.user_id,
            department_id=data['department_id'],
            office_id=data['office_id']
        )
        db.session.add(new_staff)
        db.session.commit()

        return jsonify({'success': True, 'message': 'New staff account provisioned successfully.'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database creation failed: {str(e)}'}), 500

@auth_bp.route('/api/auth/register_admin', methods=['POST'])
@jwt_required()
def register_admin():
    identity = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    if identity is None:
        return jsonify({"error": 'Please login first'}), 401
    if role != UserRole.ADMIN.value:
        return jsonify({"error": 'Only Admins can create other admins'}), 403
    
    try:
        admin_user = db.session.get(User,int(identity))
        if admin_user.role != UserRole.ADMIN.value:
            return jsonify({"error": 'Only Admins can create other admins'}), 403
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid admin token identity'}), 422
    parser = reqparse.RequestParser()
    parser.add_argument('fullname')
    parser.add_argument('email')
    parser.add_argument('password')
    parser.add_argument('phone')
    

    parser.add_argument('confirm_upgrade', type=bool,default=False)
    data = parser.parse_args()

    existing_user = User.query.filter_by(email=data['email'].strip().lower()).first()
    if existing_user:
        # return jsonify({'error': 'An account with this email already exists'}), 409
        if existing_user.role == UserRole.ADMIN.value:
            return jsonify({'error': 'An admin account with this email exists already'}), 409
        
        if not data['confirm_upgrade']:
            return jsonify({
                'requires_confirmation': True,
                'message': f"'{existing_user.fullname}' already has a basic user account. Do you want to upgrade them to admin?"
            }), 200
        
        try:
            existing_user.role=UserRole.ADMIN.value
            db.session.commit()
            return jsonify({'success':True, 'message': f"Existing user '{existing_user.fullname}' has been successfully upgraded to Admin."}),200
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': f'Failed to upgrade user profile: {str(e)}'}), 500
    
    try:
        new_user = User(
            fullname=data['fullname'].strip(),
            email=data['email'].strip().lower(),
            password=generate_password_hash(data['password']),
            phone=data['phone'].strip(),
            auth_provider='manual',
            role=UserRole.ADMIN.value
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'success': True, 'message': 'New admin account provisioned successfully.'}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Database creation failed: {str(e)}'}), 500
    
# UPLOAD IMAGES TO SUPABASE STORAGE
# @app.route('/submit-complaint', methods=['POST'])
def handle_upload():
    # 1. Flask grabs the temporary file object from the HTML form
    file_obj = request.files['complaint_image']
    
    if file_obj:
        # 2. Flask reads the file directly into raw binary bytes
        file_bytes = file_obj.read()
        filename = file_obj.filename
        mime_type = file_obj.content_type  # e.g., 'image/jpeg'
        
        # 3. Flask hands the bytes off to the Supabase Client
        response = supabase_storage.storage.from_('Compliant-evidence').upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": mime_type}
        )
        return "File uploaded successfully straight from memory!"    

class user_dashboard(Resource):
    @jwt_required()
    def get(self):
        id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')
        if not id:
            return {"Unauthorized": 'Please login first'}, 401
        # if role != UserRole.USER.value:
        #     return {"Forbidden": 'Only common users can access this page'}, 403
        
        user = db.session.get(User,id)
        user_complaints = []
        for complaint in user.complaints:
            user_complaints.append({'complaint_id': complaint.complaint_id,'title': complaint.title, 'description': complaint.description, 'status': complaint.status, 'created_at': complaint.created_at.isoformat() if complaint.created_at else None, 'updated_at': complaint.updated_at.isoformat() if complaint.updated_at else None})
        return {'user_id': user.user_id, 'fullname': user.fullname, 'complaints': user_complaints, 'phone': user.phone},200


'''HAVERSINE FORMULA - To calculate distance between 2 GPS coordinates'''
def distance_calculate(lat1,long1,lat2,long2):
    R = 6371.0
    d_lat = math.radians(lat2-lat1)
    d_long = math.radians(long2-long1)
    a = (math.sin(d_lat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(d_long/2)**2)
    c = 2*math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

class ProcessAndDispatchComplaint(Resource):
    @jwt_required()
    def post(self):
        title = request.form.get('title')
        description = request.form.get('description')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        # Handle boolean conversion from form string
        anonymous = request.form.get('isAnonymous') == 'true'
        
        evidence_file = request.files.get('evidence')
        evidence_url = None

        user_id = get_jwt_identity()
        if not title or not description or not latitude or not longitude:
            return {"message": "Missing required fields: title, description, location"}, 400
        
        if evidence_file:
            try:
                ext = evidence_file.filename.split('.')[-1]
                unique_filename = f"{uuid.uuid4()}.{ext}"

                supabase_storage.storage.from_('Compliant-evidence').upload(
                    path=unique_filename,
                    file=evidence_file.read(),
                    file_options={"content-type": evidence_file.content_type}
                )
                evidence_url = supabase_storage.storage.from_('Compliant-evidence').get_public_url(unique_filename)
            except Exception as e:
                return {'message': f"File upload failed: {str(e)}"},500
        else:
            evidence_url = None
        
        c_lat, c_lon = float(latitude), float(longitude)

        try:
            with open('complaint_classifier.pkl', 'rb') as f:
                model_pipeline = pickle.load(f)
            predicted_dept_name = model_pipeline.predict([description])[0]
        except Exception:
            predicted_dept_name = "Law, Order & Public Safety" # Or handle as None
            
        dept = Department.query.filter_by(department_name=predicted_dept_name).first()

        new_complaint = Complaint(
            title=title, description=description, department_id=dept.department_id if dept else None,
            latitude=c_lat, longitude=c_lon, user_id=None if anonymous else user_id,
            staff_id=None,  # Explicitly None
            is_verified=False, # Explicitly False
            key = secrets.token_hex(3).upper() if anonymous else None,
            evidence_url=evidence_url
        )
        db.session.add(new_complaint)
        db.session.commit()
        return {'message': 'Submitted, awaiting admin verification.', 'id': new_complaint.complaint_id}, 201
        


class staff_dashboard(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')
        if role != UserRole.STAFF.value:
            return {"Unauthorized": 'No access'}, 403
        user = db.session.get(User, user_id)
        staff = user.staff
        complaints = Complaint.query.filter(Complaint.staff_id==staff.staff_id, Complaint.status !='Resolved').all()
        now = datetime.now(timezone.utc)
        scored_complaints = []
        for complaint in complaints:
            priority_weight = 2.0  
            if complaint.priority == 'Critical' or "Emergency" in complaint.title.lower():
                score = 5000.0
            elif complaint.priority == 'High':
                priority_weight = 4.0
            elif complaint.priority == 'Low':
                priority_weight = 1.0
                
            if complaint.deadline:
                deadline_utc = complaint.deadline.replace(tzinfo=timezone.utc)
                time_delta = deadline_utc - now
                days_left = time_delta.total_seconds() / 86400.0
            else:
                days_left = 7.0  
                
            if days_left <= 0:
                score = 1000.0 + abs(days_left) * 10
            else:
                score = priority_weight / max(days_left, 0.1)
                
            scored_complaints.append({
                'complaint_id': complaint.complaint_id,
                'title': complaint.title,
                'description': complaint.description,
                'status': complaint.status,
                'priority': complaint.priority,
                'deadline': complaint.deadline.isoformat() if complaint.deadline else None,
                'days_remaining': round(days_left, 1),
                'calculated_score': score
            })
        scored_complaints.sort(key=lambda x: x['calculated_score'], reverse=True)
        DAILY_CAPACITY = 5
        todays_slot = scored_complaints[:DAILY_CAPACITY]
        tomorrows_slot = scored_complaints[DAILY_CAPACITY:DAILY_CAPACITY*2]
        future_backlog = scored_complaints[DAILY_CAPACITY*2:]
        return {
            'fullname': user.fullname,
            'staff_id': staff.staff_id,
            'department': staff.department.department_name,
            'workload_summary': {
                'total_active_issues': len(scored_complaints),
                'daily_capacity_limit': DAILY_CAPACITY
            },
            'slots': {
                'todays_focus_slot': todays_slot,
                'tomorrows_slot': tomorrows_slot,
                'future_backlog_slot': future_backlog
            }
        }, 200
    
class createDepartment(Resource):
    def get(self):
        departments = Department.query.order_by(Department.department_id.asc()).all()
        data = []
        for department in departments:
            data.append({
                'department_id': department.department_id,
                'department_name': department.department_name
            })
        return {'message': 'success','departments': data}, 200
    @jwt_required()
    def post(self):
        user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')
        if role != UserRole.ADMIN.value:
            return {"error": 'You cant access this page'}, 403

        parser = reqparse.RequestParser()
        parser.add_argument('department_name', required=True)
        data = parser.parse_args()
        department_name = data.get('department_name')
        departments = Department.query.all()
        dept_names = [dept.department_name.lower() for dept in departments]
        if department_name.lower() in dept_names:
            return {'error': 'Department already exists'},409

        new_dept = Department(department_name=department_name)
        db.session.add(new_dept)
        db.session.commit()
        return {'mesage': 'New department created successfully'}, 200
        
class DeleteDepartment(Resource):
    @jwt_required()
    def delete(self, id):
        # 1. Verify Admin access
        claims = get_jwt()
        if claims.get('role') !=UserRole.ADMIN.value:
            return {"error": "Unauthorized"}, 403
            
        # 2. Query the department
        dept = db.session.get(Department, id)
        if not dept:
            return {"error": "Department not found"}, 404
            
        # 3. Attempt to delete
        try:
            db.session.delete(dept)
            db.session.commit()
            return {'message': 'Department deleted successfully'}, 200
        except IntegrityError:
            # This triggers if 'RESTRICT' constraint blocks the deletion
            db.session.rollback()
            return {
                'error': 'Cannot delete: This department has staff members assigned to it. Please reassign them first.'
            }, 409

class createOffice(Resource):
    def get(self):
        offices = Office.query.order_by(Office.office_id.asc()).all()
        data = []
        for office in offices:
            data.append({
                'office_id': office.office_id,
                'office_name': office.office_name,
                'latitude': office.latitude,
                'longitude': office.longitude,
                'departments': [{'department_name': d.department_name} for d in office.departments]
            })
        return {'message': 'success','offices': data}, 200

    @jwt_required()
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('name', required=True)
        parser.add_argument('latitude', type=float, required=True)
        parser.add_argument('longitude', type=float, required=True)
        parser.add_argument('department_ids', type=int, action='append', required=True)
        data = parser.parse_args()

        claims = get_jwt()
        if claims.get('role') != 'admin':
            return {"error": "Unauthorized"}, 403
        offices = Office.query.all()
        office_names = [office.office_name.lower() for office in offices]
        if data['name'].lower() in office_names:
            return {'error': 'Office already exists'},409

        new_office = Office(
            office_name=data['name'],
            latitude=data['latitude'],
            longitude=data['longitude']
        )

        
        departments = Department.query.filter(Department.department_id.in_(data['department_ids'])).all()
    
        new_office.departments = departments

        db.session.add(new_office)
        db.session.commit()

        return {'message': 'Office created successfully!'}, 201

class FilteredOffices(Resource):
    @jwt_required()
    def get(self):
        dept_id = request.args.get('department_id')
        # Query offices that have the specific department
        offices = Office.query.join(Office.departments).filter(Department.department_id == dept_id).all()
        
        data = [{
            'id': o.office_id,
            'name': o.office_name,
            'latitude': o.latitude,
            'longitude': o.longitude
        } for o in offices]
        
        return {'offices': data}, 200

def assign_staff_to_complaint(complaint_id, dept_id, lat, lon):
    """Utility to assign the closest office and least-busy staff member."""
    # 1. Find Closest Office
    matching_offices = Office.query.join(
        office_department, Office.office_id == office_department.c.office_id
    ).filter(office_department.c.department_id == dept_id).all()

    assigned_office = None
    closest_dist = float('inf')
    
    # Assuming a simple distance_calculate function exists
    for office in matching_offices:
        dist = distance_calculate(lat, lon, office.latitude, office.longitude)
        if dist < closest_dist:
            closest_dist = dist
            assigned_office = office
            
    if not assigned_office:
        return False, "No office found"

    # 2. Find Available Staff with minimum load
    available_staff = Staff.query.filter_by(office_id=assigned_office.office_id, department_id=dept_id).all()
    assigned_official = None
    min_load = float('inf')
    today = datetime.now(timezone.utc).date()

    for staff in available_staff:
        load = Complaint.query.filter(
            Complaint.staff_id == staff.staff_id, 
            Complaint.status != 'Resolved', 
            func.date(Complaint.created_at) == today
        ).count()
        if load <= min_load:
            min_load = load
            assigned_official = staff
            
    # 3. Update the database
    if assigned_official:
        complaint = db.session.get(Complaint, complaint_id)
        complaint.staff_id = assigned_official.staff_id
        db.session.commit()
        return True, assigned_official.user.fullname
    return False, "No staff available"

class verify_complaint(Resource):
    @jwt_required()
    def post(self):
        admin_id = get_jwt_identity()
        claims = get_jwt()
        if claims.get('role') != UserRole.ADMIN.value:
            return {'error': 'You are not allowed to access this page'}, 403
        parser = reqparse.RequestParser()
        parser.add_argument('complaint_id', required=True)
        # parser.add_argument('predicted_dept_id', required=True)
        parser.add_argument('actual_dept_id', required=True)
        data = parser.parse_args()
        complaint_id = int(data.get('complaint_id'))
        # predicted_dept_id = data.get('predicted_dept_id')
        actual_dept_id = int(data.get('actual_dept_id'))

        complaint = db.session.get(Complaint, int(complaint_id))
        if not complaint:
            return {'message': 'Complaint not found'}, 404

        complaint.department_id = int(actual_dept_id)
        complaint.is_verified = True 

        # Handle the assignment attempt
        success, info = assign_staff_to_complaint(
            complaint.complaint_id, 
            complaint.department_id, 
            complaint.latitude, 
            complaint.longitude
        )

        if not success:
            # Instead of failing, you could still commit the verification 
            # but warn the admin about the assignment
            db.session.commit()
            return {'message': f'Verified, but assignment failed: {info}'}, 200

        db.session.commit()
        assignment_event = ComplaintEvent(
            complaint_id=complaint.complaint_id,
            description=f"Complaint assigned to staff member: {info}",
        )
        db.session.add(assignment_event)
        db.session.commit()
        return {'message': f'Verified! Assignment status: {info}'}, 200
    
    @jwt_required()
    def get(self):
        admin_id = get_jwt_identity()
        claims = get_jwt()
        if claims.get('role') != UserRole.ADMIN.value:
            return {'error': 'You are not allowed to access this page'}, 403
        
        complaints = Complaint.query.all()
        list_departments = Department.query.all()
        unverified_complaints = [{"complaint_id": complaint.complaint_id,"title":complaint.title, "description":complaint.description, "department_id": complaint.department_id} for complaint in complaints if not complaint.is_verified]
        all_complaints = [{'complaint_id': complaint.complaint_id,"title":complaint.title, "description":complaint.description, "department_id": complaint.department_id,'is_verified': complaint.is_verified} for complaint in complaints]
        departments = [{'department_id': department.department_id, 'department_name': department.department_name} for department in list_departments]
    
        # ai_training.delay()

        return {'message': 'Success', 'pending': unverified_complaints, 'all_complaints': all_complaints, 'departments': departments}, 200
    

class DeactivateStaff(Resource):
    @jwt_required()
    def get(self):
        # 1. Verification
        if get_jwt().get('role') != UserRole.ADMIN.value:
            return {'error': 'Unauthorized'}, 403
            
        staffs = Staff.query.filter(Staff.user.has(role=UserRole.STAFF.value)).all()
        if not staffs:
            return {'message': 'Staff not found'}, 404
        
        data = []
        for staff in staffs:
            data.append({'staff_id':staff.staff_id, 'staff_name': staff.user.fullname, 'department_id': staff.department_id})
        list_departments = Department.query.all()
        departments = [{'department_id': department.department_id, 'department_name': department.department_name} for department in list_departments]
        
        return {'message': 'success', 'staffs': data, 'departments':departments}, 200
    @jwt_required()
    def post(self, staff_id):
        # 1. Verification
        staff_id = int(staff_id)
        if get_jwt().get('role') != UserRole.ADMIN.value:
            return {'error': 'Unauthorized'}, 403
            
        staff = db.session.get(Staff, staff_id) # Or User, depending on your model
        if not staff:
            return {'message': 'Staff not found'}, 404
            
        # 2. Revert the role
        staff.user.role = UserRole.USER.value 
        db.session.commit()
        
        return {'message': 'Staff successfully downgraded to regular user'}, 200
    
class DeleteOffice(Resource):
    @jwt_required()
    def delete(self, id):
        # 1. Verify Admin access
        claims = get_jwt()
        if claims.get('role') != UserRole.ADMIN.value:
            return {"error": "Unauthorized"}, 403
            
        # 2. Query the department
        office = db.session.get(Office,id)
        if not office:
            return {"error": "Office not found"}, 404
            
        # 3. Attempt to delete
        try:
            db.session.delete(office)
            db.session.commit()
            return {'message': 'Office deleted successfully'}, 200
        except IntegrityError:
            # This triggers if 'RESTRICT' constraint blocks the deletion
            db.session.rollback()
            return {
                'error': 'Cannot delete: This Office has staff members assigned to it. Please reassign them first.'
            }, 409

class Specific_Complaints(Resource):
    @jwt_required()
    def get(self,id):
        user_id = get_jwt_identity()
        if not user_id:
            return {"message": "Missing or invalid token"}, 401
        claims = get_jwt()
        role = claims.get('role')
        # if role != UserRole.STAFF.value:
        #     return {"Unauthorized": 'No access'}, 403
        complaint = db.session.get(Complaint, id)
        if not complaint:
            return {"message": "Complaint not found"}, 404
        parser = reqparse.RequestParser()
        if role == UserRole.USER.value:
            if not complaint.user_id:
                parser.add_argument('key', required=True)
                data = parser.parse_args()
                if data['key'] != complaint.key:
                    return {"Incorrect KEY": 'No access'}, 403
            if user_id != complaint.user.user_id:
                return {"Unauthorized": 'No access'}, 403
        elif role == UserRole.STAFF.value:
            print(f"DEBUG: Checking Staff Auth. Token User ID: {user_id}")
            if not complaint.staff:
                print("DEBUG: Complaint has no staff assigned.")
                return {"message": "Complaint not assigned to any staff"}, 403
            staff_user_id = getattr(complaint.staff, 'user_id', None)
            if user_id != complaint.staff.user.user_id:
                print(f"DEBUG: Mismatch! Token ID {user_id} vs Staff User ID {staff_user_id}")
                return {"Unauthorized": 'No access'}, 403
        else:
            return {"Unauthorized": 'No access'}, 403
        if not complaint:
            return {"message": "Complaint not found"}, 404
        data = [{
            'title':complaint.title,
            'description': complaint.description,
            'latitude': complaint.latitude,
            'longitude': complaint.longitude,
            'evidence_url': complaint.evidence_url,
            'anonymous': True if not complaint.user_id else False,
            'status': complaint.status
        }]
        
        return data, 200
    
    def put(self, id):
        data = request.get_json()
        is_final = data.get('is_final', False)
        complaint = db.session.get(Complaint, id)
        
        # 1. Update the main status
        complaint.status = data.get('status')
        
        # 2. Always log the event (for history/audit)
        new_event = ComplaintEvent(
            complaint_id=id,
            description=data.get('description'),
            staff_id=get_jwt_identity() # Ensure this grabs the current staff
        )
        db.session.add(new_event)
        
        # 3. ONLY create a Resolution if it's the final step
        if is_final:
            res = Resolution(
                complaint_id=id,
                action_taken=data.get('description'),
                staff_id=get_jwt_identity()
            )
            db.session.add(res)
            
        db.session.commit()
        return {"message": "Success"}, 200

class Track(Resource):
    @jwt_required()
    def get(self, complaint_id):
        complaint = Complaint.query.get_or_404(complaint_id)
        current_user_id = get_jwt_identity()
        claims = get_jwt() if current_user_id else {}
        role = claims.get('role')

        # SECURITY CHECK
        is_owner = (
    current_user_id is not None and 
    complaint.user_id is not None and 
    int(complaint.user_id) == int(current_user_id)
)
        is_staff = (
    role == UserRole.STAFF.value and 
    (
        not complaint.staff or 
        (complaint.staff.staff_id is not None and int(complaint.staff.staff_id) == int(current_user_id))
    )
)
        # logger.info(f"Current user ID: {current_user_id}")
        # logger.info(f"Complaint's user ID: {complaint.user_id}")
        # logger.error(f"Failed to access complaint {complaint_id}")
        
        # Check if they have permission
        if not (is_owner or is_staff):
            # If they aren't the owner/staff, check for the tracking key
            key = request.args.get('key')
            if not complaint.user_id and key == complaint.key:
                pass # Authorized via Key
            else:
                return {"message": "Forbidden", "requires_key": (complaint.user_id is None)}, 403
        # 1. Build the timeline (your existing logic)
        timeline = []
        timeline.append({"step": "Filed", "date": complaint.created_at.strftime('%Y-%m-%d %H:%M'), "note": "Complaint submitted by user"})
        
        for event in sorted(complaint.events, key=lambda x: x.timestamp):
            timeline.append({"step": "Progress", "date": event.timestamp.strftime('%Y-%m-%d %H:%M'), "note": event.description})
            
        if complaint.resolution:
            timeline.append({"step": "Resolved", "date": complaint.resolution.resolved_at.strftime('%Y-%m-%d %H:%M'), "note": f"Action taken: {complaint.resolution.action_taken}"})
        
        # 2. Return a dictionary containing BOTH metadata and timeline
        return {
            "title": complaint.title,
            "status": complaint.status,
            "timeline": timeline
        }, 200

app.register_blueprint(auth_bp)
    
api.add_resource(Track, '/api/complaint/timeline/<int:complaint_id>')
api.add_resource(user_dashboard, '/api/user/dashboard')
api.add_resource(staff_dashboard, '/api/staff/dashboard')
api.add_resource(ProcessAndDispatchComplaint, '/api/user/complaint')
api.add_resource(createDepartment, '/api/department/create')
api.add_resource(DeleteDepartment, '/api/department/delete/<int:id>')
api.add_resource(DeleteOffice, '/api/office/delete/<int:id>')
api.add_resource(createOffice, '/api/office/create')
api.add_resource(FilteredOffices, '/api/offices')
api.add_resource(verify_complaint, '/api/admin/verify_complaint')
api.add_resource(DeactivateStaff, '/api/admin/delete_staff/<int:staff_id>', '/api/admin/delete_staff')
api.add_resource(Specific_Complaints, '/api/complaints/<int:id>')

if __name__ == '__main__':
    with app.app_context():
        # db.drop_all()
        # print('Dropped')
        # db.create_all()
        # print('Database Created')
        # admin = User(fullname=os.environ.get('ADMIN_NAME'), email=os.environ.get('ADMIN_EMAIL'), password=generate_password_hash(os.environ.get('ADMIN_PASSWORD')), auth_provider='manual', role=UserRole.ADMIN.value, phone=os.environ.get('ADMIN_PHONE') )
        # db.session.add(admin)
        # db.session.commit()
        pass
    app.run(debug=True)