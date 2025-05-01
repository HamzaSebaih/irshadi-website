#this is the Backend server program.

#Importing Section ___________
from flask import Flask, jsonify, request
from flask_cors import CORS 
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import wraps
import os
import math
import random
import string
import datetime 
import json
from datetime import datetime, time, timezone, timedelta
from dotenv import load_dotenv
from bs4 import BeautifulSoup
import collections # For defaultdict
import traceback # For detailed error logging
import google.generativeai as genai
#End of Importing Section ___________

load_dotenv() # Load environment variables


# Initialize Flask app
app = Flask(__name__)
CORS(app) 
# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/irshadi-auth-firebase-adminsdk-fbsvc-d9b5b63d0d.json")  # this is the credentials that will be used to connect with the firestore
firebase_admin.initialize_app(cred) #here we make a connection with firebase using our credentials, 
db = firestore.client()  # This is our Firestore database object, here we create a connection to our firestore database, 


#General Functions Section _______________

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
        user_ref = db.collection('admins').document(user_id)
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

@app.route('/login', methods=['POST'])
@token_required
def login(*args, **kwargs):
    #Goal: THIS IS THE MAIN LOGIN FUNCTION. 
    #it creates a file for the logged person and return its information + role
    #or just return his information.
    try:
        # Extract decoded token passed by the token_required decorator
        decoded_token = kwargs.get('decoded_token')

        # Extract UID, email, and name from the decoded Firebase token
        uid = decoded_token.get('uid')
        email = decoded_token.get('email')
        name = decoded_token.get('name')

        if not uid or not email:
            return jsonify({"error": "UID or email missing in token"}), 400

        # Fallback for name if it's not in the token
        if not name:
            name = email.split('@')[0]  # Derive from email as a fallback

        # First check if its a new admin
        pending_admin_ref = db.collection('pendingAdmins').document(email)
        pending_admin_doc = pending_admin_ref.get()

        if pending_admin_doc.exists:
            # This user is a new admin
            # gather his information from token
            admin_data = {
                "name": name,  
                "email": email,
                "role": "admin"  # 
            }
            # Create the admin document 
            db.collection('Admins').document(uid).set(admin_data)
            # Delete the pending admin "file"
            pending_admin_ref.delete()
            # Return the admin data 
            return jsonify(admin_data), 200

        # Step 2: Check if UID exists in the 'Admins' collection
        admin_ref = db.collection('Admins').document(uid)
        admin_doc = admin_ref.get()

        if admin_doc.exists:
            # User is an existing admin
            # Return the admin document directly
            admin_data = admin_doc.to_dict()
            return jsonify(admin_data), 200

        # Step 3: Check if UID exists in the 'Students' collection
        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()

        if student_doc.exists:
            # User is an existing student
            # Add role to the student data and return doc
            student_data = student_doc.to_dict()
            student_data["role"] = "student"
            return jsonify(student_data), 200

        # Step 4: If UID is not in either collection, create a new student
        new_student_data = {
            "name": name,  # Use name from token (or fallback)
            "email": email,
            "gpa": 0.0,  # Default values for student fields
            "hours": {
                "registered": 0,
                "completed": 0,
                "gpa": 0,
                "exchanged": 0
            },
            "finishedCourses": [] 
        }
        student_ref.set(new_student_data)

        # Return the new student data 
        return jsonify(new_student_data), 200

    except Exception as e:
        return jsonify({"error": "Login failed", "details": str(e)}), 500

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

def generate_time_slots():
    """Generates lists of valid 50-min and 80-min time slots."""
    slots_50_min = []
    slots_80_min = []
    #list of maps , where each map represent a slot 
    days_50 = ["Sunday", "Tuesday", "Thursday"]
    days_80 = ["Monday", "Wednesday"]
    break_start = time(12, 0)
    break_end = time(13, 0)
    end_of_day = time(18, 0) # 6 PM

    # Generate 50-min slots (Sun, Tue, Thu)
    for day in days_50:#for each day (sun,true,thu)
        current_time = time(9, 0)
        while current_time < end_of_day:#as long as time isn't the end of day which is 6:00 pm currently for better ai control
            slot_end_time = (datetime.combine(datetime.today(), current_time) + timedelta(minutes=50)).time()#the time slot is basically current time , until the end ofthe slot which si based on adding 50 minutes to the current time
            if current_time < break_start and slot_end_time > break_start:
                 #if we enter here , this means slot start before break but ends during or after break. not valid time slot
                 current_time = break_end; continue#skip the current slot and start after break ends
            if current_time >= break_start and current_time < break_end:
                 #if we enter here , this means that the time slot start during the break. not valid
                 current_time = break_end; continue#skip the current slot and start after break
            if slot_end_time > end_of_day: break#if a slot ends after the end of day, not valid skip
            slots_50_min.append({"day": day, "start": current_time.strftime("%H:%M"), "end": slot_end_time.strftime("%H:%M")})#if we reach here , slot is valid, add slot information to the list as a map, 
            current_time = (datetime.combine(datetime.today(), current_time) + timedelta(minutes=60)).time()

    # Generate 80-min slots (Mon, Wed)
    for day in days_80:#for each day mon,wed
        current_time = time(9, 0)
        while current_time < end_of_day:
            slot_end_time = (datetime.combine(datetime.today(), current_time) + timedelta(minutes=80)).time()
            if current_time < break_start and slot_end_time > break_start:
                 #if we enter here , this means slot start before break but ends during or after break. not valid time slot
                 current_time = break_end; continue#skip the current slot and start after break ends
            if current_time >= break_start and current_time < break_end:
                 #if we enter here , this means that the time slot start during the break. not valid
                 current_time = break_end; continue#skip the current slot and start after break
            if slot_end_time > end_of_day: break#if a slot ends after the end of day, not valid skip
            slots_80_min.append({"day": day, "start": current_time.strftime("%H:%M"), "end": slot_end_time.strftime("%H:%M")})
            current_time = (datetime.combine(datetime.today(), current_time) + timedelta(minutes=90)).time()

    return slots_50_min, slots_80_min

#End Of General Functions Section _______________

#Admin Functions Section _______________

@app.route('/addadmin', methods=['POST'])
@admin_required
def add_admin(decoded_token):
    #GOAL: add an admin
    try:
        # Step 1: Extract the email from the request body (JSON)
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Email is missing in request body"}), 400
        email = data['email']

        # Step 2: Get the UID associated with the email
        uid = get_uid_by_email(email)
        if uid is None:
            # No UID found, create a document in pendingAdmins with the email as document ID
            pending_admin_ref = db.collection('pendingAdmins').document(email)
            pending_admin_ref.set({"email": email})
            return jsonify({"message": f"Admin pending creation for email: {email}"}), 200

        # Step 3: Check if the UID belongs to an admin or student
        admin_ref = db.collection('Admins').document(uid)  
        admin_doc = admin_ref.get()
        if admin_doc.exists:
            return jsonify({"error": "Email already belongs to an admin"}), 400

        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()
        if student_doc.exists:
            # get his info 
            student_data = student_doc.to_dict()
            name = student_data.get('name')
            email = student_data.get('email')

            # make sure his data is not missing
            if not name or not email:
                return jsonify({"error": "Student document missing name or email"}), 500

            # Delete the student document, since he will become a new admin
            student_ref.delete()

            # Create a new admin document
            admin_data = {
                "name": name,
                "email": email,
                "role": "admin"
            }
            admin_ref.set(admin_data)
            return jsonify({"message": "Student promoted to admin successfully"}), 200

        # If UID exists but not in admins or students, return an error
        return jsonify({"error": "User exists but not found in admins or students collections"}), 400

    except Exception as e:
        return jsonify({"error": "Failed to add admin", "details": str(e)}), 500

@app.route('/deleteadmin', methods=['POST'])
@admin_required
def delete_admin(decoded_token):
    #Goal: delete a pending or existing admin.
    try:
        # Step 1: Extract the email 
        data = request.get_json()
        if not data or 'email' not in data:
            return jsonify({"error": "Email is missing in request body"}), 400
        email = data['email']

        # Step 2: Check if the email belongs to a pending admin
        pending_admin_ref = db.collection('pendingAdmins').document(email)
        pending_admin_doc = pending_admin_ref.get()
        if pending_admin_doc.exists:
            # Delete the pending admin document
            pending_admin_ref.delete()
            return jsonify({"message": f"Pending admin with email {email} has been deleted"}), 200

        # Step 3: Find the UID associated with the email
        uid = get_uid_by_email(email)
        if uid is None:
            return jsonify({"error": f"No user found with email: {email}"}), 404

        # Step 4: Check if the UID belongs to an admin in the Admins collection
        admin_ref = db.collection('Admins').document(uid)
        admin_doc = admin_ref.get()
        if admin_doc.exists:
            # Delete the admin document
            admin_ref.delete()
            return jsonify({"message": f"Admin with email {email} has been deleted"}), 200
        else:
            return jsonify({"error": f"User with email {email} is not an admin"}), 400

    except Exception as e:
        return jsonify({"error": "Failed to delete admin", "details": str(e)}), 500

@app.route('/addCourse', methods=['POST'])
@admin_required
def add_course(decoded_token):
    # NOTE GOAL: adding a course to the Courses collection
    try:
        # Get data from the request json body
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Step 1: Extract and validate required fields
        department = data.get('department','').upper()#CPIT
        course_number = data.get('course_number')#470
        course_name = data.get('course_name')#networks 2
        hours = data.get('hours')# 3
        prerequisites = data.get('prerequisites', [])  # Default to empty list if not provided

        # Validate required fields
        if not department or not isinstance(department, str):
            return jsonify({"error": "Department is required and must be a string"}), 400
        if course_number is None or not isinstance(course_number, (int, str)):
            return jsonify({"error": "Course number is required and must be a number or string"}), 400
        if not course_name or not isinstance(course_name, str):
            return jsonify({"error": "Course name is required and must be a string"}), 400
        if hours is None or not isinstance(hours, int):
            return jsonify({"error": "Hours is required and must be an integer"}), 400
        if not isinstance(prerequisites, list) or not all(isinstance(prereq, str) for prereq in prerequisites):
            return jsonify({"error": "Prerequisites must be a list of strings"}), 400

        # Convert course_number to string for the document ID
        course_number_str = str(course_number)
        

        # Step 2: Create a unique document ID (e.g., "CPIT-251")
        course_id = f"{department}-{course_number_str}"

        # Check if the course already exists
        course_ref = db.collection('Courses').document(course_id)
        if course_ref.get().exists:
            return jsonify({"error": f"Course {course_id} already exists"}), 400

        # Step 3: Create the course document
        course_data = {
            "department": department,
            "course_number": int(course_number),  
            "course_name": course_name,
            "hours": hours,
            "prerequisites": prerequisites
        }
        course_ref.set(course_data)

        # Step 4: Return success message
        return jsonify({"message": f"Course {course_id} added successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Failed to add course", "details": str(e)}), 500

@app.route('/addCoursePre', methods=['POST'])
@admin_required
def add_course_prerequisite(decoded_token): 
    """
    NOTE this functions adds a pre requuisite course to a course.
    """
    course_id = None # Initialize values
    prerequisite_id = None 
    try:
        # Step 1: get values
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        course_id = data.get('course_id')         # The course to add the prerequisite to (e.g., Course CPIT251)
        prerequisite_id = data.get('prerequisite') # The course ID that is the prerequisite (e.g., Course CPIT250)

        # Basic validation
        if not course_id or not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid 'course_id' (must be a non-empty string)"}), 400
        if not prerequisite_id or not isinstance(prerequisite_id, str) or not prerequisite_id.strip():
            return jsonify({"error": "Missing or invalid 'prerequisite' (must be a non-empty string)"}), 400

        course_id = course_id.strip()
        prerequisite_id = prerequisite_id.strip()
        #this cleans the string from any whitespaces 

        # make sure that you can't add a course as a pre to itself
        if course_id == prerequisite_id:
             return jsonify({"error": "A course cannot be a prerequisite of itself"}), 400

        # Step 2: make sure that both courses exists 
        course_ref = db.collection('Courses').document(course_id)         # Ref for Course CPIT251
        prereq_ref = db.collection('Courses').document(prerequisite_id) # Ref for Course CPIT250

        course_doc = course_ref.get() # Doc for Course CPIT251
        prereq_doc = prereq_ref.get() # Doc for Course CPIT250

        if not course_doc.exists:
             return jsonify({"error": f"Target course '{course_id}' not found in Courses collection"}), 404
        if not prereq_doc.exists:
             return jsonify({"error": f"Prerequisite course '{prerequisite_id}' not found in Courses collection"}), 400 # 400 Bad Request

        # --- Step 3: Check if Course CPIT251 (course_id) is already a prerequisite for Course CPIT250 (prerequisite_id)
        # as this would create a loop
        prereq_data = prereq_doc.to_dict()
        prereqs_of_prereq = prereq_data.get('prerequisites', []) # Get Course CPIT250 prerequisites
        if isinstance(prereqs_of_prereq, list) and course_id in prereqs_of_prereq:
            # if we enter here here , this means that 250 has 251 as a pre , and if we continue the function , there will be a loop , so we can't 
            return jsonify({
                "error": f"Circular prerequisite detected: '{course_id}' is already listed as a prerequisite for '{prerequisite_id}'. Cannot add '{prerequisite_id}' as a prerequisite for '{course_id}'."
            }), 409 # 409 Conflict is appropriate here

        # Step4 : validation for prerequisite list
        course_data = course_doc.to_dict()
        if 'prerequisites' in course_data and not isinstance(course_data.get('prerequisites'), list):
             return jsonify({"error": f"Field 'prerequisites' in course '{course_id}' exists but is not an array/list."}), 409 # 409 Conflict

        # Step 5 : add pre requisite course using arrayUnion which will only add unique values to a list, and is atomic
        # Prepare the update data.
        update_data = {
            # Add prerequisite_id (Course 250) to course_id's (Course 251) list
            'prerequisites': firestore.ArrayUnion([prerequisite_id])
        }

        # do the update
        course_ref.update(update_data)

        # Step 6 : return response 
        return jsonify({
            "message": f"Prerequisite '{prerequisite_id}' added to course '{course_id}' (or was already present)."
            }), 200 # 200 OK

    except Exception as e:
        # Log the error for server-side debugging
        course_id_local = course_id if 'course_id' in locals() else 'unknown'
        prereq_id_local = prerequisite_id if 'prerequisite_id' in locals() else 'unknown'
        print(f"Error in /addCoursePre for course '{course_id_local}', prerequisite '{prereq_id_local}': {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to add course prerequisite due to an internal server error", "details": str(e)}), 500

