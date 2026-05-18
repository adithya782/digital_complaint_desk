import datetime
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key = True, autoincrement= True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(300), nullable = False)
    phone = db.Column(db.String(20), nullable=False)
    complaints = db.relationship('Complaint', backref='user', lazy=True)

class Complaint(db.Model):
    __tablename__ = 'complaints'
    complaint_id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False,unique=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, on_update=datetime.utcnow)

    image_url = db.Column(db.String(500), nullable=True) 
    video_url = db.Column(db.String(500), nullable=True)
    location = db.Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)

    resolution = db.relationship('Resolution',backref='original_complaint', uselist=False,lazy=True)

class Resolution(db.Model):
    __tablename__ = 'resolutions'
    resolution_id =  db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.complaint_id'), nullable=False,unique=True)
    action_taken = db.Column(db.String(500),nullable=False)
    resolved_at = db.Column(db.DateTime, default=datetime.utcnow)
    staff_id = db.Column(db.Integer, db.ForeignKey('staffs.staff_id'), nullable=False,unique=False)

class Staff(db.Model):
    __tablename__ = 'staffs'
    staff_id = db.Column(db.Integer, primary_key = True, autoincrement= True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(300), nullable = False)
    phone = db.Column(db.String(20), nullable=False)
    resolutions = db.relationship('Resolution', backref='staff', lazy=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=False)

class Department(db.Model):
    __tablename__ = 'departments'
    department_id = db.Column(db.Integer, primary_key = True, autoincrement=True)
    department_name = db.Column(db.String(50), unique = True)
    staffs = db.relationship('Staff', backref='department', lazy=False)
