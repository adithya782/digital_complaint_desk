import os
from flask import Flask, Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, timedelta, datetime
from flask_restful import Api, reqparse, marshal_with, fields, Resource
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity, JWTManager
from flask_cors import CORS
from models import db, User, Complaint, Resolution, Staff, Department, UserRole
from dotenv import load_dotenv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

load_dotenv()

app = Flask(__name__)

prod_url = os.environ.get('DATABASE_URL')

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
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

jwt = JWTManager(app)
api = Api(app)

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/auth/google', methods=['POST'])
def google_auth():
    data = request.get_json()
    token = data.get('id_token')
    if not token:
        return jsonify({'error': 'Missing Google ID token'}), 400
    try:
        client_id = os.environ.get('GOOGLE_CLIENT_ID')
        id_info = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        google_id = id_info.get('sub')
        email = id_info.get('email').lower()
        full_name = id_info.get('name')
        
        user = User.query.filter((User.google_id==google_id) | (User.email == email)).first()
        
        if not user:
            user = User(fullname = full_name, email = email, google_id = google_id, auth_provider = 'google', role=UserRole.USER.value)
            # Password: None, phone -> null as of now, will be updated later
            db.session.add(user)
            db.session.commit()
        
        access_token = create_access_token(identity=str(user.id))
        
        if not user.phone:
            return jsonify({
                'message': 'Google Authentication Successful',
                'registration_incomplete': True,
                'access_token': access_token
                            }), 200
        
        return jsonify({
            'message': 'Login Successful',
            'registration_incomplete': False,
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'phone': user.phone,
                'full_name': user.fullname,
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
    args = profile_parser.parse_args()
    phone_number = args['phone_number']
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    user.phone = phone_number
    db.session.commit()
    return jsonify({
        'message': 'Profile completed successfully!',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.fullname,
            'phone_number': user.phone,
            'role': user.role
            }
    }), 200


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    parser = reqparse.RequestParser()
    parser.add_argument('email', required = True, help='Please enter email')
    parser.add_argument('password', required = True, help='Please enter Password')
    data = parser.parse_args()
    email = data['email']
    password = data['password']

    user = User.query.filter_by(email=email).first()
    

    if not user :
        return jsonify({'error':'User not found, please register'}),404
    

    if user.auth_provider == 'google':
        return jsonify({'message': "Seems you've registered through google signin, please sign-in using google"}), 400

    if check_password_hash(user.password,password):
        access_token = create_access_token(identity=str(user.id))
        if user.role == UserRole.STAFF.value:
            if user.staff:
                return jsonify({'success': 'Login Successful', 'access_token': access_token, 'role': user.role, 'staff_id': user.staff.staff_id}),200
            else:
                return jsonify({'error': 'Staff profile missing for this account'}), 404    
        return jsonify({'success': 'Login Successful', 'access_token': access_token, 'role': user.role}),200
    return jsonify({'error': 'incorrect password!'}), 400

@auth_bp.route('/api/auth/register', methods=['POST'])
def  register():
    parser = reqparse.RequestParser()
    parser.add_argument('name', required=True)
    parser.add_argument('email', required=True)
    parser.add_argument('password', required=True)
    parser.add_argument('phone', required=True)
    data = parser.parse_args()
    fullname = data['name']
    email = data['email']
    password = generate_password_hash(data['password'])
    phone = data['phone']
    user = User.query.filter_by(email=email).first()
    if user:
        return jsonify({'error': 'user with the same email already exists'}), 409
    user = User(fullname=fullname, email=email, password = password, phone=phone,auth_provider='manual')
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': 'registration successful'}),200

app.register_blueprint(auth_bp)

if __name__ == '__main__':
    with app.app_context():
        db.drop_all()
        print('Dropped')
        db.create_all()
        print('Database Created')
        admin = User(fullname=os.environ.get('ADMIN_NAME'), email=os.environ.get('ADMIN_EMAIL'), password=generate_password_hash(os.environ.get('ADMIN_PASSWORD')), auth_provider='manual', role=UserRole.ADMIN.value, phone=os.environ.get('ADMIN_PHONE') )
        db.session.add(admin)
        db.session.commit()
    app.run(debug=True)