@app.route('/deleteCoursePre', methods=['POST']) 
@admin_required
def delete_course_prerequisite(decoded_token): 
    """
    NOTE this functions deletes a prerequisite course from a course's prerequisite list
    """
    course_id = None # Initialize values
    prerequisite_id_to_delete = None 
    try:
        # Step 1: get data and validate
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        course_id = data.get('course_id') # The course to modify
        prerequisite_id_to_delete = data.get('prerequisite_id') # The prerequisite to remove

        # Basic validation
        if not course_id or not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid 'course_id' (must be a non-empty string)"}), 400
        if not prerequisite_id_to_delete or not isinstance(prerequisite_id_to_delete, str) or not prerequisite_id_to_delete.strip():
            return jsonify({"error": "Missing or invalid 'prerequisite_id' (must be a non-empty string)"}), 400

        course_id = course_id.strip()
        prerequisite_id_to_delete = prerequisite_id_to_delete.strip()

        # Step 2 : make sure courses exist
        course_ref = db.collection('Courses').document(course_id)
        course_doc = course_ref.get()

        if not course_doc.exists:
             return jsonify({"error": f"Target course '{course_id}' not found in Courses collection"}), 404

        # Step : 3 Check if Prerequisite Exists in the List 
        course_data = course_doc.to_dict()
        current_prereqs = course_data.get('prerequisites', [])

        # make sure the field is a list
        if not isinstance(current_prereqs, list):
             return jsonify({"error": f"Field 'prerequisites' in course '{course_id}' is not an array/list."}), 409 # Conflict

        # Check if the prerequisite to delete is actually in the current list
        if prerequisite_id_to_delete not in current_prereqs:
             return jsonify({
                 "error": f"Prerequisite '{prerequisite_id_to_delete}' not found in the prerequisites list for course '{course_id}'."
             }), 404 # Not Found

        # Step 4:  Remove Prerequisite using ArrayRemove ---
        # Prepare the update data. ArrayRemove handles removing the specific element.
        update_data = {
            'prerequisites': firestore.ArrayRemove([prerequisite_id_to_delete]),
            'last_modified': datetime.now(timezone.utc)
        }

        # Update the target course document
        course_ref.update(update_data)

        return jsonify({
            "message": f"Prerequisite '{prerequisite_id_to_delete}' removed successfully from course '{course_id}'."
            }), 200 # 200 OK

    except Exception as e:
        # Log the error for server-side debugging
        course_id_local = course_id if 'course_id' in locals() else 'unknown'
        prereq_id_local = prerequisite_id_to_delete if 'prerequisite_id_to_delete' in locals() else 'unknown'
        print(f"Error in /deleteCoursePre for course '{course_id_local}', prerequisite '{prereq_id_local}': {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to delete course prerequisite due to an internal server error", "details": str(e)}), 500

@app.route('/getCourses', methods=['GET'])
@admin_required
def get_courses(decoded_token):
    try:
        # Step 1: Query the Courses collection to get all documents
        courses_ref = db.collection('Courses')
        courses_docs = courses_ref.stream()

        # Step 2: Convert documents to a list of dictionaries
        courses_list = []
        for doc in courses_docs:
            course_data = doc.to_dict()
            # Add the document ID as the course ID (e.g., "CPIT-251")
            course_data['course_id'] = doc.id
            courses_list.append(course_data)

        # Step 3: Check if the collection is empty
        if not courses_list:
            return jsonify({"message": "No courses found", "courses": []}), 200

        # Step 4: Return the list of courses
        return jsonify({"courses": courses_list}), 200

    except Exception as e:
        return jsonify({"error": "Failed to retrieve courses", "details": str(e)}), 500

