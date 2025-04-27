from flask import Flask, request, jsonify, send_from_directory, render_template, redirect, url_for, flash, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import os
import cv2
import numpy as np
from werkzeug.utils import secure_filename
import librosa
import tempfile
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'  # Change this to a secure secret key
db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Create database tables
with app.app_context():
    db.create_all()

# Configuration for file uploads
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg'},
    'video': {'mp4', 'avi', 'mov'},
    'audio': {'mp3', 'wav', 'ogg'}
}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Login required decorator
def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@app.route('/')
def index():
    if 'user_id' in session:
        return render_template('index.html')
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = request.form.get('remember')
        
        user = User.query.filter_by(email=email).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            if remember:
                session.permanent = True
            else:
                session.permanent = False
                
            return redirect(url_for('index'))
        else:
            flash('Invalid email or password', 'error')
            return redirect(url_for('login'))
    
    return render_template('index1.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered', 'error')
            return redirect(url_for('register'))
        
        user = User(email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please login.', 'success')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        user = User.query.filter_by(email=email).first()
        
        if user:
            # TODO: Implement password reset email functionality
            flash('Password reset instructions have been sent to your email', 'success')
        else:
            flash('Email not found', 'error')
        
        return redirect(url_for('login'))
    
    return render_template('forgot_password.html')

@app.route('/api/analyze/image', methods=['POST'])
@login_required
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename, 'image'):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the image
        result = process_image(filepath)
        # Clean up
        os.remove(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/video', methods=['POST'])
@login_required
def analyze_video():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename, 'video'):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the video
        result = process_video(filepath)
        # Clean up
        os.remove(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze/audio', methods=['POST'])
@login_required
def analyze_audio():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename, 'audio'):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process the audio
        result = process_audio(filepath)
        # Clean up
        os.remove(filepath)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def allowed_file(filename, file_type):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS[file_type]

def process_image(image_path):
    """
    Process image for deepfake detection
    """
    try:
        # Load and preprocess image
        img = cv2.imread(image_path)
        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)
        
        # TODO: Add your deepfake detection model here
        # For now, returning a dummy prediction
        return {
            'is_deepfake': False,
            'confidence': 0.95,
            'details': 'No deepfake detected in the image'
        }
    except Exception as e:
        return {'error': str(e)}


def process_audio(audio_path):
    """
    Process audio for deepfake detection
    """
    try:
        # Load and preprocess audio
        y, sr = librosa.load(audio_path)
        mfccs = librosa.feature.mfcc(y=y, sr=sr)
        
        # TODO: Add your deepfake detection model here
        # For now, returning a dummy prediction
        return {
            'is_deepfake': False,
            'confidence': 0.88,
            'details': 'No deepfake detected in the audio'
        }
    except Exception as e:
        return {'error': str(e)}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 
