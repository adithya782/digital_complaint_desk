import os
from flask import Flask
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import date, timedelta, datetime
from flask_restful import Api, reqparse, marshal_with, fields, Resource
from flask_jwt_extended import create_access_token, get_jwt, jwt_required, get_jwt_identity, JWTManager
from flask_cors import CORS
from models import db, User, Complaint, Resolution, Staff, Department
from dotenv import load_dotenv

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
app.config['JWT_SECRET_KEY'] = 'abcd'
app.secret_key = 'abcdefg'  
db.init_app(app)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

jwt = JWTManager(app)
api = Api(app)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print('Database Created')
    app.run(debug=True)