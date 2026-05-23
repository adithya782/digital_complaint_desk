import math
import pickle
import os
from flask import Flask, Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, timedelta, datetime, timezone
from flask_restful import Api, reqparse, marshal_with, fields, Resource
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity, JWTManager
from flask_cors import CORS
from models import db, User, Complaint, Resolution, Staff, Department, UserRole, Transaction, Office, office_department
from dotenv import load_dotenv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pathlib import Path
from supabase import Client, create_client
from sqlalchemy import func
from tasks import ai_training


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

auth_bp = Blueprint('auth', __name__)

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
        
        if not data['confirm_upgrade']:
            return jsonify({
                'requires_confirmation': True,
                'message': f"'{existing_user.fullname}' already has a basic user account. Do you want to upgrade them to Staff?"
            }), 200
        
        try:
            existing_user.role=UserRole.STAFF.value
            staff = Staff(user_id = existing_user.user_id, department_id = data['department_id'], office_id = data['office_id'])
            db.session.add(staff)
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
        if role != UserRole.USER.value:
            return {"Forbidden": 'Only common users can access this page'}, 403
        
        user = db.session.get(User,id)
        user_complaints = []
        for complaint in user.complaints:
            user_complaints.append({'title': complaint.title, 'description': complaint.description, 'category': complaint.category, 'status': complaint.status, 'created_at': complaint.created_at, 'updated_at': complaint.updated_at})
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
        parser = reqparse.RequestParser()
        parser.add_argument('title', required=True)
        parser.add_argument('description')
        parser.add_argument('latitude')
        parser.add_argument('longitude')
        parser.add_argument('anonymous', type=bool)
        data = parser.parse_args()
        user_id = get_jwt_identity()
        if not data['description'] or data['latitude'] is None or data['longitude'] is None:
            return {"message": "Missing required fields: description, Location"}, 400
        
        c_lat, c_lon = float(data['latitude']), float(data['longitude'])

        try:
            with open('complaint_classifier.pkl', 'rb') as f:
                model_pipeline = pickle.load(f)
            predicted_dept = model_pipeline.predict([data['description']])[0]
        except Exception:
            predicted_dept = "Law, Order & Public Safety"
        
        dept = Department.query.filter_by(department_name = predicted_dept).first()
        if not dept:
            return {"message": f"Department '{predicted_dept}' is missing from database master records."}, 500

        matching_offices = Office.query.join(
            office_department, Office.office_id == office_department.c.office_id
        ).filter(office_department.c.department_id == dept.department_id).all()

        assigned_office =None
        closest_dist = float('inf')

        for office in matching_offices:
            dist = distance_calculate(c_lat, c_lon, office.latitude, office.longitude)
            if dist < closest_dist:
                closest_dist = dist
                assigned_office = office
        if not assigned_office:
            return {"message": f"AI classified as '{predicted_dept}' but no physical office branches handle this sector."}, 422
        
        priority = "Medium"
        deadline_hours = 72

        low_priority_tokens = ["blinking", "flickering", "paint", "fountain", "weed"]
        high_priority_tokens = ["assaulted", "attack", "transformer", "snapped", "blackout", "fight", "weapon"]

        desc_lower = data['description'].lower()
        if any(token in desc_lower for token in high_priority_tokens):
            priority = "High"
            deadline_hours = 24
        elif any(token in desc_lower for token in low_priority_tokens):
            priority = "Low"
            deadline_hours = 168
        
        available_staff = Staff.query.filter_by(office_id=assigned_office.id,department_id=dept.department_id).all()

        assigned_official = None
        min_load = float('inf')
        today_date= datetime.now(timezone.utc).date()

        if available_staff:
            for staff in available_staff:
                load = Complaint.query.filter(Complaint.staff_id == staff.staff_id, Complaint.status != 'Resolved', func.date(Complaint.created_at) == today_date).count()
                if load < min_load:
                    min_load = load 
                    assigned_official = staff 
        if data['anonymous'] == True:
            id = None 
        else:
            id = user_id

        new_complaint = Complaint(
            title=data['title'], 
            description=data['description'], 
            department_id=dept.department_id, # Set category explicitly string matched
            latitude=c_lat, 
            longitude=c_lon, 
            user_id=id, # Stores integer or None (Anonymous safe)
            staff_id=assigned_official.staff_id, 
            priority=priority,
            deadline=datetime.now(timezone.utc) + timedelta(hours=deadline_hours)
        )
        
        db.session.add(new_complaint)
        db.session.commit()
        return {
            'status': 'success',
            'predicted_dept': predicted_dept,
            'assigned_official':  assigned_official.user.fullname,
            'office': assigned_office.office_name,
            'distance': round(closest_dist,2),
            'expected_deadline' : new_complaint.deadline.isoformat() ,
            'tracking_id': new_complaint.complaint_id
        }           
        
class VerifyAdmin(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        claims = get_jwt()
        role = claims.get('role')
        if role != UserRole.ADMIN.value:
            return {"Unauthorized": 'You cant access this page'}, 403
        complaints = Complaint.query.filter_by(verified=False).all()
        data = []
        for complaint in complaints:
            data.append({'title': complaint.title, 'description': complaint.description, 'department_id': complaint.department_id})

        departments = Department.query.all()
        depts = []
        for department in departments:
            depts.append({'department_id': department.department_id, 'department_name': department.department_name})
        return {'complaints': data, 'departments': data, 'message': 'success'},200
    @jwt_required()
    def post(self):
        pass 

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
    
app.register_blueprint(auth_bp)


api.add_resource(user_dashboard, '/api/user/dashboard')
api.add_resource(staff_dashboard, '/api/staff/dashboard')

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