@app.route('/addPlan', methods=['POST'])
@admin_required
def add_plan(decoded_token):
    """
    Creates a new plan document in the 'Plans' collection using the plan name as the key.
    """
    try:
        # Step 1: get and validate data
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400

        plan_name = data.get('plan_name')
        num_levels = data.get('levels') # Get the number of levels
        required_hours = data.get('required_hours') 

        # Basic validation for plan_name
        if not plan_name or not isinstance(plan_name, str) or not plan_name.strip():
            return jsonify({"error": "Missing or invalid 'plan_name' (must be a non-empty string)"}), 400

        # Validation for levels
        if num_levels is None:
             return jsonify({"error": "Missing 'levels' attribute in request body"}), 400
        if not isinstance(num_levels, int) or num_levels <= 0:
             print(f"Invalid num_levels received: {num_levels}") # Added print for debugging
             return jsonify({"error": "'levels' must be a positive integer"}), 400

        # validation for hours
        if required_hours is None:
             return jsonify({"error": "Missing 'required_hours' attribute in request body"}), 400
        if not isinstance(required_hours, int) or required_hours <= 0:
             return jsonify({"error": "'required_hours' must be a positive integer"}), 400
        # --- End required_hours validation ---

        # Use stripped name as the document ID
        plan_name = plan_name.strip()

        # Step 2: Check for Existing Plan 
        plan_ref = db.collection('Plans').document(plan_name)
        if plan_ref.get().exists:
            return jsonify({"error": f"Plan '{plan_name}' already exists"}), 409

        # Step 3: Create New Plan Document 
        last_updated_date = datetime.now(timezone.utc)
        plan_data = {
            'last_update_date': last_updated_date,
            'required_hours': required_hours, # Added required_hours
            'levels': {} # Initialize the map field for levels
        }

        # Populate the levels map based on the num_levels input
        for i in range(1, num_levels + 1):
            level_key = f"Level {i}" # Create keys like "Level 1", "Level 2", etc.
            plan_data['levels'][level_key] = [] # Add each level with an empty list

        # Add the 'Extra' level AFTER the numbered levels
        plan_data['levels']['Extra'] = []

        # Set the data in Firestore, creating the document
        plan_ref.set(plan_data)

        # Step 4: Return Success Response 
        return jsonify({
            "message": f"Plan '{plan_name}' created successfully with {num_levels} numbered levels, an 'Extra' level, and {required_hours} required hours.",
            "plan_name": plan_name,
            "plan_levels": num_levels,
            "required_hours": required_hours, # Also return the required hours
            "last_updated_date": last_updated_date
            }), 201

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /addPlan for plan '{plan_name if 'plan_name' in locals() else 'unknown'}': {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to add plan due to an internal server error", "details": str(e)}), 500

@app.route('/addPlanLevel', methods=['POST'])
@admin_required
def add_plan_level(decoded_token): 
    """
    Adds a new level (as an empty list attribute) to an existing plan document in the 'Plans' collection.
    """
    try:
        # Step 1: Get and Validate data  
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        plan_name = data.get('plan_name')
        level_number = data.get('level_number') # Expecting a number for the level

        # Basic validation for plan_name
        if not plan_name or not isinstance(plan_name, str) or not plan_name.strip():
            return jsonify({"error": "Missing or invalid 'plan_name' (must be a non-empty string)"}), 400

        # Validation for level_number (must be a positive integer)
        if level_number is None:
             return jsonify({"error": "Missing 'level_number' attribute in request body"}), 400
        if not isinstance(level_number, int) or level_number <= 0:
             return jsonify({"error": "'level_number' must be a positive integer"}), 400

        plan_name = plan_name.strip()
        # Construct the key name (e.g., "Level 1") from the number
        level_key = f"Level {level_number}"

        # Step 2: Check if Plan Exists 
        plan_ref = db.collection('Plans').document(plan_name)
        plan_doc = plan_ref.get()

        if not plan_doc.exists:
            return jsonify({"error": f"Plan '{plan_name}' not found"}), 404 # 404 Not Found

        # Step 3: Check if Level Key Already Exists 
        plan_data = plan_doc.to_dict()
        # Check using the constructed key (e.g., "Level 1")
        if level_key in plan_data.get('levels', {}): # Check within the 'levels' map
            return jsonify({"error": f"Level '{level_key}' already exists in plan '{plan_name}'"}), 409 # 409 Conflict

        # Step 4: Add New Level Key and Update Timestamp 
        # Prepare the data to update
        update_data = {
            f'levels.{level_key}': [], # Add the new level field within the 'levels' map
            'last_update_date': datetime.now(timezone.utc) # Update the timestamp
        }

        # Update the document in Firestore
        plan_ref.update(update_data)

        # Step 5: Return Success Response 
        return jsonify({
            "message": f"Level '{level_key}' added successfully to plan '{plan_name}'"
            }), 200 # 200 OK for successful update

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /addPlanLevel for plan '{plan_name if 'plan_name' in locals() else 'unknown'}', level number '{level_number if 'level_number' in locals() else 'unknown'}': {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to add plan level due to an internal server error", "details": str(e)}), 500

@app.route('/addCourseToPlanLevel', methods=['POST'])
@admin_required
def add_course_to_plan_level(decoded_token):
    """
    NOTE goal add course to a plan level
    """
    plan_name = None # Initialize data
    level_identifier = None 
    course_id = None 
    try:
        # Step 1: Get and Validate data
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        plan_name = data.get('plan_name')
        level_identifier = data.get('level_identifier')
        course_id = data.get('course_id') # Course to add/move

        # Basic validation
        if not plan_name or not isinstance(plan_name, str) or not plan_name.strip():
            return jsonify({"error": "Missing or invalid 'plan_name'"}), 400
        if level_identifier is None:
             return jsonify({"error": "Missing 'level_identifier'"}), 400
        if not course_id or not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid 'course_id'"}), 400

        plan_name = plan_name.strip()
        course_id = course_id.strip()

        # --- Validate level_identifier and construct target level_key ---
        target_level_key = None
        if isinstance(level_identifier, int) and level_identifier > 0:
            target_level_key = f"Level {level_identifier}"
        elif isinstance(level_identifier, str) and level_identifier.strip().lower() == "extra":
            target_level_key = "Extra"
        else:
            return jsonify({"error": "'level_identifier' must be a positive integer or the string 'Extra'"}), 400

        # Step 2: Check if Course exists 
        course_ref = db.collection('Courses').document(course_id)
        if not course_ref.get().exists:
             return jsonify({"error": f"Course '{course_id}' not found in Courses collection"}), 404

        # Step 3: Check if Plan and Target Level Key Exist 
        plan_ref = db.collection('Plans').document(plan_name)
        plan_doc = plan_ref.get()

        if not plan_doc.exists:
            return jsonify({"error": f"Plan '{plan_name}' not found"}), 404

        plan_data = plan_doc.to_dict()
        levels_map = plan_data.get('levels', {})

        # Check if target level exists and is a list
        if target_level_key not in levels_map:
            return jsonify({"error": f"Target level '{target_level_key}' does not exist in plan '{plan_name}'. Create it first."}), 404
        if not isinstance(levels_map.get(target_level_key), list):
             return jsonify({"error": f"Target field for level '{target_level_key}' in plan '{plan_name}' is not an array/list."}), 400

        # Step 4: Check if Course Exists in ANOTHER Level 
        old_level_key = None
        for key, value_list in levels_map.items():
            # Check if it's a different level, is a list, and contains the course
            if key != target_level_key and isinstance(value_list, list) and course_id in value_list:
                old_level_key = key
                print(f"INFO: Course '{course_id}' found in existing level '{old_level_key}'. Will move to '{target_level_key}'. E:101")
                break # Found it, no need to check further

        # Step 5: Prepare Update Payload 
        update_data = {}
        message = ""
        frontEndMessage = ""
        # Always add to the target level 
        update_data[f'levels.{target_level_key}'] = firestore.ArrayUnion([course_id])

        # If found in an old level, also remove it from there
        if old_level_key:
            update_data[f'levels.{old_level_key}'] = firestore.ArrayRemove([course_id])
            message = f"Course '{course_id}' moved from level '{old_level_key}' to level '{target_level_key}' in plan '{plan_name}'."
            frontEndMessage ="102"
        else:
            # Check if it was already in the target level (ArrayUnion won't change anything)
            if course_id in levels_map.get(target_level_key, []):
                 message = f"Course '{course_id}' is already present in level '{target_level_key}' of plan '{plan_name}'."
                 frontEndMessage="101"
            else:
                 message = f"Course '{course_id}' added to level '{target_level_key}' in plan '{plan_name}'."


        # Always update the timestamp
        update_data['last_update_date'] = datetime.now(timezone.utc)

        # Step 6: Update the Document 
        # Perform add and potential remove in one atomic operation
        plan_ref.update(update_data)

        # Step 7: Return Success Response 
        return jsonify({"message": message, "frontEndMessage":frontEndMessage,"old_level_key":old_level_key}), 200 # 200 OK

    except Exception as e:
        # Log the error for server-side debugging
        plan_name_local = plan_name if 'plan_name' in locals() else 'unknown'
        level_id_local = level_identifier if 'level_identifier' in locals() else 'unknown'
        course_id_local = course_id if 'course_id' in locals() else 'unknown'
        print(f"Error in /addCourseToPlanLevel for plan '{plan_name_local}', level_identifier '{level_id_local}', course '{course_id_local}': {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to add/move course in plan level due to an internal server error", "details": str(e)}), 500

@app.route('/getPlans', methods=['GET'])
@admin_required 
def get_plans(decoded_token): 
    """
    return a list of all plans from the plans collection
    """
    try:
        # Step 1: Query the Plans Collection 
        plans_ref = db.collection('Plans')
        plans_stream = plans_ref.stream() # Get an iterator for all plan documents

        # Step 2: Format the Plans Data (with sorted levels) 
        #firestore levels map isn't sorted, so we need to sort them
        plans_list = []
        for doc in plans_stream:
            plan_id = doc.id
            plan_data = doc.to_dict()

            # --- Sort the 'levels' map 
            levels_map = plan_data.get('levels', {})
            if isinstance(levels_map, dict): # Proceed only if it's a dictionary

                # Define a key function for sorting level strings
                def sort_level_key(key):
                    if isinstance(key, str):
                        if key.strip().lower() == 'extra':
                            return (float('inf')) # Ensure 'Extra' comes absolutely last
                        if key.startswith('Level ') and key.split(' ')[1].isdigit():
                            return (int(key.split(' ')[1])) # Sort by number first
                    # Handle unexpected keys gracefully - place them before 'Extra'
                    return (float('inf') - 1)

                try:
                    # Sort keys based on the defined function
                    sorted_keys = sorted(levels_map.keys(), key=sort_level_key)
                    # Create a new dictionary preserving the sorted order
                    # (Standard dicts maintain insertion order in Python 3.7+)
                    ordered_levels_map = {key: levels_map[key] for key in sorted_keys}
                    # Replace the original levels map with the sorted one
                    plan_data['levels'] = ordered_levels_map
                except Exception as sort_e:
                    print(f"Warning: Could not sort levels for plan {plan_id}. Error: {sort_e}")
                    # Keep original unsorted levels map if sorting fails
                    plan_data['levels'] = levels_map # Use original if sort fails

            # --- End sorting ---

            # Combine ID and potentially sorted data into a single dictionary
            plan_entry = {
                "plan_id": plan_id,
                **plan_data # Unpack the document data
            }
            plans_list.append(plan_entry)

        # Step 3: Return the Response 
        return jsonify({"plans": plans_list}), 200

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /getPlans: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve plans due to an internal server error", "details": str(e)}), 500

@app.route('/addForm', methods=['POST'])
@admin_required
def add_form(decoded_token): 
    """
    add a new form to the forms collection
    """
    try:
        # Step 1: Get and Validate data
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        # Required fields from request
        required_fields = ["title", "description", "start_date", "end_date", "plan",
                           "max_hours", "max_graduate_hours", "expected_students"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        title = data.get('title')
        description = data.get('description')
        start_date_str = data.get('start_date')
        end_date_str = data.get('end_date')
        plan_id = data.get('plan')
        max_hours = data.get('max_hours')
        max_graduate_hours = data.get('max_graduate_hours')
        expected_students = data.get('expected_students')

        # Basic type validation for string fields
        if not all(isinstance(data.get(field), str) for field in ["title", "description", "start_date", "end_date", "plan"]):
             return jsonify({"error": "Fields 'title', 'description', 'start_date', 'end_date', 'plan' must be strings"}), 400

        # Validate hour limit fields
        if not isinstance(max_hours, int) or max_hours <= 0:
             return jsonify({"error": "'max_hours' must be a positive integer"}), 400
        if not isinstance(max_graduate_hours, int) or max_graduate_hours <= 0:
             return jsonify({"error": "'max_graduate_hours' must be a positive integer"}), 400

        # Validate expected_students
        if not isinstance(expected_students, int) or expected_students < 0:
             return jsonify({"error": "'expected_students' must be a non-negative integer"}), 400

        # Validate date strings and convert to datetime objects
        try:
            start_datetime = datetime.strptime(start_date_str, "%Y-%m-%d")
            end_datetime = datetime.strptime(end_date_str, "%Y-%m-%d")
            if end_datetime < start_datetime:
                 return jsonify({"error": "'end_date' cannot be before 'start_date'"}), 400
            start_timestamp = datetime.combine(start_datetime.date(), datetime.min.time(), tzinfo=timezone.utc)
            end_timestamp = datetime.combine(end_datetime.date(), datetime.min.time(), tzinfo=timezone.utc)
        except ValueError:
            return jsonify({"error": "Invalid date format. Please use YYYY-MM-DD"}), 400

        # Check if the associated plan exists
        plan_ref = db.collection('Plans').document(plan_id)
        if not plan_ref.get().exists:
             return jsonify({"error": f"Associated plan '{plan_id}' not found"}), 404

        # Step 2: Generate Sequential ID 
        forms_ref = db.collection('Forms')
        forms_stream = forms_ref.stream()
        max_id = 0
        for doc in forms_stream:
            try:
                doc_id_int = int(doc.id)
                if doc_id_int > max_id:
                    max_id = doc_id_int
            except ValueError:
                continue # Ignore non-integer IDs

        new_form_id = max_id + 1
        new_form_id_str = str(new_form_id) # Use string representation

        # Step 3: Prepare Form Data 
        form_data = {
            "title": title,
            "description": description,
            "start_date": start_timestamp,
            "end_date": end_timestamp,
            "plan_id": plan_id,
            "max_hours": max_hours,
            "max_graduate_hours": max_graduate_hours,
            "expected_students": expected_students,
            "Form_Responses": {}, # Initialize empty MAP
            "responses": 0, # *** Initialize response counter ***
            "created_at": datetime.now(timezone.utc)
        }

        # Step 4: Create New Form Document 
        form_doc_ref = forms_ref.document(new_form_id_str)
        form_doc_ref.set(form_data)

        # --- 5. Return Success Response ---
        return jsonify({
            "message": "Form created successfully",
            "form_id": new_form_id_str
        }), 201 # 201 Created

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /addForm: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to add form due to an internal server error", "details": str(e)}), 500

@app.route('/getForms', methods=['GET'])
@admin_required 
def get_forms(decoded_token): 
    """
    Retrieves a list of all available forms from the 'Forms' collection. excluding the form responses
    """
    try:
        # Step 1: Query the Forms Collection 
        forms_ref = db.collection('Forms')
        forms_stream = forms_ref.stream() # Get an iterator for all form documents

        # Step 2: Format the Forms Data (excluding responses) 
        forms_list = []
        for doc in forms_stream:
            # Get the document ID 
            form_id = doc.id
            # Get the document data dictionary
            form_data = doc.to_dict()

            # --- Exclude the 'Form_Responses' field ---
            # Use pop() which removes the key if it exists, and does nothing if it doesn't
            form_data.pop('Form_Responses', None)
            # --- End of exclusion ---

            # Combine the form ID and the modified data
            # The **form_data unpacking automatically includes all remaining fields
            # from the Firestore document, including max_hours and max_graduate_hours if they exist.
            form_entry = {
                "form_id": form_id,
                **form_data # Unpack the rest of the form data
            }
            forms_list.append(form_entry)

        # Step 3: return the response
        # Return the list of forms (without responses), even if it's empty
        return jsonify({"forms": forms_list}), 200

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /getForms: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve forms due to an internal server error", "details": str(e)}), 500

@app.route('/editForm', methods=['PATCH']) 
@admin_required
def edit_form(decoded_token): 
    """
    Updates specific fields (title, description, start_date, end_date, etc.) of an existing form.
    """
    form_id = None # Initialize data
    try:
        # Step 1: Get and Validate data
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' (must be a non-empty string)"}), 400
        form_id = form_id.strip()

        # Step 2: Check if Form Exists 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()
        if not form_doc.exists:
             return jsonify({"error": f"Form with ID '{form_id}' not found"}), 404

        # Step 3: Prepare Update Data 
        update_data = {}
        # Include all fields that can be edited now
        allowed_fields = ["title", "description", "start_date", "end_date",
                          "max_hours", "max_graduate_hours", "expected_students"] 
        found_update = False

        # Process optional fields
        if 'title' in data:
            title = data['title']
            if not isinstance(title, str) or not title.strip():
                 return jsonify({"error": "Invalid 'title' (must be a non-empty string)"}), 400
            update_data['title'] = title.strip()
            found_update = True

        if 'description' in data:
            description = data['description']
            if not isinstance(description, str): # Allow empty description
                 return jsonify({"error": "Invalid 'description' (must be a string)"}), 400
            update_data['description'] = description
            found_update = True

        # Process date fields
        if 'start_date' in data:
            start_date_str = data['start_date']
            if not isinstance(start_date_str, str):
                 return jsonify({"error": "Invalid 'start_date' (must be a string)"}), 400
            try:
                start_datetime = datetime.strptime(start_date_str, "%Y-%m-%d")
                # Convert to Firestore Timestamp (UTC)
                update_data['start_date'] = datetime.combine(start_datetime.date(), datetime.min.time(), tzinfo=timezone.utc)
                found_update = True
            except ValueError:
                return jsonify({"error": "Invalid 'start_date' format. Please use YYYY-MM-DD"}), 400

        if 'end_date' in data:
            end_date_str = data['end_date']
            if not isinstance(end_date_str, str):
                 return jsonify({"error": "Invalid 'end_date' (must be a string)"}), 400
            try:
                end_datetime = datetime.strptime(end_date_str, "%Y-%m-%d")
                # Convert to Firestore Timestamp (UTC)
                update_data['end_date'] = datetime.combine(end_datetime.date(), datetime.min.time(), tzinfo=timezone.utc)
                found_update = True
            except ValueError:
                return jsonify({"error": "Invalid 'end_date' format. Please use YYYY-MM-DD"}), 400

        # Process numeric fields added previously to /addForm
        if 'max_hours' in data:
             max_hours = data['max_hours']
             if not isinstance(max_hours, int) or max_hours <= 0:
                  return jsonify({"error": "'max_hours' must be a positive integer"}), 400
             update_data['max_hours'] = max_hours
             found_update = True

        if 'max_graduate_hours' in data:
             max_graduate_hours = data['max_graduate_hours']
             if not isinstance(max_graduate_hours, int) or max_graduate_hours <= 0:
                  return jsonify({"error": "'max_graduate_hours' must be a positive integer"}), 400
             update_data['max_graduate_hours'] = max_graduate_hours
             found_update = True

        if 'expected_students' in data:
             expected_students = data['expected_students']
             if not isinstance(expected_students, int) or expected_students < 0:
                  return jsonify({"error": "'expected_students' must be a non-negative integer"}), 400
             update_data['expected_students'] = expected_students
             found_update = True

        # --- Cross-validate dates IF BOTH were provided in this update request ---
        if 'start_date' in update_data and 'end_date' in update_data:
            if update_data['end_date'] < update_data['start_date']:
                return jsonify({"error": "New 'end_date' cannot be before new 'start_date'"}), 400
        # --- End date cross-validation ---

        # Check if any valid fields were provided for update
        if not found_update:
            # Updated error message to include all editable fields
            return jsonify({"error": f"No valid fields provided for update. Allowed fields: {', '.join(allowed_fields)}"}), 400

        # Add a timestamp for the modification
        update_data['last_modified'] = datetime.now(timezone.utc)

        # Step 4: Perform Update 
        form_ref.update(update_data)

        # Step 5: Return Success Response 
        return jsonify({"message": f"Form '{form_id}' updated successfully"}), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /editForm for form_id '{form_id_local}': {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to edit form due to an internal server error", "details": str(e)}), 500

@app.route('/deleteForm', methods=['POST'])
@admin_required 
def delete_form(decoded_token):
    """
    Deletes a specific form document from the 'Forms' collection.
    """
    try:
        # Step 1: Get form_id from request and validate
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 400
        form_id = form_id.strip()
        # --- End form_id retrieval ---

        # Step 2: Get Document Reference and Check Existence ---
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()

        if not form_doc.exists:
             # If the document doesn't exist, return 404 Not Found
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # Step 3: Delete the Document ---
        form_ref.delete()

        # Step 4: Return Success Response ---
        return jsonify({"message": f"Form '{form_id}' deleted successfully"}), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /deleteForm for form_id {form_id_local}: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to delete form due to an internal server error", "details": str(e)}), 500

@app.route('/deletePlan', methods=['POST'])
@admin_required 
def delete_plan(decoded_token):
    """
    Deletes a specific plan document from the 'Plans' collection.
    """
    try:
        # Step 1: Get plan_id from request and validate 
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        plan_id = data.get('plan_id')

        # Validate plan_id
        if not plan_id or not isinstance(plan_id, str) or not plan_id.strip():
            return jsonify({"error": "Missing or invalid 'plan_id' in request body"}), 400
        plan_id = plan_id.strip()
        # --- End form_id retrieval ---

        # Step 2: Get Document Reference and Check Existence ---
        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()

        if not plan_doc.exists:
             # If the document doesn't exist, return 404 Not Found
             return jsonify({"error": f"plan '{plan_id}' not found"}), 404

        # Step 3: Delete the Document ---
        plan_ref.delete()

        # --- 4. Return Success Response ---
        return jsonify({"message": f"plan '{plan_id}' deleted successfully"}), 200

    except Exception as e:
        # Log the error for server-side debugging
        plan_id_local = plan_id if 'plan_id' in locals() else 'unknown'
        print(f"Error in /deleteplan for plan_id {plan_id_local}: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to delete form due to an internal server error", "details": str(e)}), 500

@app.route('/deleteCourseFromPlan', methods=['POST']) 
@admin_required
def delete_course_from_plan(decoded_token):
    """
    Deletes a specific course_id from a level's list within a plan document.
    """
    try:
        # Step 1: Get data from request body
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400

        plan_id = data.get('plan_id')
        level_identifier = data.get('level_identifier')
        course_id_to_delete = data.get('course_id')

        # Validate inputs
        if not plan_id or not isinstance(plan_id, str) or not plan_id.strip():
            return jsonify({"error": "Missing or invalid 'plan_id'"}), 400
        if level_identifier is None: # Check presence before type check
             return jsonify({"error": "Missing 'level_identifier'"}), 400
        if not course_id_to_delete or not isinstance(course_id_to_delete, str) or not course_id_to_delete.strip():
            return jsonify({"error": "Missing or invalid 'course_id'"}), 400

        plan_id = plan_id.strip()
        course_id_to_delete = course_id_to_delete.strip()

        # --- Construct level_key from level_identifier ---
        level_key = None
        if isinstance(level_identifier, int) and level_identifier > 0:
            level_key = f"Level {level_identifier}"
        elif isinstance(level_identifier, str) and level_identifier.strip().lower() == "extra":
            level_key = "Extra"
        else:
            return jsonify({"error": "'level_identifier' must be a positive integer or the string 'Extra'"}), 400

        # Step 2: Get Plan Document Reference and Check Existence 
        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()

        if not plan_doc.exists:
             return jsonify({"error": f"Plan '{plan_id}' not found"}), 404

        # Step 3: Check if Level and Course Exist within the Plan ---
        plan_data = plan_doc.to_dict()
        levels_map = plan_data.get('levels', {})

        if level_key not in levels_map:
             return jsonify({"error": f"Level '{level_key}' not found in plan '{plan_id}'"}), 404
        if not isinstance(levels_map.get(level_key), list):
             return jsonify({"error": f"Field for level '{level_key}' in plan '{plan_id}' is not a list."}), 409 # Conflict - wrong type

        # Check if the course to delete is actually in the list for that level
        if course_id_to_delete not in levels_map.get(level_key, []):
             return jsonify({"error": f"Course '{course_id_to_delete}' not found in level '{level_key}' of plan '{plan_id}'."}), 404

        # Step 4: Prepare Update Payload 
        update_payload = {
            f'levels.{level_key}': firestore.ArrayRemove([course_id_to_delete]),
            'last_update_date': datetime.now(timezone.utc) # Update timestamp
        }

        # Step 5: Update the Document 
        plan_ref.update(update_payload)

        # Step 6: Return Success Response 
        return jsonify({
            "message": f"Course '{course_id_to_delete}' deleted successfully from level '{level_key}' in plan '{plan_id}'."
        }), 200

    except Exception as e:
        # Log the error for server-side debugging
        plan_id_local = plan_id if 'plan_id' in locals() else 'unknown'
        level_key_local = level_key if 'level_key' in locals() else 'unknown'
        course_id_local = course_id_to_delete if 'course_id_to_delete' in locals() else 'unknown'
        print(f"Error in /deleteCourseFromPlan for plan {plan_id_local}, level {level_key_local}, course {course_id_local}: {e}")
        import traceback
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to delete course from plan due to an internal server error", "details": str(e)}), 500

@app.route('/deleteCourse', methods=['POST'])
@admin_required
def delete_course_completely(decoded_token):
    """
    Deletes a course document from 'Courses' collection AND removes all references
    to it from the 'levels' maps within all 'Plans' documents.
    """
    course_id = None # Initialize data
    try:
        # Step 1: Get course_id from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        course_id = data.get('course_id')

        # Validate course_id
        if not course_id or not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid 'course_id' in request body"}), 400
        course_id = course_id.strip()
        # --- End course_id retrieval ---


        # Step 2: Verify Target Course Exists 
        course_ref = db.collection('Courses').document(course_id)
        course_doc = course_ref.get()
        if not course_doc.exists:
             return jsonify({"error": f"Course '{course_id}' not found"}), 404

        # Step 3: Check if Course is a Prerequisite for Other Courses 
        dependent_courses_query = db.collection('Courses').where('prerequisites', 'array_contains', course_id).limit(1).stream()
        dependent_courses = list(dependent_courses_query)
        if dependent_courses:
            dependent_course_id = dependent_courses[0].id
            return jsonify({
                "error": f"Cannot delete course '{course_id}' because it is listed as a prerequisite for other course(s) (e.g., '{dependent_course_id}'). Please remove dependencies first."
            }), 409 # 409 Conflict

        # Step 4: Prepare Batch Update for Plans 
        batch = db.batch()
        plans_ref = db.collection('Plans')
        plans_stream = plans_ref.stream()
        plans_to_update = False # Flag to check if any plan needs updating

        for plan_doc in plans_stream:
            plan_data = plan_doc.to_dict()
            levels_map = plan_data.get('levels', {})
            plan_needs_update = False # Flag for this specific plan
            update_payload = {} # Payload for this specific plan

            if isinstance(levels_map, dict):
                for level_key, course_list in levels_map.items():
                    if isinstance(course_list, list) and course_id in course_list:
                        # If course found in this level, add remove operation to payload
                        update_payload[f'levels.{level_key}'] = firestore.ArrayRemove([course_id])
                        plan_needs_update = True

            if plan_needs_update:
                 # Add timestamp update only if other fields are updated
                 update_payload['last_update_date'] = firestore.SERVER_TIMESTAMP # Use server timestamp
                 # Add the update operation for this plan to the batch
                 batch.update(plan_doc.reference, update_payload) #add the update to the batch
                 plans_to_update = True # Mark that at least one plan was modified

        # Step 5: Commit Batch Plan Updates 
        if plans_to_update:
            print(f"INFO: Removing course '{course_id}' references from one or more plans.")
            batch.commit() # Atomically update all affected plans
            print(f"INFO: Plan updates committed for course '{course_id}'.")


        # Step 6: Delete the Course Document 
        course_ref.delete()
        print(f"INFO: Course document '{course_id}' deleted.")

        # Step 7: Return Success Response 
        return jsonify({"message": f"Course '{course_id}' and all its references in plans deleted successfully"}), 200

    except Exception as e:
        # Log the error for server-side debugging
        course_id_local = course_id if 'course_id' in locals() else 'unknown'
        print(f"Error in /deleteCourse for course_id {course_id_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to delete course due to an internal server error", "details": str(e)}), 500

@app.route('/getGraduatingStudents', methods=['POST'])
@admin_required 
def get_graduating_students_from_form(decoded_token):
    """
    Retrieves details of students that are graduating according to a specific form
    """
    form_id = None # Initialize data
    try:
        # Step 1: Get form_id from request and validate
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 409
        form_id = form_id.strip()
        

        # Step 2: Fetch Form Document 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()

        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # Step 3: Identify Graduating Student UIDs 
        form_data = form_doc.to_dict()
        form_responses_map = form_data.get('Form_Responses', {})
        graduating_student_uids = []

        if isinstance(form_responses_map, dict):
            for student_uid, response_data in form_responses_map.items():
                #this will loop across every response on the form, because the form_responses is 
                #map that contains key and values, the key is UID, the value is another map
                # Check if response_data is a dict and has the is_graduating flag set to True
                if isinstance(response_data, dict) and response_data.get('is_graduating') is True:
                    graduating_student_uids.append(student_uid)
        else:
             print(f"Warning: Form_Responses field in form {form_id} is not a map.")

        # Step 4: Fetch Details for Graduating Students 
        graduating_students_details = []
        if graduating_student_uids: # Only proceed if we found graduating students
            student_refs = [db.collection('Students').document(uid) for uid in graduating_student_uids]
            student_docs = db.get_all(student_refs) # Fetch student documents in batch

            for student_doc in student_docs:
                if student_doc.exists:
                    student_data = student_doc.to_dict()
                    # Get the University Student ID from the document 
                    university_student_id = student_data.get("Student_ID", "N/A_ID") 

                    student_detail = {
                        "university_student_id": university_student_id,
                        "name": student_data.get("name", "N/A"),
                        "email": student_data.get("email", "N/A"),
                        "gpa": student_data.get("gpa", 0.0) # Default GPA to 0.0 if missing
                    }
                    graduating_students_details.append(student_detail)
                else:
                    # Log if a student UID from responses doesn't have a matching student document
                    print(f"Warning: Student document not found for UID: {student_doc.id} from form {form_id} responses.")
                    


        # Step 5: Return the List with form_id 
        return jsonify({
            "form_id": form_id,
            "graduating_students": graduating_students_details
            }), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /getGraduatingStudents for form {form_id_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve graduating students due to an internal server error", "details": str(e)}), 500

@app.route('/getGraduatingStudentCourses', methods=['POST'])
@admin_required 
def get_graduating_student_courses(decoded_token):
    """
    Retrieves detailed information about the unique courses selected by graduating students within a specific form
    Includes a count of how many graduating students selected each course.
    Returns a map of course data, keyed by course_id. Each value contains
    course details (excluding prerequisites) and the selection count.
    """
    form_id = None # Initialize data
    try:
        # Step 1: Get form_id from request and validate
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 400
        form_id = form_id.strip()
        # --- End form_id retrieval ---

        # Step 2: Fetch Form Document 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()

        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # Step 3: Collect Course Selections & Count from Graduating Students 
        form_data = form_doc.to_dict()
        form_responses_map = form_data.get('Form_Responses', {})
        # Use Counter to store counts for each course ID
        graduating_course_counts = collections.Counter()#this is a map basically, we just updates it with values, the values will be keys, the value with the key will be how many times it got updated
        #this is very useful, we just update then it finds the corresponding key, and increment its counter. so every key has a counter

        if isinstance(form_responses_map, dict):
            for student_uid, response_data in form_responses_map.items():
                # Check if response_data is valid and student is graduating
                if isinstance(response_data, dict) and response_data.get('is_graduating') is True:#this means the response belongs to a graduating student
                    selected_courses = response_data.get('selected_courses', [])
                    if isinstance(selected_courses, list):
                         # Clean and update counts
                         cleaned_courses = [c.strip() for c in selected_courses if isinstance(c, str) and c.strip()]
                         graduating_course_counts.update(cleaned_courses)#the counter will increment the counter of any course here, if its a new course then it creates it.
        else:
             print(f"Warning: Form_Responses field in form {form_id} is not a map.")

        # Get the set of unique course IDs that were selected by graduating students
        unique_course_ids = list(graduating_course_counts.keys())#list of courses graduates wants to study

        # Step 4: Fetch Details for the Collected Course IDs 
        course_details_map_with_count = {}
        if unique_course_ids: # Only proceed if any courses were selected
            course_refs_to_get = [db.collection('Courses').document(cid) for cid in unique_course_ids]
            course_docs = db.get_all(course_refs_to_get) # Fetch course documents in batch

            for course_doc in course_docs:
                course_id = course_doc.id
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    # Extract desired details (excluding prerequisites)
                    details = {
                        "title": course_data.get("course_name", "N/A"), #course name
                        "hours": course_data.get("hours", 0)
                        # Add other relevant course details here if needed
                    }
                    # Combine details and count
                    course_details_map_with_count[course_id] = {#map where keys are the courses students wants, the value associated with the course is its details and how many students want it
                        "details": details,
                        "graduating_student_count": graduating_course_counts.get(course_id, 0) # Get count from Counter
                    }
                else:
                    # Handle case where a selected course ID doesn't exist in Courses collection
                    print(f"Warning: Course document not found for selected ID: {course_id}")
                    course_details_map_with_count[course_id] = {
                         "details": {"error": "Course details not found"},
                         "graduating_student_count": graduating_course_counts.get(course_id, 0)
                    }


        # Step 5: Return the Course Details Map with Counts 
        return jsonify({
            "form_id": form_id,
            "graduating_student_course_selections": course_details_map_with_count
        }), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /getGraduatingStudentCourses for form {form_id_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve graduating student courses due to an internal server error", "details": str(e)}), 500

@app.route('/getFormCourseStats', methods=['POST'])
@admin_required 
def get_form_course_stats(decoded_token):
    """
    Retrieves general statistics for each course selected within a specific form.
    Returns a map where keys are course IDs. Each value contains course details
    (title, hours) and counts for total selections, graduating selections,
    and undergraduate selections.
    """
    form_id = None # Initialize data
    try:
        # Step 1: Get form_id from request and validate
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 409
        form_id = form_id.strip()
        

        # Step 2: Fetch Form Document 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()

        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # Step 3: Calculate Course Counts (Total and Graduating) 
        form_data = form_doc.to_dict()
        form_responses_map = form_data.get('Form_Responses', {})
        course_total_counts = collections.Counter()
        course_graduating_counts = collections.Counter()

        if isinstance(form_responses_map, dict):
            for student_uid, response_data in form_responses_map.items():
                if isinstance(response_data, dict):
                    selected_courses = response_data.get('selected_courses', [])
                    is_graduating = response_data.get('is_graduating') is True # Check the flag

                    if isinstance(selected_courses, list):
                         cleaned_courses = [c.strip() for c in selected_courses if isinstance(c, str) and c.strip()]
                         # Update total counts for all selected courses
                         course_total_counts.update(cleaned_courses)#normal counter for everyone
                         # Update graduating counts only if the flag is true
                         if is_graduating:
                              course_graduating_counts.update(cleaned_courses)#this is a counter for courses that graduating students wants
        else:
             print(f"Warning: Form_Responses field in form {form_id} is not a map.")

        # Get the set of unique course IDs involved
        unique_course_ids = list(course_total_counts.keys())

        # Step 4: Fetch Details for the Involved Course IDs 
        course_stats_map = {}
        if unique_course_ids: # Only proceed if any courses were selected
            course_refs_to_get = [db.collection('Courses').document(cid) for cid in unique_course_ids]
            course_docs = db.get_all(course_refs_to_get) # Fetch course documents in batch

            course_details_temp = {}
            for course_doc in course_docs:
                 if course_doc.exists:
                      course_data = course_doc.to_dict()
                      course_details_temp[course_doc.id] = {
                          "title": course_data.get("course_name", "N/A"),
                          "hours": course_data.get("hours", 0)
                      }
                 else:
                      print(f"Warning: Course document not found for selected ID: {course_doc.id}")
                      course_details_temp[course_doc.id] = {"error": "Course details not found"}

            # Step 5: Combine Details and Counts 
            for course_id in unique_course_ids:
                total_count = course_total_counts.get(course_id, 0)
                graduating_count = course_graduating_counts.get(course_id, 0)
                undergrad_count = total_count - graduating_count # Calculate undergrad count

                course_stats_map[course_id] = {
                    "details": course_details_temp.get(course_id, {"error": "Course details not found"}),
                    "total_selected": total_count,
                    "graduating_selected": graduating_count,
                    "undergraduate_selected": undergrad_count
                }

        # Step 6: Return the Course Statistics Map 
        return jsonify({
            "form_id": form_id,
            "course_stats": course_stats_map
        }), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /getFormCourseStats for form {form_id_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve course statistics due to an internal server error", "details": str(e)}), 500

@app.route('/getCoursePriorityList', methods=['POST'])
@admin_required 
def get_course_priority_list(decoded_token):
    """
    Retrieves a prioritized list of students who selected a specific course in a form.
    Prioritizes graduating students first, then sorts remaining students by GPA descending.
    Returns a sorted list of student objects (university_student_id, name, email, gpa, is_graduating).
    #first we want to return a list containing the information of all students who want to study a certain course
    #the list is just many maps, with each map containing a studnets information.
    #this list is the un priotized list, now just sort this list maps, by using a function that looks at a certain map attributes which is graduating and gpa.
    #then now you have a prioratized list of students with their information who want to study a certain course.
    #now return that list and other things.
    """
    form_id = None # initalizing data and validate as usual
    course_id_target = None 
    try:
        # Step 1: form_id and course_id from request 
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')
        course_id_target = data.get('course_id')

        # Validate inputs
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id'"}), 409
        if not course_id_target or not isinstance(course_id_target, str) or not course_id_target.strip():
            return jsonify({"error": "Missing or invalid 'course_id'"}), 400
        form_id = form_id.strip()
        course_id_target = course_id_target.strip()
        

        # Step 2: Fetch Form Document 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()
        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # Step 3: Identify Students Selecting the Target Course 
        form_data = form_doc.to_dict()
        form_responses_map = form_data.get('Form_Responses', {})
        interested_students_raw = [] # Store {'uid': ..., 'is_graduating': ...}
        #a list of maps of students who want to study the course we are focusing on and if they are graduates or not
        #each entry is a student that we care about and his simple information

        if isinstance(form_responses_map, dict):
            for student_uid, response_data in form_responses_map.items():
                if isinstance(response_data, dict):
                    selected_courses = response_data.get('selected_courses', [])
                    if isinstance(selected_courses, list) and course_id_target in selected_courses:
                         interested_students_raw.append({
                             "uid": student_uid, # Keep track of UID for fetching
                             "is_graduating": response_data.get('is_graduating') is True
                         })
        else:
             print(f"Warning: Form_Responses field in form {form_id} is not a map.")

        # Step 4: Fetch Details for Interested Students 
        #now we want to make a list where each entry represent a student that we care about, but the entry is also a map this time it contains detailed information about the student
        priority_list_unsorted = []
        if interested_students_raw:
            student_uids = [s['uid'] for s in interested_students_raw]
            student_refs = [db.collection('Students').document(uid) for uid in student_uids]
            student_docs = db.get_all(student_refs)

            grad_status_lookup = {s['uid']: s['is_graduating'] for s in interested_students_raw}#for fast checking if the student is a graduate or not, used in sorting

            for student_doc in student_docs:
                if student_doc.exists:
                    student_data = student_doc.to_dict()#get the student information
                    uid = student_doc.id # Firebase UID
                    is_grad = grad_status_lookup.get(uid, False)
                    #  Get the University Student ID from the document 
                    university_student_id = student_data.get("Student_ID", "N/A_ID") # Key from update_student_data

                    student_detail = {
                        "university_student_id": university_student_id,
                        "name": student_data.get("name", "N/A"),
                        "email": student_data.get("email", "N/A"),
                        "gpa": float(student_data.get("gpa", 0.0)),
                        "is_graduating": is_grad
                    }
                    priority_list_unsorted.append(student_detail)#here we are doing our goal in step4 , creating a list of maps , where each map is detailed student information
                else:
                    print(f"Warning: Student document not found for UID: {student_doc.id} who selected course {course_id_target} in form {form_id}.")
                    

        # Step 5: Sort the List by Priority 
        def sort_priority(student):
            is_grad = student.get('is_graduating', False)
            gpa = student.get('gpa', 0.0)
            return (0 if is_grad else 1, -gpa)#we have 2 sorting conditions, if student is graduate he is 0 because ascending order, and its the main thing, after that the gpa but make it negative, again becasue ascending 

        priority_list_sorted = sorted(priority_list_unsorted, key=sort_priority)

        # Step 6: Return the Prioritized List 
        return jsonify({
            "form_id": form_id,
            "course_id": course_id_target,
            "priority_list": priority_list_sorted
        }), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        course_id_local = course_id_target if 'course_id_target' in locals() else 'unknown'
        print(f"Error in /getCoursePriorityList for form {form_id_local}, course {course_id_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve course priority list due to an internal server error", "details": str(e)}), 500

@app.route('/getAllCoursePriorityLists', methods=['POST'])
@admin_required 
def get_all_course_priority_lists(decoded_token):
    """
    Retrieves prioritized lists of students for ALL courses selected within a specific form.
    For each course, prioritizes graduating students first, then sorts remaining students by GPA descending.
    Returns a map where keys are course IDs and values are the sorted priority lists for that course.
    Each student object in the list contains: university_student_id, name, email, gpa, is_graduating.

    this function is similar to the previous function, but this time we do it on all courses
    check previous function for comments and understanding of main functionlity
    # the result should be a dictionary where keys represent courses, the value will be the prioratized list just as the previous function
    """
    form_id = None # initalize data
    try:
        # Step 1: form_id from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id'"}), 409
        form_id = form_id.strip()
        

        # Step 2: Fetch Form Document 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()
        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # Step 3: Aggregate Student Selections per Course 
        form_data = form_doc.to_dict()
        form_responses_map = form_data.get('Form_Responses', {})
        course_student_map = collections.defaultdict(list)#special dictionary, where if there is no key, create it with default value of list 
        all_interested_uids = set() # Keep track of all unique UIDs we need to fetch

        if isinstance(form_responses_map, dict):
            for student_uid, response_data in form_responses_map.items(): #for every response, get the courses that the students wants to study
                if isinstance(response_data, dict):
                    selected_courses = response_data.get('selected_courses', [])
                    is_graduating = response_data.get('is_graduating') is True

                    if isinstance(selected_courses, list):
                         for course_id in selected_courses:#for every course the student want to study
                              if isinstance(course_id, str) and course_id.strip():
                                   cleaned_course_id = course_id.strip()
                                   student_info = {"uid": student_uid, "is_graduating": is_graduating}
                                   course_student_map[cleaned_course_id].append(student_info)# add the student information to the dictionary
                                   #so the course_student_map , is a map, the keys are course id, the value is a list, this list contains many maps , where each map represent a student information who want to study this course
                                   all_interested_uids.add(student_uid) # Add UID to set for batch fetching later
        else:
             print(f"Warning: Form_Responses field in form {form_id} is not a map.")

        # Step 4: Fetch Details for All Involved Students 
        student_details_lookup = {} # Store fetched details: {uid: {name:.., email:.., gpa:.., Student_ID: ...}} this will be used when creating the priority list for fast look up of data
        if all_interested_uids: # Only fetch if there are students
            student_uids_list = list(all_interested_uids)
            student_refs = [db.collection('Students').document(uid) for uid in student_uids_list]
            student_docs = db.get_all(student_refs) # Fetch student documents in batch

            for student_doc in student_docs:
                uid = student_doc.id # Firebase UID
                if student_doc.exists:
                    student_data = student_doc.to_dict()
                    student_details_lookup[uid] = {
                        "name": student_data.get("name", "N/A"),
                        "email": student_data.get("email", "N/A"),
                        "gpa": float(student_data.get("gpa", 0.0)), # Ensure GPA is float
                        # Fetch the University Student ID 
                        "Student_ID": student_data.get("Student_ID", "N/A_ID")
                    }#this is the look up , so know we can get student info details from just using his UID
                else:
                    print(f"Warning: Student document not found for UID: {uid} referenced in form {form_id} responses.")
                    # Store minimal info if profile missing
                    student_details_lookup[uid] = {
                         "name": "Profile Not Found", "email": "N/A", "gpa": 0.0, "Student_ID": "MISSING"
                    }

        # Step 5: Build and Sort Priority List for Each Course 
        all_priority_lists = {}#this is the final priority dictionary , where keys are courses id , and value is PRIORITY list, which contain students maps entries which are sorted.

        # Define the sorting key function once
        def sort_priority(student_entry):
            is_grad = student_entry.get('is_graduating', False)
            gpa = student_entry.get('gpa', 0.0)
            return (0 if is_grad else 1, -gpa) # Graduating first (0), then highest GPA first (-gpa)

        #Iterate through each course that was selected by at least one student
        #for every course we create the priority list for it.
        for course_id, interested_students_raw in course_student_map.items():
            priority_list_unsorted = []
            #now for each student who want to study the current course, interested_students_raw has many maps , every map is a student 
            for student_info in interested_students_raw:
                 #the current map refer to a student 
                 uid = student_info['uid']
                 # Combine fetched details with the graduating status from the response
                 details = student_details_lookup.get(uid, {"name": "Error", "email": "Error", "gpa": 0.0, "Student_ID": "ERROR"}) # Fallback
                 priority_list_unsorted.append({
                     "university_student_id": details["Student_ID"],
                     "name": details["name"],
                     "email": details["email"],
                     "gpa": details["gpa"],
                     "is_graduating": student_info['is_graduating'] # Use status from response
                 })#add the student to the course's priority list currently unsorted

            # Sort the list for this specific course
            priority_list_sorted = sorted(priority_list_unsorted, key=sort_priority)#here sort the priorty list entries which are maps , we sort the maps based on 2 of the keys and their vaules, graduating and gpa
            # Add the sorted list to the final result map
            all_priority_lists[course_id] = priority_list_sorted#add the prioriy list as a value in the map of all priority lists, the key will be the course id 
            #this is how it would look: Map: {course_id: [sorted_student_list]}


        # Step 6: Return the Map of Priority Lists 
        return jsonify({
            "form_id": form_id,
            "course_priority_lists": all_priority_lists 
        }), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /getAllCoursePriorityLists for form {form_id_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve all course priority lists due to an internal server error", "details": str(e)}), 500

@app.route('/generateSectionSchedule', methods=['POST'])
@admin_required
def generate_section_schedule(decoded_token):
    """
    Gathers data, prepares and sends a prompt to a Generative AI API
    to generate a section schedule recommendation using the genai.Client structure.
    Returns the structured JSON response from the LLM API.
    Uses the 'gemini-2.0-flash' model currently
    """
    form_id = None
    model_name = None # Initialize data
    try:
        # Step 1: Get data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')
        section_capacity = data.get('section_capacity', 25)
        
        time_preference = data.get('time_preference', "MorningAndAfternoonFocus")
        # Validate data
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id'"}), 409
        if not isinstance(section_capacity, int) or section_capacity <= 0:
             return jsonify({"error": "'section_capacity' must be a positive integer"}), 400
        valid_preferences = ["MorningAndAfternoonFocus", "AfternoonAndEveningFocus"]
        if time_preference not in valid_preferences:
             return jsonify({"error": f"Invalid 'time_preference'. Valid options: {valid_preferences}"}), 400
        form_id = form_id.strip()

        # Step 2: Fetch Form & Plan Info 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()#form document
        if not form_doc.exists: return jsonify({"error": f"Form '{form_id}' not found"}), 404
        form_data = form_doc.to_dict()#form dictionary
        plan_id = form_data.get('plan_id')
        if not plan_id: return jsonify({"error": "Form missing 'plan_id'"}), 500

        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()#plan snapshot document
        if not plan_doc.exists: return jsonify({"error": f"Plan '{plan_id}' not found"}), 404
        plan_data = plan_doc.to_dict()#plan data or dictionary
        levels_map = plan_data.get('levels', {})

        # Step 3: Get Course Demand (Filtering by Prefix) 
        form_responses_map = form_data.get('Form_Responses', {})
        course_demand = collections.Counter()
        relevant_course_prefixes = ("CPIT", "CPIS", "CPCS")#we only do recommendations for Faculty courses

        if isinstance(form_responses_map, dict):
            for response_data in form_responses_map.values():#for every resposne in the form
                if isinstance(response_data, dict):
                    selected = response_data.get('selected_courses', [])
                    if isinstance(selected, list):
                        cleaned = [c.strip() for c in selected if isinstance(c, str) and c.strip().startswith(relevant_course_prefixes)]#clean selected courses list
                        course_demand.update(cleaned)#here we increment the counter of every course, 

        relevant_course_ids = list(course_demand.keys())#a list of courses which students wants
        if not relevant_course_ids:
             return jsonify({"message": "No relevant course selections found in this form.", "schedule_assignments": {}}), 200

        # Step 4: Fetch Course Details (Hours) & Calculate Sections Needed 
        courses_info = {}# a map of courses needed and the details
        course_refs_to_get = [db.collection('Courses').document(cid) for cid in relevant_course_ids]
        course_docs = db.get_all(course_refs_to_get)#get courses documents

        for course_doc in course_docs:
            if course_doc.exists:
                course_id = course_doc.id
                c_data = course_doc.to_dict()
                hours = c_data.get('hours')
                if isinstance(hours, int) and hours > 0:
                     demand = course_demand.get(course_id, 0)
                     num_sections = math.ceil(demand / section_capacity) if demand > 0 else 0
                     if num_sections > 0:
                          courses_info[course_id] = {
                              "title": c_data.get("course_name", "N/A"),
                              "hours": hours,
                              "demand": demand,
                              "sections_needed": num_sections
                          }
                else: print(f"Warning: Course {course_id} has invalid/missing hours.")
            else: print(f"Warning: Course {course_doc.id} not found in Courses collection.")

        if not courses_info:
             return jsonify({"message": "No valid courses requiring sections found.", "schedule_assignments": {}}), 200

        # Step 5: Map Courses to Levels 
        course_levels = collections.defaultdict(list)#this will contain a map, where the keys are numbers or extra basically, and the values are a list of courses.
        #so basically you can use it to ask : level 1 what courses are in it ? and you get a list of the courses in level 1 by using key 1
        #will be useful for ai to know the couses in each level, to try and make less conflicts between them
        for level_key, courses in levels_map.items():#level 1: [CPIT250,etc] for every level in the plan
             if isinstance(courses, list):
                  level_num_str = level_key.split(' ')[1] if level_key.startswith('Level ') and len(level_key.split(' ')) > 1 and level_key.split(' ')[1].isdigit() else 'Extra'#the current level as string but number or Extra
                  for course_id in courses:#for every course in the level
                       if course_id in courses_info:#if the course is a key in the courses info , meaning its a course that students want
                            course_levels[level_num_str].append(course_id)#

        # Step 6: Generate Available Time Slots 
        slots_50_min, slots_80_min = generate_time_slots()

        # Step 7 : Structure Data for Prompt 
        # Dynamically set time constraint text based on the two valid preferences
        if time_preference == "MorningAndAfternoonFocus":
            time_constraint_text = "Time preference: Strongly focus scheduling sections in the Morning (before 12 PM) and Afternoon (1 PM to 5 PM / 13:00-17:00)."
        elif time_preference == "AfternoonAndEveningFocus":
            time_constraint_text = "Time preference: Strongly focus scheduling sections in the Afternoon (1 PM to 5 PM / 13:00-17:00) and Early Evening (5 PM to 8 PM / 17:00-20:00)."
        else: # Fallback just in case
             time_constraint_text = "Time preference: General distribution."

        # Construct the prompt_data dictionary with refined constraints
        #prompt contains lots of infromation we gathered
        prompt_data = {
            "goal": "Generate a weekly class schedule assigning time slots to course sections.",
            "constraints": [
                f"Default section capacity: {section_capacity} students.",
                time_constraint_text,
                "Prioritize minimizing time conflicts between sections of different courses listed in the same 'level_groupings' entry. Maximize non-conflicting options.",
                "To satisfy the time preference efficiently, reuse popular time slots within the preferred time blocks across different sections (even for the same course) where possible.",
                "3-credit courses require exactly three 50-min slots (Sun/Tue/Thu) OR exactly two 80-min slots (Mon/Wed).",
                "2-credit courses require exactly two 50-min slots (Sun/Tue/Thu).",
                "The same time slots are given across compatible days to a course section"
            ],
            "courses_to_schedule": [
                {"course_id": cid, **info} for cid, info in courses_info.items()#here we put all the courses and their details including required sections, demand things we calculated
            ],
            "level_groupings": dict(course_levels),
            "available_50_min_slots": slots_50_min,
            "available_80_min_slots": slots_80_min,
            "desired_output_format": { # Explicitly defined
                "description": "A JSON object where keys are course IDs. Each value is a list of sections for that course. Each section has a unique name (e.g., COURSE_ID-1, COURSE_ID-2) and a list of assigned time slots (day, start, end).",
                "example": {
                    "CPIT-XXX": [{"section_name": "CPIT-XXX-1", "slots": [{"day": "Mon", "start": "HH:MM", "end": "HH:MM"}, {"day":"Wed", "start":"HH:MM", "end":"HH:MM"}]},{"section_name": "CPIT-XXX-2", "slots": []}],
                    "CPIT-YYY": [{"section_name": "CPIT-YYY-1", "slots": [{"day": "Sun", "start": "HH:MM", "end": "HH:MM"}, {"day":"Tue", "start":"HH:MM", "end":"HH:MM"}, {"day":"Thu", "start":"HH:MM", "end":"HH:MM"}]}]
                }
            }
        }
        prompt_string = f"""
        Please generate a weekly class schedule based on the following data and constraints.
        Ensure the output is a valid JSON object matching the 'desired_output_format'.

        Data and Constraints:
        {json.dumps(prompt_data, indent=2)}#turn python dictionary into string that is json formatted, indent is to make it human readable
        """

        # Step 8:  Call External LLM API (Using Client structure) 
        
        generated_schedule = None
        try:
            import google.generativeai as genai
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY environment variable not set.")

            print("--- Initializing genai.Client ---")
            client = genai.Client(api_key=api_key)#create a clinet object, and we put the api key in the parameter

            model_name = 'gemini-2.0-flash' # we are using this model for its speed and capabilites
            

            response = client.models.generate_content(
                model=model_name,
                contents=prompt_string
            )#here we are sending the prompt and request to the AI API
            

            # Process Response 
            schedule_json_string = response.text#extract the string of the response, it should be json according to our prompt
            if schedule_json_string.startswith("```json"):
                 schedule_json_string = schedule_json_string[7:]
            if schedule_json_string.endswith("```"):
                 schedule_json_string = schedule_json_string[:-3]
            schedule_json_string = schedule_json_string.strip()#we do some cleaning of the string and only take the main part, which is the actual json, so now its a string that looks like a json

            generated_schedule = json.loads(schedule_json_string)#convert the string into a corresponding python object e.g: list, dictionary whatever is fitting and it should be dictionary

            # Basic Validation of LLM Response 
            if not isinstance(generated_schedule, dict):
                 #if we enter here,this means we failed to parse the string that looks like json into python dictionary
                 print(f"LLM response was not a valid JSON object (dictionary). Response:\n{response.text}")
                 raise ValueError("LLM response was not structured as expected (not a dictionary).")
            

        except ImportError as imp_err:
             print(f"ImportError: {imp_err}")
             print("Could not import 'genai' from 'google'. Ensure correct library (e.g., 'google-cloud-aiplatform') is installed.")
             traceback.print_exc()
             return jsonify({"error": "ImportError: Required library structure not found.", "details": str(imp_err)}), 500
        except AttributeError as attr_err:
             print(f"AttributeError calling API: {attr_err}")
             print("Library structure mismatch (e.g., genai.Client or client.models.generate_content). Ensure correct library/version.")
             traceback.print_exc()
             return jsonify({"error": "AttributeError: Library structure mismatch.", "details": str(attr_err)}), 500
        except Exception as api_e:
            print(f"Error calling or processing Generative AI API response: {api_e}")
            traceback.print_exc()
            error_detail = str(api_e)
            status_code = 503
            if "API key not valid" in error_detail:
                 error_message = "AI service authentication failed. Check API key or try Application Default Credentials."
            elif "is not found" in error_detail or "is not supported" in error_detail or "permission" in error_detail.lower():
                 error_message = f"Model name/version '{model_name}' not found, not supported, or permission denied. Check model name or authentication (API Key / ADC)."
            else:
                 error_message = "Failed to get response from AI service."
            return jsonify({"error": error_message, "details": error_detail}), status_code

        if generated_schedule is None:# if its none, then try to figure out from the resopnse what happened, there are attibutes in the respnose that came from gemini api such as promptfeedback , 
             try:
                  feedback = getattr(response, 'prompt_feedback', None)
                  if feedback and getattr(feedback, 'block_reason', None):#check if that feedback object got an attribute called block reason, it might help us figure out why the promt was blocked
                       block_reason = feedback.block_reason.name
                       print(f"LLM call blocked due to safety settings: {block_reason}")
                       return jsonify({"error": f"Request blocked by AI safety filters: {block_reason}"}), 400
             except Exception: pass
             return jsonify({"error": "Failed to get schedule from AI service (unknown reason)."}), 503
        
        

        
        # Step 9: Return Generated Schedule 
        return jsonify({
            "form_id": form_id,
            "schedule_preference": time_preference,
            "section_assignments": generated_schedule
        }), 200

    except Exception as e:
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /generateSectionSchedule for form {form_id_local}: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to generate section schedule due to an internal server error", "details": str(e)}), 500

#End of Admin Functions Section _______________

#Students Functions Section _______________

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
    
    # Get the matching document
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
        
        # Delete the token file
        db.collection('otp_tokens').document(uid).delete()
        
        return jsonify({"message": "Update successful"}), 200
    
    except ValueError as e:
        # Notify and stop if an error occurs in update_student_data
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({"error": "An unexpected error occurred: " + str(e)}), 500

def update_student_data(uid):
    """
    Parses HTML from the request, extracts student academic info, personal information such as gpa, hours (completed,exchanged,gpa,registerd) 
    and courses information (completed, equivalent, and registerd courses)also we map the major
    to English, then we update the student document in Firestore, this funcion will be Called by handle_extension_update.
    """
    MAJOR_MAPPING = {
        "تقنية المعلومات": "IT",
        "نظم المعلومات": "IS",
        "علوم الحاسبات": "CS"# add major mapping as majors in odus are written in arabic and we need english 
    }
    
    # Access the HTML from the Flask request body
    html = request.data.decode('utf-8')
    if not html:
        raise ValueError("No HTML provided")

    # Reference to the student document in Firestore
    student_document = db.collection('Students').document(uid)

    # Parse HTML
    soup = BeautifulSoup(html, 'html.parser')

    # General info extraction
    general_info = {}
    finished_courses = [] # Initialize list for finished/equivalent/current courses
    currently_registered_courses_set = set() # Use a set for uniqueness of current courses

    # Find Specific Tables 
    academic_table = None
    transcript_tables = []
    equivalent_courses_table = None
    current_courses_table = None # Table for currently registered courses

    # Find Academic Info Table based on its specific preceding header
    academic_header = soup.find(lambda tag: tag.name == 'td' and tag.get('class') == ['pldefault'] and 'معلومات الطالب الاكاديمية' in tag.text)
    if academic_header:
        # Find the next table sibling after the header's parent table
        parent_table = academic_header.find_parent('table')
        if parent_table:
            academic_table = parent_table.find_next_sibling('table', class_='datadisplaytable')
            if academic_table:
                print("Found Academic Info table.")

    # Find Current Schedule Table based on its specific preceding header
    current_schedule_header = soup.find(lambda tag: tag.name == 'td' and tag.get('class') == ['pldefault'] and 'الجدول الدراسي' in tag.text)
    if current_schedule_header:
        # Find the next table sibling after the header's parent table
        parent_table = current_schedule_header.find_parent('table')
        if parent_table:
             # The actual schedule table might be after a <br>, so find the next table of the correct class
             current_courses_table = parent_table.find_next_sibling('table', class_='datadisplaytable')
             if current_courses_table:
                  print("Found Currently Registered Courses table.")

    # Find Equivalent Courses Table based on its specific preceding header
    equivalent_header = soup.find(lambda tag: tag.name == 'td' and tag.get('class') == ['pldefault'] and 'المقررات المعادلة' in tag.text)
    if equivalent_header:
        parent_table = equivalent_header.find_parent('table')
        if parent_table:
            equivalent_courses_table = parent_table.find_next_sibling('table', class_='datadisplaytable')
            if equivalent_courses_table:
                print("Found Equivalent Courses table.")

    # Find Transcript Tables (based on headers within the table)
    all_data_tables = soup.find_all('table', class_='datadisplaytable')
    for table in all_data_tables:
        # Avoid re-processing tables we already identified
        if table == academic_table or table == current_courses_table or table == equivalent_courses_table:
            continue
        headers = [th.text.strip() for th in table.find_all('th', class_='ddheader')]
        if 'مسجلة' in headers and 'مجتازة' in headers and 'التقدير' in headers:
            # Check if it's preceded by a semester header like "الفصل الدراسي"
            semester_header = table.find_previous('td', class_='dddefault')
            if semester_header and semester_header.find('font', color='FF0000'): # Look for red font semester header
                 transcript_tables.append(table)
                 

    # Step 1: Process Academic Info Table 
    if academic_table:
        rows = academic_table.find_all('tr')
        for row in rows:
            ths = row.find_all('th', class_='ddheader')
            tds = row.find_all('td', class_='dddefault')
            for i in range(len(ths)):
                key = ths[i].text.strip()
                value = tds[i].text.strip()
                if key == 'رقم الطالب': general_info['Student_ID'] = value
                elif key == 'التخصص': general_info['major'] = value
                elif key == 'الساعات المسجلة': general_info['hours_registered'] = int(value) if value.isdigit() else 0
                elif key == 'الساعات المجتازة': general_info['hours_completed'] = int(value) if value.isdigit() else 0
                elif key == 'ساعات المعدل': general_info['gpa_hours'] = int(value) if value.isdigit() else 0
                elif key == 'الساعات المحولة': general_info['hours_exchanged'] = int(value) if value.isdigit() else 0
                elif key == 'المعدل':
                    try: general_info['gpa'] = float(value)
                    except ValueError: general_info['gpa'] = 0.0
    else:
        print("Warning: Academic table not found")


    # Step 2: Process Transcript Tables (Finished Courses) 
    for table in transcript_tables:
        rows = table.find_all('tr')[1:]
        for row in rows:
            cols = row.find_all('td', class_='dddefault')
            if len(cols) >= 7:
                dept = cols[0].text.strip()
                course_num = cols[1].text.strip()
                if dept and course_num:
                     course_code = f"{dept}-{course_num}"
                     try:
                          hours_registered = int(cols[3].text.strip())
                          hours_passed = int(cols[4].text.strip())
                     except ValueError: continue
                     grade = cols[6].text.strip()
                     if hours_passed == hours_registered and grade not in ['F', 'W','DN', 'IC', 'IP']:
                          if course_code not in finished_courses:
                               finished_courses.append(course_code)

    # Step 3: Process Equivalent Courses Table 
    if equivalent_courses_table:
        rows = equivalent_courses_table.find_all('tr')[1:]
        for row in rows:
            cols = row.find_all('td', class_='dddefault')
            if len(cols) >= 2:
                dept = cols[0].text.strip()
                course_num = cols[1].text.strip()
                if dept and course_num:
                     course_code = f"{dept}-{course_num}"
                     if course_code not in finished_courses:
                          finished_courses.append(course_code)

    # Step 4: Process Currently Registered Courses Table 
    if current_courses_table:
        print("Processing 'Currently Registered Courses' table...")
        headers = [th.text.strip() for th in current_courses_table.find_all('th', class_='ddheader')]
        try:
            course_col_index = headers.index('المقرر')
            rows = current_courses_table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td', class_='dddefault')
                if len(cols) > course_col_index:
                    course_code = cols[course_col_index].text.strip()
                    if course_code and '-' in course_code: # Basic validation
                        currently_registered_courses_set.add(course_code)
                    else:
                        print(f"Warning: Skipping potential course code '{course_code}' from current schedule table (unexpected format).")
        except ValueError:
             print("Warning: Could not find 'المقرر' column header in the current courses table.")
        except Exception as e:
             print(f"Error processing current courses table: {e}")
             traceback.print_exc()
    else:
        print("Warning: 'Currently Registered Courses' table not found or identified.")
    

    # Combine current courses 
    for course_code in currently_registered_courses_set:
        if course_code not in finished_courses:
            finished_courses.append(course_code)
    # --- End Combining ---


    # Step 5:  Apply Major Mapping 
    arabic_major = general_info.get("major", "")
    english_major = MAJOR_MAPPING.get(arabic_major, arabic_major) # Default to original if no mapping
    print(f"Mapping major: '{arabic_major}' -> '{english_major}'")
    # --- End Mapping ---

    # Step 6: Prepare Final Update Data 
    doc = student_document.get()
    if not doc.exists:
        raise ValueError("Student not found")

    existing_data = doc.to_dict()
    name_str = existing_data.get("name", "") # Preserve existing name

    updated_data = {
        "Student_ID": general_info.get('Student_ID', ''),
        "hours": {
            "registered": general_info.get('hours_registered', 0),
            "completed": general_info.get('hours_completed', 0),
            "gpa": general_info.get('gpa_hours', 0),
            "exchanged": general_info.get('hours_exchanged', 0)
        },
        "gpa": general_info.get('gpa', 0.0),
        "name": name_str,
        "major": english_major,
        "Finished_Courses": sorted(list(set(finished_courses))), # Ensure uniqueness and sort
        "last_updated": datetime.now(timezone.utc)
    }

    # Step 7: Update Firestore 
    student_document.set(updated_data, merge=True) # Use merge=True to not remove old info

    print(f"Finished Courses (including current): {len(finished_courses)}")
    print("Updated Firestore document with data:", {k: v for k, v in updated_data.items() if k != 'Finished_Courses'}, f"Finished_Courses count: {len(updated_data['Finished_Courses'])}")

@app.route('/getMyForms', methods=['GET'])
@token_required 
def get_my_forms(decoded_token): 
    """
    Retrieves a list of forms relevant to the calling student, that are currently active and has the same major.
    """
    uid = None # Initialize data
    try:
        # Step 1: Get Student's UID and Major and validate data
        uid = decoded_token.get('uid')
        if not uid:
             return jsonify({"error": "UID not found in token"}), 400

        # Fetch the student's document
        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()

        if not student_doc.exists:
             return jsonify({"error": "Student profile not found"}), 404

        student_data = student_doc.to_dict()
        student_major = student_data.get('major')

        if not student_major:
             print(f"Warning: Student {uid} has no major assigned.")
             return jsonify({"forms": []}), 200 # Return empty list if no major

        # Step 2: Query All Forms 
        forms_ref = db.collection('Forms')
        forms_stream = forms_ref.stream()
        current_time_utc = datetime.now(timezone.utc) # Get current time 

        # Step 3: Filter Forms by Major, Start Date, End Date and Format Data 
        relevant_forms_list = []
        for doc in forms_stream:
            form_id = doc.id
            form_data = doc.to_dict()

            form_plan_id = form_data.get('plan_id')
            form_start_date = form_data.get('start_date') # Timestamps from Firestore
            form_end_date = form_data.get('end_date')     

            # Check 1: student must have the same Major 
            if form_plan_id == student_major:

                # Check 2 and 3: Form is Active (Started AND Not Ended) 
                # Ensure form dates are valid datetime objects so we can compare with current datetime 
                if isinstance(form_start_date, datetime) and isinstance(form_end_date, datetime):
                    # Make sure comparison is timezone-aware (Firestore Timestamps usually are UTC)
                    form_start_date_utc = form_start_date.replace(tzinfo=timezone.utc) if form_start_date.tzinfo is None else form_start_date
                    form_end_date_utc = form_end_date.replace(tzinfo=timezone.utc) if form_end_date.tzinfo is None else form_end_date

                    # Check if current time is within the start and end dates
                    if current_time_utc >= form_start_date_utc and current_time_utc < form_end_date_utc:
                        # all checks are good. now add get rid of form responses attribute from the document snapshot object
                        #then make a python dictionary that will represent the form, it contains the form id, and the rest of the form data
                        form_data.pop('Form_Responses', None) # we don't need responses
                        form_entry = {
                            "form_id": form_id,
                            **form_data # Unpack the rest of the form data
                        }
                        relevant_forms_list.append(form_entry) #then add it to the list of relevant forms
                    # else: Form hasn't started or has already ended, skip
                else:
                    # Log forms with invalid dates but don't crash
                    print(f"Warning: Form {form_id} has invalid or missing 'start_date' or 'end_date'. Skipping.")
            # End Checks 

        # Step 4:  Return the Response 
        # Return the filtered list of forms
        return jsonify({"forms": relevant_forms_list}), 200

    except Exception as e:
        # Log the error for server-side debugging
        uid_local = uid if 'uid' in locals() and uid else 'unknown'
        print(f"Error in /getMyForms for user {uid_local}: {e}")
        traceback.print_exc()
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve student forms due to an internal server error", "details": str(e)}), 500

@app.route('/getFormCourses', methods=['POST'])
@token_required
def get_form_courses(decoded_token):
    """
    Retrieves courses associated with a specific form, filtered for the calling student.
    check 1 : ensure that student file was updated after the start date of form. for uptodate information
    return: we will return many lists of courses such as available, unavailable (prereqs not met), 
    unavailable (finished),recommended courses, 
    student's previously selected courses, and the form's max_graduate_hours limit,
    and a map of available course IDs to their credit hours.
    Recommendations prioritize 'important' courses (prerequisites for others)
    from the earliest available level to follow the plan.
    """
    form_id = None # Initialize data
    uid = None 
    try:
        # Step 1: Get form_id from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 400
        form_id = form_id.strip()
        

        # Step 2: extract Student UID and Data 
        uid = decoded_token.get('uid')
        if not uid:
             return jsonify({"error": "UID not found in token"}), 400

        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()
        if not student_doc.exists:
             return jsonify({"error": "Student profile not found"}), 404

        student_data = student_doc.to_dict()
        # Use a set for efficient prerequisite checking
        finished_courses_set = set(student_data.get('Finished_Courses', []))
        student_last_updated = student_data.get('last_updated') # Get student's last update time

        # Step 3: Get Form Data 
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()
        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        form_data = form_doc.to_dict()
        plan_id = form_data.get('plan_id')
        form_start_date = form_data.get('start_date') # Get form start date
        max_graduate_hours_from_form = form_data.get('max_graduate_hours')

        #validate data
        if not plan_id:
             return jsonify({"error": f"Form '{form_id}' does not have an associated plan_id"}), 400
        # Ensure form_start_date is a datetime object (Timestamp from Firestore)
        if not isinstance(form_start_date, datetime):
            print(f"Warning: Form {form_id} has invalid/missing 'start_date'. Type: {type(form_start_date)}")
            return jsonify({"error": "Form configuration is incomplete or invalid (start_date)."}), 500
        # Ensure max_graduate_hours was found and is an int (added in /addForm)
        if not isinstance(max_graduate_hours_from_form, int):
             print(f"Warning: Form {form_id} has invalid/missing 'max_graduate_hours'.")
             return jsonify({"error": "Form configuration is incomplete or invalid (max_graduate_hours)."}), 500

        # Check 1 : Validate Student Data Freshness 
        if not isinstance(student_last_updated, datetime):
            return jsonify({"error": "Please update your academic record using the extension before accessing this form."}), 403

        form_start_date_utc = form_start_date.replace(tzinfo=timezone.utc) if form_start_date.tzinfo is None else form_start_date
        student_last_updated_utc = student_last_updated.replace(tzinfo=timezone.utc) if student_last_updated.tzinfo is None else student_last_updated

        #student last update date for data , must be after form start date, for upto date information
        if student_last_updated_utc <= form_start_date_utc:
            return jsonify({"error": "Your academic record is outdated relative to this form. Please update it using the extension."}), 403
        # End Freshness Check 

        # Step 4: Get Previous Response, to ensure student response is saved and not start halucinating
        previously_selected_courses = []
        form_responses_map = form_data.get('Form_Responses', {})
        if isinstance(form_responses_map, dict):
            student_previous_response = form_responses_map.get(uid)
            if isinstance(student_previous_response, dict):
                courses = student_previous_response.get('selected_courses', [])
                if isinstance(courses, list):
                     previously_selected_courses = courses

        # Step 5: Get Plan Structure 
        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()
        if not plan_doc.exists:
             return jsonify({"error": f"Plan '{plan_id}' associated with form '{form_id}' not found"}), 404

        plan_data = plan_doc.to_dict()
        levels_map = plan_data.get('levels', {})#level map will be useful.
        if not levels_map:
             return jsonify({"error": f"Plan '{plan_id}' has no levels defined"}), 400

        # Step 6: Extract All Courses from Plan & Store Level Info 
        #we create here 3 things that are useful for us
        #1- a list of all courses Id in the plan
        #2- a map for fast mapping a course id to its level, so If I type CPIT250, I get immediately the level the course is in.
        #3- level order is a map, that has the level keys as keys, and the value to them is just their order in numbers , so "level 1" key will have value 1, etc. but for extra we will have a number that actually represent its order.
        all_plan_courses_with_level = []
        level_order = {}
        level_counter = 1
        sorted_level_keys = sorted(levels_map.keys(), key=lambda k: int(k.split(' ')[1]) if k.startswith('Level ') and k.split(' ')[1].isdigit() else float('inf'))

        for level_key in sorted_level_keys:
            courses = levels_map[level_key]#a list of courses inside the level
            if not isinstance(courses, list): continue
            level_order[level_key] = level_counter
            level_counter += 1

            for course_id in courses:#this will create a map that I can use for fast info on the level of a certain course
                 if isinstance(course_id, str):
                      all_plan_courses_with_level.append((course_id, level_key))

        all_plan_course_ids = list(set(c[0] for c in all_plan_courses_with_level))

        # Step 7: Fetch Details (Prereqs & Hours) for All Plan Courses 
        # Store details in a map for easy lookup later
        course_details_map = {} # {course_id: {"hours": H, "prerequisites": [...]}}
        if all_plan_course_ids:
             course_refs_to_get = [db.collection('Courses').document(cid) for cid in all_plan_course_ids]
             course_docs = db.get_all(course_refs_to_get)

             for course_doc in course_docs:
                  if course_doc.exists:
                       course_id = course_doc.id
                       course_data = course_doc.to_dict()
                       prereqs = course_data.get('prerequisites', [])
                       hours = course_data.get('hours', 0) # Default hours to 0 if missing
                       # Store details
                       course_details_map[course_id] = {
                           "hours": hours if isinstance(hours, int) else 0, # Ensure hours is int
                           "prerequisites": prereqs if isinstance(prereqs, list) else [] # Ensure prereqs is list
                       }
                  else:
                       print(f"Warning: Course document {course_doc.id} mentioned in plan {plan_id} not found in Courses collection.")
                       # Store placeholder if course doc missing
                       course_details_map[course_doc.id] = {"hours": 0, "prerequisites": []}


        # Step 8: Calculate Dependency Count 
        dependency_count = collections.defaultdict(int)#here we create a dictionary, the keys will be courses , the value is the dependency count, 
        #this is special dictionary that would create a key if it doesn't exist , instead of giving error if it doesn't exist, removes the need to check before adding
        for course_id in all_plan_course_ids:
            for other_course_id in all_plan_course_ids:
                 #for every course , we check every other course, if the other course has the current course in his preerquisute list, then increment the depencdy count of the current course
                 if other_course_id == course_id: continue
                 # Use the fetched details map
                 prereqs = course_details_map.get(other_course_id, {}).get("prerequisites", [])
                 if course_id in prereqs:
                      dependency_count[course_id] += 1

        # Step 9: Filter Courses for the Student 
        available_courses = []
        unavailable_prereqs = []
        unavailable_finished = []

        for course_id in all_plan_course_ids:
            if course_id in finished_courses_set:
                 #student has finished current course
                 unavailable_finished.append(course_id)
                 continue

            # Use the fetched details map for prerequisites
            prereqs_for_course = set(course_details_map.get(course_id, {}).get("prerequisites", []))#fetch course pre
            if prereqs_for_course.issubset(finished_courses_set):#here we check if the student has finished every prerequiust for the current course
                 #if we enter here , then yes its available
                 available_courses.append(course_id)
            else:
                 #if we enter here , he didn't finish one of the pre
                 missing_prereqs = list(prereqs_for_course - finished_courses_set)#here we just make a list of the pre that he didn't finish
                 unavailable_prereqs.append({"course_id": course_id, "missing": missing_prereqs})


        # Step 10: Recommendation Logic 
        recommended_courses = []
        min_level_num = float('inf')#here we just set the lowest level to the highest for iniatlization 
        available_courses_set = set(available_courses)
        
        #go through every available course, look at its level and find the lowest level as number
        if available_courses:
            for course_id, level_key in all_plan_courses_with_level:#for every course and its level
                 if course_id in available_courses_set:
                      level_num = level_order.get(level_key, float('inf'))#here we just get the level of the course that is available as a number
                      min_level_num = min(min_level_num, level_num)#

        #if the lowest leven isn't infinity, go through every course, if the course is available, and its level is the lowest level we find,
        #and if the course has other courses depending on it, add it to the list of recommended courses
        if min_level_num != float('inf'):
             for course_id, level_key in all_plan_courses_with_level:
                  if (course_id in available_courses_set and
                          level_order.get(level_key) == min_level_num and
                          dependency_count.get(course_id, 0) > 0):
                       recommended_courses.append(course_id) #

        recommended_courses = list(set(recommended_courses))#here just make sure there are no repeating values

        if not recommended_courses and available_courses:
            print(f"INFO: No important courses found in earliest level ({min_level_num}). Falling back to highest dependency available courses.")
            #if we enter here, this means recommended courses is missing and there are available courses
            #if no courses in the lowest level has dependency count, then recommended courses depend on dependency count
            available_with_deps = [(c_id, dependency_count.get(c_id, 0)) for c_id in available_courses]#create a list of tuples with course id , dependency count
            #the sorting is like this : for every item (tuple) in the list, the resulting number that will be used for sorting him will be the second value in the tuple, meaning its dependency count, also the sorting is reversed meaning its descending, so 
            #tupels will be sorted from highest to lowest, 
            available_with_deps.sort(key=lambda item: item[1], reverse=True)
            #here for each tuple in the list, just get the first courseid, then the recommended courses list will be updated to be a list of those courses .
            recommended_courses = [item[0] for item in available_with_deps]


        # Step 11: Create Map of Available Course Hours 
        available_course_hours = {}
        for course_id in available_courses:
             # Look up hours in the details map fetched earlier
             details = course_details_map.get(course_id)
             if details:
                  available_course_hours[course_id] = details.get("hours", 0) # Default to 0 if hours missing in details
             else:
                  available_course_hours[course_id] = 0 # Default if course details somehow weren't fetched
        # End Course Hours Map 


        # Step 12: Return Response 
        return jsonify({
            "form_id": form_id,
            "plan_id": plan_id,
            "max_graduate_hours": max_graduate_hours_from_form,
            "available_courses": available_courses,
            "available_course_hours": available_course_hours, 
            "recommended_courses": recommended_courses,
            "unavailable_due_to_prerequisites": unavailable_prereqs,
            "unavailable_due_to_completion": unavailable_finished,
            "previously_selected_courses": previously_selected_courses
        }), 200

    except Exception as e:
        # Log error with more context if available
        uid_local = uid if 'uid' in locals() and uid else 'unknown'
        form_id_local = form_id if 'form_id' in locals() and form_id else 'unknown'
        print(f"Error in /getFormCourses for form {form_id_local}, user {uid_local}: {e}")
        traceback.print_exc() # Print detailed traceback for debugging
        return jsonify({"error": "Failed to retrieve form courses due to an internal server error", "details": str(e)}), 500

@app.route('/addFormResponse', methods=['POST'])
@token_required 
def add_form_response(decoded_token):
    """
    Adds or updates a student's response (list of selected courses) to a specific form.
    there are many checks that needs to be done:
    1-make sure form has started and hasn't ended
    2-if student filled form before, no need to increase responses counter
    3-in order to know if the student is a graduate or not we must:
    check the plan required hours and the student hours that he achieved, if we subtract them
    and the reminaing is less than the max graduate hours, then he is a graduate
    4-check if the selected courses hours is less than the applicble limit depending on if he is a graduate or not.
    5-increments the counter of responses

    """
    form_id = None # Initialize data 
    uid = None 
    try:
        # Step 1: Get data and validate
        uid = decoded_token.get('uid')
        if not uid:
             return jsonify({"error": "UID not found in token"}), 400

        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400

        form_id = data.get('form_id')
        selected_courses = data.get('selected_courses')

        # Validate inputs
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' (must be a non-empty string)"}), 400
        if not isinstance(selected_courses, list) or not all(isinstance(c, str) for c in selected_courses):
            return jsonify({"error": "'selected_courses' must be a list of course ID strings"}), 400

        form_id = form_id.strip()
        # Clean up selected courses list (remove duplicates and empty strings)
        selected_courses = list(set(filter(None, [c.strip() for c in selected_courses])))


        # Step 2: Fetch Form, Student, and Plan Data 
        form_ref = db.collection('Forms').document(form_id)
        student_ref = db.collection('Students').document(uid)

        # --- Check if student has already responded (for accurate increment) 
        # We need the form doc first to check the responses map
        form_doc = form_ref.get()
        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404
        form_data = form_doc.to_dict()
        # Check if this UID already exists in the responses map
        student_already_responded = uid in form_data.get('Form_Responses', {})
        # --- End check ---


        student_doc = student_ref.get()
        if not student_doc.exists:
             return jsonify({"error": "Student profile not found"}), 404
        student_data = student_doc.to_dict()


        # Get form details needed for validation
        start_date = form_data.get('start_date') # Timestamp
        end_date = form_data.get('end_date')     # Timestamp
        max_hours = form_data.get('max_hours')
        max_graduate_hours = form_data.get('max_graduate_hours')
        plan_id = form_data.get('plan_id')

        # Validate form configuration
        if not all([isinstance(start_date, datetime), isinstance(end_date, datetime),
                    isinstance(max_hours, int), isinstance(max_graduate_hours, int), plan_id]):
             print(f"Warning: Form {form_id} has invalid/missing configuration (dates, hours, plan_id).")
             return jsonify({"error": "Form configuration is incomplete or invalid"}), 500

        # Fetch Plan's required hours in order to know if student is graduting or not.
        #important for applicble limit, and for saving it in response
        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()
        if not plan_doc.exists:
             return jsonify({"error": f"Plan '{plan_id}' associated with form not found"}), 404
        plan_data = plan_doc.to_dict()
        required_hours_for_plan = plan_data.get('required_hours')
        if not isinstance(required_hours_for_plan, int) or required_hours_for_plan <= 0:
             return jsonify({"error": f"Plan '{plan_id}' has invalid 'required_hours'"}), 500

        # Step 3: Check Form Active Status 
        current_time = datetime.now(timezone.utc)
        start_date = start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date
        end_date = end_date.replace(tzinfo=timezone.utc) if end_date.tzinfo is None else end_date

        if not (start_date <= current_time < end_date):
             return jsonify({"error": f"Form '{form_id}' is not currently active for submissions."}), 403

        # Step 4: Calculate Total Selected Hours to check with the applicble limit, so he can register the allowed hours
        # depends on if he is a graduate or not 
        total_selected_hours = 0
        if selected_courses:
            course_refs_to_get = [db.collection('Courses').document(cid) for cid in selected_courses]
            course_docs = db.get_all(course_refs_to_get)
            found_hours_count = 0
            for course_doc in course_docs:
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    course_hours = course_data.get('hours')
                    if isinstance(course_hours, int) and course_hours >= 0:
                        total_selected_hours += course_hours
                        found_hours_count += 1# for debugging
                    else:
                        print(f"Warning: Course {course_doc.id} has invalid/missing 'hours'.")
                        return jsonify({"error": f"Configuration error for course '{course_doc.id}' (invalid hours)."}), 500
                else:
                    return jsonify({"error": f"Selected course '{course_doc.id}' not found."}), 400

            if found_hours_count != len(selected_courses):
                 return jsonify({"error": "One or more selected courses could not be verified."}), 400


        # Step 5: Determine Applicable Hour Limit 
        completed_hours = student_data.get('hours', {}).get('completed', 0)
        exchanged_hours = student_data.get('hours', {}).get('exchanged', 0)
        achieved_hours = completed_hours + exchanged_hours
        remaining_hours = required_hours_for_plan - achieved_hours

        is_graduating = (remaining_hours <= max_graduate_hours)#here we know if he is graduating or not
        applicable_limit = max_graduate_hours if is_graduating else max_hours#limit is based on graduation
        limit_type = "graduate" if is_graduating else "standard"#debugging

        # Step 6: Validate Selected Hours Against Limit 
        if total_selected_hours > applicable_limit:
            return jsonify({
                "error": f"Selected hours ({total_selected_hours}) exceed the allowed {limit_type} limit ({applicable_limit}) for this form."
            }), 400

        # Step 7: Prepare and Store Response (with Counter Increment) 
        response_data = {
            "selected_courses": selected_courses,
            "total_hours": total_selected_hours,
            "submitted_at": current_time,
            "is_graduating": is_graduating
        }

        # Prepare the update payload
        update_payload = {
            f'Form_Responses.{uid}': response_data, # Add/overwrite student response
            'last_response_at': current_time      # Update last response timestamp
        }

        #  Atomically increment counter only if its a new response
        if not student_already_responded:
             # Use firestore.Increment to safely increase the counter by 1
             update_payload['responses'] = firestore.Increment(1) 
        # End counter increment 

        # Update the form document
        form_ref.update(update_payload)

        # Step 8: Return Success Response 
        return jsonify({
            "message": f"Your response for form '{form_id}' ({total_selected_hours} hours) has been submitted successfully."
        }), 200

    except Exception as e:
        # Log error 
        uid_local = uid if 'uid' in locals() and uid else 'unknown'
        form_id_local = form_id if 'form_id' in locals() and form_id else 'unknown'
        print(f"Error in /addFormResponse for form {form_id_local}, user {uid_local}: {e}")
        traceback.print_exc()
        return jsonify({"error": "Failed to submit form response due to an internal server error", "details": str(e)}), 500

#End Students Functions Section _______________

#Other functions (niche,useless,etc) _______________

#End of Other functions (niche,useless,etc) _______________

if __name__ == '__main__': #this starts the flask application
    app.run(debug=True)    

