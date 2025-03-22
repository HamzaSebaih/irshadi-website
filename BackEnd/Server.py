#this is the server program.

from flask import Flask, jsonify, request
from flask_cors import CORS #don't forget to pip install this if not exist @AbdulazizJastanieh
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import wraps
import os
import random
import string
import datetime 
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
from bs4 import BeautifulSoup
# Load environment variables (optional, for production)
load_dotenv()


# Initialize Flask app
app = Flask(__name__)
CORS(app) #this cors are used to fix the front end request however I read its bad for deployoment @AbdulazizJastanieh
# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/irshadi-auth-firebase-adminsdk-fbsvc-9e96fac39e.json")  # this is the credentials that will be used to connect with the firestore
firebase_admin.initialize_app(cred) #here we make a connection with firebase using our credentials, 
db = firestore.client()  # This is your Firestore database object, here we create a connection to our firestore database, 

# Test route
@app.route('/')
def home():
    return "Welcome to Flask with Firestore!"


def verify_firebase_token(id_token): 
    #this is a normal function, that receives a parameter that should be the authentication token.
    #then it calls the firebase authentication to make sure that the token is valid, its good 
    #then after that it obtains the decoded version, which will contain the user info connected to the token 
    #and returns the decoded token.

    #this is used in the decorated functions
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  # Contains user info (e.g., uid, email)
    except Exception as e:
        return None  # Token is invalid

def generate_random_code():
    return str(random.randint(100000, 999999))  # Generates a 6-digit number, e.g., "483920"

def get_uid_by_email(email):
    try:
        user = auth.get_user_by_email(email)
        return user.uid  # Return the UID associated with the email
    except auth.UserNotFoundError:
        return None  # No user found with this email

def admin_required(f):
    #For full explination go to CodeNotes.py file
    @wraps(f)
    def decorated_function(*args, **kwargs):
        #get the autherization token header value
        #if its empty , then the sender of the request has no identity 
        #so don't tell him that he doesn't have identity
        id_token = request.headers.get("Authorization")
        if not id_token:
            return jsonify({"error": "Authorization token is missing"}), 401

        #if the user brought token, then call firebase to make sure the token is valid.
        decoded_token = verify_firebase_token(id_token)
        if not decoded_token:
            return jsonify({"error": "Invalid or expired token"}), 401

        #if we reach here , this means he brough token(id), and its valid

        #now grab his uid , check if his file is in the admins collection
        #if it exists, it means he is an admin
        user_id = decoded_token["uid"]
        user_ref = db.collection('Admins').document(user_id)
        user = user_ref.get()
        if (not user.exists):
            return jsonify({"error": "Admin access required"}), 403
            
        
        #if we reach here, the sender is an admin
        #call the original function, process his original request.
        kwargs['decoded_token'] = decoded_token
        return f(*args, **kwargs)

    return decorated_function

def token_required(f):
    #For full explination go to CodeNotes.py file
    @wraps(f)
    def decorated_function(*args, **kwargs):
        #get the autherization token header value
        #if its empty , then the sender of the request has no identity 
        #so tell him to getout 
        id_token = request.headers.get("Authorization")
        if not id_token:
            return jsonify({"error": "Authorization token is missing"}), 401

        #if the user brought token, then call firebase to make sure the token is valid.
        decoded_token = verify_firebase_token(id_token)
        if not decoded_token:
            return jsonify({"error": "Invalid or expired token"}), 401

        #if we reach here token is valid.
        kwargs['decoded_token'] = decoded_token
        return f(*args, **kwargs)

    return decorated_function

@app.route('/generateCode', methods=['POST'])
@token_required
def generate_code(decoded_token):
    #NOTE GOAL is to generate a otp code, create a document within a collection to represent otp code
    # then return the code

    # Get UID from the decoded token
    uid = decoded_token["uid"]
    
    # Generate a new code
    code = generate_random_code()
    
    # Store the code in Firestore, overwriting any existing code for this UID
    token_ref = db.collection('otp_tokens').document(uid)
    token_ref.set({
        'code': code,
        'createdAt': datetime.now(timezone.utc),
        'expiresAt': datetime.now(timezone.utc) + timedelta(minutes=5)  # 5-minute expiration
    })
    
    # Return the code to the frontend
    return jsonify({"code": code}), 200

@app.route('/extensionUpdate', methods=['POST'])

