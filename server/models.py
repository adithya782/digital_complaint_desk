import datetime
from flask_sqlalchemy import SQLAlchemy
# from geoalchemy2 import Geometry
import enum
class UserRole(enum.Enum):
    USER = 'user'
    STAFF = 'staff'
    ADMIN = 'admin'

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key = True, autoincrement= True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(300), nullable = False)
    password = db.Column(db.String(300), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    auth_provider = db.Column(db.String(20), nullable=False, default='local')
    complaints = db.relationship('Complaint', backref='user', lazy=True)

    role = db.Column(db.String(20), default='user', nullable=False)
    staff = db.relationship('Staff', backref='user', uselist=False,  lazy=True)

class Complaint(db.Model):
    __tablename__ = 'complaints'
    complaint_id = db.Column(db.Integer, primary_key=True,autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False,unique=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    category = db.Column(db.String(100), nullable=False)

    status = db.Column(db.String(50), default='pending')
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    image_url = db.Column(db.String(500), nullable=True) 
    video_url = db.Column(db.String(500), nullable=True)

    # Location of the complaint
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)

    resolution = db.relationship('Resolution',backref='original_complaint', uselist=False,lazy=True)

class Resolution(db.Model):
    __tablename__ = 'resolutions'
    resolution_id =  db.Column(db.Integer, primary_key=True, autoincrement=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.complaint_id'), nullable=False,unique=True)
    action_taken = db.Column(db.String(500),nullable=False)
    resolved_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    staff_id = db.Column(db.Integer, db.ForeignKey('staffs.staff_id'), nullable=False,unique=False)

class Staff(db.Model):
    __tablename__ = 'staffs'
    staff_id = db.Column(db.Integer, primary_key = True, autoincrement= True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), unique=True,nullable=False)
    # fullname = db.Column(db.String(100), nullable=False)
    # email = db.Column(db.String(300), nullable = False)
    # password = db.Column(db.String(300), nullable=True)
    # phone = db.Column(db.String(20), nullable=True)
    # google_id = db.Column(db.String(255), unique=True, nullable=True)
    # auth_provider = db.Column(db.String(20), nullable=False, default='local')

    resolutions = db.relationship('Resolution', backref='staff', lazy=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.department_id'), nullable=False)
    office_id = db.Column(db.Integer, db.ForeignKey('offices.office_id'), nullable=False)

    

class Department(db.Model):
    __tablename__ = 'departments'
    department_id = db.Column(db.Integer, primary_key = True, autoincrement=True)
    department_name = db.Column(db.String(50), unique = True)
    staffs = db.relationship('Staff', backref='department', lazy=False)
    

class Office(db.Model):
    """NEW MODEL: Represents the physical municipal building"""
    __tablename__ = 'offices'
    office_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    office_name = db.Column(db.String(100), unique=True, nullable=False) # e.g., "Zone-3 Municipal Complex"
    
    #Location of the office
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    
    departments = db.relationship('Department', secondary='office_department',backref='offices', lazy=True)
    staffs = db.relationship('Staff', backref='office', lazy=True)


office_department = db.Table('office_department',
    db.Column('office_id', db.Integer, db.ForeignKey('offices.office_id'), primary_key=True),
    db.Column('department_id', db.Integer, db.ForeignKey('departments.department_id'), primary_key=True)
)

class TransactionStatus(enum.Enum):
    PENDING = 'pending'
    SUCCESS = 'success'
    FAILED = 'failed'
    REFUNDED = 'refunded'

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    transaction_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    # 🔗 Relational Foreign Keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.complaint_id'), nullable=True) # Optional (if tied to a bounty or fine)
    
    # 💰 Transaction Details
    amount = db.Column(db.Numeric(10, 2), nullable=False)  # Using Numeric/Decimal prevents floating point rounding bugs
    payment_gateway_ref = db.Column(db.String(255), unique=True, nullable=True) # ID from Razorpay, Stripe, etc.
    payment_mode = db.Column(db.String(50), nullable=False) # e.g., 'UPI', 'CARD', 'NET_BANKING', 'WALLET'
    
    # 📊 State Management
    status = db.Column(db.String(20), default='pending', nullable=False) # Maps to TransactionStatus
    purpose = db.Column(db.String(100), nullable=False) # e.g., 'FINE_PAYMENT', 'REWARD_DISBURSEMENT', 'COMMUNITY_BOUNTY'
    
    # ⏰ Timestamping
    created_at = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, server_default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

    # 🔄 Explicit Relationships for easier back-querying
    # (Complements backref structures nicely)
    user_record = db.relationship('User', backref=db.backref('transactions', lazy=True))
    complaint_record = db.relationship('Complaint', backref=db.backref('transactions', lazy=True))