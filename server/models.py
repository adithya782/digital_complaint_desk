from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key = True, autoincrement= True)
    fullname = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(300), nullable = False)
    phone = db.Column(db.String(20), nullable=False)