def handle_extension_update():
    #NOTE goal is to handle a request from extensions, and call the function to update student data.

    #here we just extract the code from the header.
    code = request.headers.get("Code")
    if not code:
        return jsonify({"error": "code is missing"}), 401

    #if we reach here code is available
    # Query Firestore to find the document with this code
    tokens_ref = db.collection('otp_tokens').where('code', '==', code).limit(1).get()
    #this is a document snapshot
    if not tokens_ref:
        return jsonify({"error": "Invalid or expired code"}), 404
    
    # Get the first (and only) matching document
    token_doc = tokens_ref[0]  #this is a document snapshot
    token_data = token_doc.to_dict()
    uid = token_doc.id  # UID is the document ID
    
    # Check expiration
    expires_at = token_data['expiresAt']
    if datetime.now(timezone.utc) > expires_at:
        # Delete the expired token
        db.collection('otp_tokens').document(uid).delete()
        return jsonify({"error": "Code has expired"}), 400
    
    try:
        # Perform the update of student information
        update_student_data(uid)
        
        # Delete the token to enforce single-use
        db.collection('otp_tokens').document(uid).delete()
        
        return jsonify({"message": "Update successful"}), 200
    
    except ValueError as e:
        # Notify and stop if an error occurs in update_student_data
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({"error": "An unexpected error occurred: " + str(e)}), 500

# function for updating user data
def update_student_data(uid):
    # Goal: Update the student document with info from the HTML request sent by the extension
    
    # Access the HTML from the Flask request body
    html = request.data.decode('utf-8')
    if not html:
        raise ValueError("No HTML provided")
    
    # Reference to the student document in Firestore
    student_document = db.collection('Students').document(uid)

    # Step 1: Extract good information from HTML body
    soup = BeautifulSoup(html, 'html.parser')
    # General info extraction
    general_info = {}
    
    # Student ID (from top table)
    top_table = soup.find('table', class_='plaintable')
    if top_table:
        student_info = top_table.find('td', class_='pldefault', attrs={'width': '100%'}) #the student_info is null here so we have a problem in extracting it's information in the code below

        if student_info: #here we start to have problms I think but the code will still works so the problem is in other things also
            lines = student_info.text.strip().split('\n') 
            general_info['Student_ID'] = lines[0].split()[0]  # e.g., "2135813"
    
    # Academic info table
    academic_table = soup.find('table', class_='datadisplaytable', border='1')
    if academic_table:
        rows = academic_table.find_all('tr')
        for row in rows:
            cols = row.find_all('th')
            values = row.find_all('td')
            if len(cols) == 1 and len(values) == 1:
                key = cols[0].text.strip()
                value = values[0].text.strip()
                if key == 'رقم الطالب':  # Student ID
                    general_info['Student_ID'] = value
                elif key == 'التخصص':  # Major
                    general_info['major'] = value
                elif key == 'الساعات المسجلة':  # Registered Hours
                    general_info['hours_registered'] = int(value)
                elif key == 'الساعات المجتازة':  # Completed Hours
                    general_info['hours_completed'] = int(value)
                elif key == 'ساعات المعدل':  # Total Hours
                    general_info['hours_total'] = int(value)
                elif key == 'الساعات المحولة':  # Exchanged Hours
                    general_info['hours_exchanged'] = int(value)
                elif key == 'المعدل':  # GPA
                    general_info['gpa'] = float(value)

    # Extract only course codes for completed courses
    finished_courses = []
    tables = soup.find_all('table', class_='datadisplaytable', border='1')
    for table in tables:
        # Skip semester header tables
        header = table.find('td', class_='dddefault')
        if header and 'الفصل الدراسي' in header.text:
            continue
        
        # Process course table
        rows = table.find_all('tr')
        headers = [th.text.strip() for th in rows[0].find_all('th')] if rows else []
        if 'المقرر' in headers:  # Course table
            for row in rows[1:]:  # Skip header row
                cols = row.find_all('td')
                if len(cols) >= 7:
                    course_code = cols[1].text.strip()  # المقرر (e.g., CPIT-334)
                    hours_registered = int(cols[4].text.strip())  # مسجلة
                    hours_passed = int(cols[5].text.strip())  # مجتازة
                    grade = cols[7].text.strip()  # التقدير
                    
                    # Only include if hours match (successfully completed) and grade isn’t NP
                    if hours_registered == hours_passed and grade != 'F' and grade!= 'W':
                        finished_courses.append(course_code)

    # Structure extracted data
    extracted_data = {
        "Student_ID": general_info.get('Student_ID'),
        "hours": {
            "registered": general_info.get('hours_registered', 0),
            "completed": general_info.get('hours_completed', 0),
            "total": general_info.get('hours_total', 0),
            "exchanged": general_info.get('hours_exchanged', 0)
        },
        "gpa": general_info.get('gpa', 0.0),
        "major": general_info.get('major', ''),
        "Finished_Courses": finished_courses
    }
    
    # Step 2: Update and add extracted info to student document
    # Fetch existing document
    doc = student_document.get()
    if not doc.exists:
        raise ValueError("Student not found")
    
    # Existing data
    existing_data = doc.to_dict()
    
    # Preserve the existing name as a string
    name_str = existing_data.get("name", "")  # Default to empty string if missing

    # Update with extracted data
    updated_data = {
        "Student_ID": extracted_data["Student_ID"],
        "hours": {
            "registered": extracted_data["hours"]["registered"],
            "total": extracted_data["hours"]["total"],
            "exchanged": extracted_data["hours"]["exchanged"],
            "completed": extracted_data["hours"]["completed"]
        },
        "gpa": extracted_data["gpa"],
        "name": name_str,  # Preserve original name as a string
        "major": extracted_data["major"],
        "Finished_Courses": extracted_data["Finished_Courses"]
    }
    
    # Update Firestore document
    student_document.set(updated_data, merge=True)
    
@app.route('/addStudent', methods=['POST'])
@admin_required
def add_Student(decoded_token):
    #route for adding a Student document to the Students collections by using the id given 
    
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        StudentID = data.get("Student_ID") #extracts the id key value
        # Add data to Firestore
        db.collection('Students').document(StudentID).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/addStudent-testing', methods=['POST'])
def add_Student_testing():
    #route for adding a Student document to the Students collections by using the id given 
    #this route isn't protected, this is for testing purposes. NOTE its temporary
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        StudentID = data.get("Student_ID") #extracts the id key value
        # Add data to Firestore
        db.collection('Students').document(StudentID).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/addCourse', methods=['POST'])
@admin_required
def add_Course(decoded_token):
    #route for adding  a course document to the courses collections by using the coursecode and course number given 
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        course_code = data.get("course_code")
        course_number = data.get("course_number")
        DocumentName = course_code + "_" + course_number
        # Add data to Firestore
        db.collection('Courses').document(DocumentName).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/addAdmin', methods=['POST'])
def add_Admin():
    #route for adding a admin document to the admin collection by using the id given 
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        AdminID = data.get("Admin_ID") #extracts the id key value
        # Add data to Firestore
        db.collection('Admins').document(AdminID).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/addSurvey', methods=['POST'])
@admin_required
def add_Survey(decoded_token):
    #route for adding a survey document to the survey collection by using the id given 
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        survey_id = data.get("Survey_ID") #extracts the id key value
        # Add data to Firestore
        db.collection('Surveys').document(survey_id).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/addResponse', methods=['POST'])
@token_required
def add_Response(decoded_token):
    #route for adding a response document to the reponses collections by using the id given 
    try:
        # Get data from the request (e.g., JSON payload)
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        Student_ID = data.get("Student_ID") #extracts the student id 
        Survey_ID = data.get("Survey_ID") #extract the survey id

        Documentname = Student_ID + "_" + Survey_ID #resposne key
        # Add data to Firestore
        db.collection('SurveyResponses').document(Documentname).set(data)  # goes to the collection - make reference to a document with the name of the id - then set its data to the json body received, note: is there is no document it will create one.
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.route('/getStudent/<user_id>', methods=['GET'])
@admin_required
def get_data(user_id, decoded_token):

    #route for retrieving a user document  from the users collections
    try:
        # Get a document by ID
        user_ref = db.collection('Students').document(user_id) #this createse a pointer to the document with the specificed user_id
        user = user_ref.get() #here we fetch the document snapshot 
        if user.exists:
            return jsonify(user.to_dict()), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/update/<user_id>', methods=['PUT'])
@admin_required
def update_data(user_id, decoded_token):
    #route for updating a user document  from the users collections
    try:
        # Get updated data from the request
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Update the document
        user_ref = db.collection('users').document(user_id)
        user_ref.update(data)
        return jsonify({"message": "Data updated successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/delete/<user_id>', methods=['DELETE'])
@admin_required
def delete_data(user_id, decoded_token):
     #route for deleting a user document  from the users collections
    try:
        # Delete the document
        db.collection('users').document(user_id).delete()
        return jsonify({"message": "Data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__': #this starts the flask application
    app.run(debug=True)

