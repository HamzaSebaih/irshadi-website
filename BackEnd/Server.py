#this is the server program.

#Importing Section ___________
from flask import Flask, jsonify, request
from flask_cors import CORS 
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
import collections # For defaultdict
import traceback # For detailed error logging
#End of Importing Section ___________

load_dotenv() # Load environment variables (optional, for production)


# Initialize Flask app
app = Flask(__name__)
CORS(app) #this cors are used to fix the front end request however I read its bad for deployoment @AbdulazizJastanieh
# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/irshadi-auth-firebase-adminsdk-fbsvc-d9b5b63d0d.json")  # this is the credentials that will be used to connect with the firestore
firebase_admin.initialize_app(cred) #here we make a connection with firebase using our credentials, 
db = firestore.client()  # This is your Firestore database object, here we create a connection to our firestore database, 


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

        # Step 1: Check for a "file" named after the email (assumed to be a Firestore doc in 'pendingAdmins')
        pending_admin_ref = db.collection('pendingAdmins').document(email)
        pending_admin_doc = pending_admin_ref.get()

        if pending_admin_doc.exists:
            # This user is a new admin
            # "Rename the file" by moving the data to the 'admins' collection with UID as the document ID
            admin_data = {
                "name": name,  # Use name 
                "email": email,
                "role": "admin"  # 
            }
            # Create the admin document 
            db.collection('admins').document(uid).set(admin_data)
            # Delete the pending admin "file"
            pending_admin_ref.delete()
            # Return the admin data directly (flattened)
            return jsonify(admin_data), 200

        # Step 2: Check if UID exists in the 'admins' collection
        admin_ref = db.collection('admins').document(uid)
        admin_doc = admin_ref.get()

        if admin_doc.exists:
            # User is an existing admin
            # Return the admin document directly
            admin_data = admin_doc.to_dict()
            admin_data["role"] ="admin"
            return jsonify(admin_data), 200

        # Step 3: Check if UID exists in the 'students' collection
        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()

        if student_doc.exists:
            # User is an existing student
            # Add role to the student data and return doc
            student_data = student_doc.to_dict()
            student_data["role"] = "student"
            print(student_data)
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

        # Return the new student data directly (flattened)
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
            # No UID found, create a document in pendingAdmins with email as document ID
            pending_admin_ref = db.collection('pendingAdmins').document(email)
            pending_admin_ref.set({"email": email})
            return jsonify({"message": f"Admin pending creation for email: {email}"}), 200

        # Step 3: Check if the UID belongs to an admin or student
        admin_ref = db.collection('Admins').document(uid)  # Using 'Admins' to match decorator
        admin_doc = admin_ref.get()
        if admin_doc.exists:
            return jsonify({"error": "Email already belongs to an admin"}), 400

        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()
        if student_doc.exists:
            # Retrieve name and email from the student document
            student_data = student_doc.to_dict()
            name = student_data.get('name')
            email = student_data.get('email')

            # Validate that name and email exist in the student document
            if not name or not email:
                return jsonify({"error": "Student document missing name or email"}), 500

            # Delete the student document
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
        # Step 1: Extract the email from the request body (JSON)
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
        # Get data from the request (e.g., JSON payload)
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
            "course_number": int(course_number),  # Store as integer in Firestore
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
def add_course_prerequisite(decoded_token): # The admin_required decorator injects decoded_token
    """
    Adds a prerequisite course ID to the 'prerequisites' array of a target course document
    within the 'Courses' collection.
    Requires admin privileges.
    Expects JSON: {"course_id": "TARGET-COURSE-ID", "prerequisite": "PREREQ-COURSE-ID"}
    Uses ArrayUnion for safe addition (won't add duplicates).
    Verifies that both the target course and the prerequisite course exist.
    """
    try:
        # --- 1. Get and Validate Input ---
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        course_id = data.get('course_id')         # The course to add the prerequisite to
        prerequisite_id = data.get('prerequisite') # The course ID that is the prerequisite

        # Basic validation
        if not course_id or not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid 'course_id' (must be a non-empty string)"}), 400
        if not prerequisite_id or not isinstance(prerequisite_id, str) or not prerequisite_id.strip():
            return jsonify({"error": "Missing or invalid 'prerequisite' (must be a non-empty string)"}), 400

        course_id = course_id.strip()
        prerequisite_id = prerequisite_id.strip()

        # Prevent a course from being its own prerequisite
        if course_id == prerequisite_id:
             return jsonify({"error": "A course cannot be a prerequisite of itself"}), 400

        # --- 2. Verify Both Courses Exist ---
        # NOTE: Assumes 'Courses' is the correct collection name.
        course_ref = db.collection('Courses').document(course_id)
        prereq_ref = db.collection('Courses').document(prerequisite_id)

        course_doc = course_ref.get()
        prereq_doc = prereq_ref.get() # Check if prerequisite course also exists

        if not course_doc.exists:
             return jsonify({"error": f"Target course '{course_id}' not found in Courses collection"}), 404
        if not prereq_doc.exists:
             # It's important that prerequisites refer to actual courses
             return jsonify({"error": f"Prerequisite course '{prerequisite_id}' not found in Courses collection"}), 400 # 400 Bad Request as the input refers to a non-existent entity

        # --- 3. Check Target Course's 'prerequisites' Field (Optional but Recommended) ---
        course_data = course_doc.to_dict()
        # Check if the field exists and if it's a list before attempting ArrayUnion
        # ArrayUnion *might* create the field if it doesn't exist, but explicit checks are safer.
        if 'prerequisites' in course_data and not isinstance(course_data.get('prerequisites'), list):
             return jsonify({"error": f"Field 'prerequisites' in course '{course_id}' exists but is not an array/list."}), 409 # 409 Conflict - field type mismatch

        # --- 4. Add Prerequisite using ArrayUnion ---
        # Prepare the update data. ArrayUnion will handle adding the prerequisite_id
        # only if it's not already present in the 'prerequisites' array.
        # It will also create the 'prerequisites' field if it doesn't exist yet.
        update_data = {
            'prerequisites': firestore.ArrayUnion([prerequisite_id])
            # Optional: You might want to update a 'last_modified' timestamp here as well
            # 'last_modified': datetime.now(timezone.utc)
        }

        # Update the target course document
        course_ref.update(update_data)

        # --- 5. Return Success Response ---
        # Note: ArrayUnion succeeds even if the item was already present.
        return jsonify({
            "message": f"Prerequisite '{prerequisite_id}' added to course '{course_id}' (or was already present)."
            }), 200 # 200 OK

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /addCoursePre for course '{course_id if 'course_id' in locals() else 'unknown'}', prerequisite '{prerequisite_id if 'prerequisite_id' in locals() else 'unknown'}': {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to add course prerequisite due to an internal server error", "details": str(e)}), 500

@app.route('/addSurvey', methods=['POST'])
@admin_required
def add_Survey(decoded_token):#WIP Structure
    #GOAL: add a new survey to the survey collection
    #WIP Strucutre is not strict. dependent on frontend
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
    Requires admin privileges.
    Expects JSON: {"plan_name": "PLAN_NAME", "levels": NUMBER_OF_LEVELS, "required_hours": TOTAL_HOURS}
    Initializes the plan with a 'levels' map containing empty lists for each numbered level
    (e.g., "Level 1": [], "Level 2": [], ...) AND an additional "Extra" level.
    Also saves the total required hours for the plan.
    """
    try:
        # --- 1. Get and Validate Input ---
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400

        plan_name = data.get('plan_name')
        num_levels = data.get('levels') # Get the number of levels
        required_hours = data.get('required_hours') # Get the required hours (NEW)

        # Basic validation for plan_name
        if not plan_name or not isinstance(plan_name, str) or not plan_name.strip():
            return jsonify({"error": "Missing or invalid 'plan_name' (must be a non-empty string)"}), 400

        # Validation for levels
        if num_levels is None:
             return jsonify({"error": "Missing 'levels' attribute in request body"}), 400
        if not isinstance(num_levels, int) or num_levels <= 0:
             print(f"Invalid num_levels received: {num_levels}") # Added print for debugging
             return jsonify({"error": "'levels' must be a positive integer"}), 400

        # --- Validation for required_hours (NEW) ---
        if required_hours is None:
             return jsonify({"error": "Missing 'required_hours' attribute in request body"}), 400
        if not isinstance(required_hours, int) or required_hours <= 0:
             return jsonify({"error": "'required_hours' must be a positive integer"}), 400
        # --- End required_hours validation ---

        # Use stripped name as the document ID
        plan_name = plan_name.strip()

        # --- 2. Check for Existing Plan ---
        plan_ref = db.collection('Plans').document(plan_name)
        if plan_ref.get().exists:
            return jsonify({"error": f"Plan '{plan_name}' already exists"}), 409

        # --- 3. Create New Plan Document with Levels + Extra + Required Hours ---
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

        # --- 4. Return Success Response ---
        # Includes fields added in the user's provided snippet
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
def add_plan_level(decoded_token): # The admin_required decorator injects decoded_token
    """
    Adds a new level (as an empty list attribute) to an existing plan document in the 'Plans' collection.
    Requires admin privileges.
    Expects a JSON body like: {"plan_name": "My Existing Plan", "level_number": 1}
    Constructs the Firestore key as "Level {level_number}".
    Updates the 'last_update_date' field of the plan.
    """
    try:
        # --- 1. Get and Validate Input ---
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
        # Construct the key name (e.g., "Level 1", "Level 2") from the number
        level_key = f"Level {level_number}"

        # --- 2. Check if Plan Exists ---
        plan_ref = db.collection('Plans').document(plan_name)
        plan_doc = plan_ref.get()

        if not plan_doc.exists:
            return jsonify({"error": f"Plan '{plan_name}' not found"}), 404 # 404 Not Found

        # --- 3. Check if Level Key Already Exists ---
        plan_data = plan_doc.to_dict()
        # Check using the constructed key (e.g., "Level 1")
        if level_key in plan_data.get('levels', {}): # Check within the 'levels' map
            return jsonify({"error": f"Level '{level_key}' already exists in plan '{plan_name}'"}), 409 # 409 Conflict

        # --- 4. Add New Level Key and Update Timestamp ---
        # Prepare the data to update: new level key within the 'levels' map
        # Use dot notation for updating nested fields
        update_data = {
            f'levels.{level_key}': [], # Add the new level field within the 'levels' map
            'last_update_date': datetime.now(timezone.utc) # Update the timestamp
        }

        # Update the document in Firestore
        plan_ref.update(update_data)

        # --- 5. Return Success Response ---
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
def add_course_to_plan_level(decoded_token): # The admin_required decorator injects decoded_token
    """
    Adds a course ID to the array associated with a specific level within a plan document's 'levels' map.
    Requires admin privileges.
    Expects JSON: {"plan_name": "PlanName", "level_identifier": LEVEL_NUMBER | "Extra", "course_id": "COURSE-ID"}
    Updates the 'last_update_date' field of the plan.
    Uses ArrayUnion for safe addition (won't add duplicates).
    """
    try:
        # --- 1. Get and Validate Input ---
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        plan_name = data.get('plan_name')#it
        # Renamed input field to accept number or "Extra"
        level_identifier = data.get('level_identifier')# 4
        course_id = data.get('course_id') # e.g., "CPIT-251"

        # Basic validation for plan_name and course_id
        if not plan_name or not isinstance(plan_name, str) or not plan_name.strip():
            return jsonify({"error": "Missing or invalid 'plan_name' (must be a non-empty string)"}), 400
        if not course_id or not isinstance(course_id, str) or not course_id.strip():
            return jsonify({"error": "Missing or invalid 'course_id' (must be a non-empty string)"}), 400

        plan_name = plan_name.strip()
        course_id = course_id.strip()

        # --- Validate level_identifier and construct level_key ---
        level_key = None
        if isinstance(level_identifier, int) and level_identifier > 0:
            # If it's a positive integer, construct key like "Level 1"
            level_key = f"Level {level_identifier}"
        elif isinstance(level_identifier, str) and level_identifier.strip().lower() == "extra":
            # If it's the string "Extra" (case-insensitive check, store consistently)
            level_key = "Extra"
        else:
            # Otherwise, the identifier is invalid
            return jsonify({"error": "'level_identifier' must be a positive integer or the string 'Extra'"}), 400

        # --- 2. Check if Course Exists ---
        course_ref = db.collection('Courses').document(course_id)
        if not course_ref.get().exists:
             return jsonify({"error": f"Course '{course_id}' not found in Courses collection"}), 404 # Or 400 Bad Request

        # --- 3. Check if Plan and Level Key Exist ---
        plan_ref = db.collection('Plans').document(plan_name)
        plan_doc = plan_ref.get()

        if not plan_doc.exists:
            return jsonify({"error": f"Plan '{plan_name}' not found"}), 404

        plan_data = plan_doc.to_dict()
        # Check if the 'levels' map exists and if the specific level_key exists within it
        levels_map = plan_data.get('levels', {})
        if level_key not in levels_map:
            return jsonify({"error": f"Level '{level_key}' does not exist in plan '{plan_name}'. Create it first."}), 404 # Or 400

        # Optional: Check if the level is actually an array/list
        if not isinstance(levels_map.get(level_key), list):
             return jsonify({"error": f"Target field for level '{level_key}' in plan '{plan_name}' is not an array/list."}), 400

        # --- 4. Add Course ID to Level Array ---
        # Prepare update data using ArrayUnion and update timestamp
        # Use dot notation to target the specific level key within the 'levels' map
        update_data = {
            f'levels.{level_key}': firestore.ArrayUnion([course_id]),
            'last_update_date': datetime.now(timezone.utc)
        }

        # Update the document in Firestore
        plan_ref.update(update_data)

        # --- 5. Return Success Response ---
        return jsonify({
            "message": f"Course '{course_id}' added to level '{level_key}' in plan '{plan_name}' (or was already present)."
            }), 200 # 200 OK

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /addCourseToPlanLevel for plan '{plan_name if 'plan_name' in locals() else 'unknown'}', level_identifier '{level_identifier if 'level_identifier' in locals() else 'unknown'}', course '{course_id if 'course_id' in locals() else 'unknown'}': {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to add course to plan level due to an internal server error", "details": str(e)}), 500

@app.route('/getPlans', methods=['GET'])
@admin_required # 
def get_plans(decoded_token): # token_required provides decoded_token
    """
    Retrieves a list of all available plans from the 'Plans' collection.
    Requires user authentication.
    Returns a JSON list containing each plan's ID and its data.
    """
    try:
        # --- 1. Query the Plans Collection ---
        # Get an iterator for all documents in the 'Plans' collection
        plans_ref = db.collection('Plans')
        plans_stream = plans_ref.stream()

        # --- 2. Format the Plans Data ---
        plans_list = []
        for doc in plans_stream:
            # Get the document ID (which is the plan name/ID)
            plan_id = doc.id
            # Get the document data (contains 'last_update_date', 'levels' map)
            plan_data = doc.to_dict()

            # Combine ID and data into a single dictionary for the list
            plan_entry = {
                "plan_id": plan_id,
                **plan_data # Unpack the document data into the main dictionary
                # Alternatively, nest data: "data": plan_data
            }
            plans_list.append(plan_entry)

        # --- 3. Return the Response ---
        # Return the list of plans, even if it's empty
        return jsonify({"plans": plans_list}), 200

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /getPlans: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve plans due to an internal server error", "details": str(e)}), 500

@app.route('/addForm', methods=['POST'])
@admin_required
def add_form(decoded_token): # admin_required provides decoded_token
    """
    Adds a new form document to the 'Forms' collection with a sequential numeric ID.
    Requires admin privileges.
    Expects JSON: {"title": "...", "description": "...", "start_date": "YYYY-MM-DD",
                   "end_date": "YYYY-MM-DD", "plan": "PLAN_ID",
                   "max_hours": NUMBER, "max_graduate_hours": NUMBER,
                   "expected_students": NUMBER}
    Initializes an empty 'Form_Responses' map.
    """
    try:
        # --- 1. Get and Validate Input ---
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        # Updated required fields
        required_fields = ["title", "description", "start_date", "end_date", "plan",
                           "max_hours", "max_graduate_hours", "expected_students"] # Added expected_students
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
        expected_students = data.get('expected_students') # New field

        # Basic type validation for original string fields
        if not all(isinstance(data.get(field), str) for field in ["title", "description", "start_date", "end_date", "plan"]):
             return jsonify({"error": "Fields 'title', 'description', 'start_date', 'end_date', 'plan' must be strings"}), 400

        # Validate hour limit fields
        if not isinstance(max_hours, int) or max_hours <= 0:
             return jsonify({"error": "'max_hours' must be a positive integer"}), 400
        if not isinstance(max_graduate_hours, int) or max_graduate_hours <= 0:
             return jsonify({"error": "'max_graduate_hours' must be a positive integer"}), 400

        # --- Validate expected_students (NEW) ---
        if not isinstance(expected_students, int) or expected_students < 0:
             return jsonify({"error": "'expected_students' must be a non-negative integer"}), 400
        # --- End expected_students validation ---

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

        # --- 2. Generate Sequential ID ---
        # WARNING: This method can be inefficient and prone to race conditions.
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

        # --- 3. Prepare Form Data ---
        form_data = {
            "title": title,
            "description": description,
            "start_date": start_timestamp,
            "end_date": end_timestamp,
            "plan_id": plan_id,
            "max_hours": max_hours,
            "max_graduate_hours": max_graduate_hours,
            "expected_students": expected_students, # Added field
            "Form_Responses": {}, # Initialize empty MAP
            "created_at": datetime.now(timezone.utc)
        }

        # --- 4. Create New Form Document ---
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
@admin_required # Using admin_required as provided in the prompt
def get_forms(decoded_token): # admin_required provides decoded_token
    """
    Retrieves a list of all available forms from the 'Forms' collection.
    Requires admin authentication.
    Returns a JSON list containing each form's ID and its data
    (including title, description, dates, plan_id, max_hours, max_graduate_hours, etc.),
    EXCLUDING the 'Form_Responses' field.
    """
    try:
        # --- 1. Query the Forms Collection ---
        forms_ref = db.collection('Forms')
        forms_stream = forms_ref.stream() # Get an iterator for all form documents

        # --- 2. Format the Forms Data (excluding responses) ---
        forms_list = []
        for doc in forms_stream:
            # Get the document ID (e.g., "1", "2", "3"...)
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

        # --- 3. Return the Response ---
        # Return the list of forms (without responses), even if it's empty
        return jsonify({"forms": forms_list}), 200

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /getForms: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve forms due to an internal server error", "details": str(e)}), 500

@app.route('/editForm', methods=['PATCH']) # Using PATCH for partial updates
@admin_required
def edit_form(decoded_token): # admin_required provides decoded_token
    """
    Updates specific fields (title, description, start_date, end_date) of an existing form.
    Requires admin privileges.
    Expects JSON containing 'form_id' and at least one field to update:
    {"form_id": "FORM_ID", "title": "New Title", "end_date": "YYYY-MM-DD", ...}
    Only updates the fields provided in the request.
    Adds a 'last_modified' timestamp.
    """
    try:
        # --- 1. Get and Validate Input ---
        data = request.get_json()
        if not data:
             return jsonify({"error": "Missing JSON request body"}), 400

        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' (must be a non-empty string)"}), 400
        form_id = form_id.strip()

        # --- 2. Check if Form Exists ---
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()
        if not form_doc.exists:
             return jsonify({"error": f"Form with ID '{form_id}' not found"}), 404

        # --- 3. Prepare Update Data ---
        update_data = {}
        allowed_fields = ["title", "description", "start_date", "end_date"]
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
            if not isinstance(description, str): # Allow empty description? Assuming yes.
                 return jsonify({"error": "Invalid 'description' (must be a string)"}), 400
            update_data['description'] = description
            found_update = True

        if 'start_date' in data:
            start_date_str = data['start_date']
            if not isinstance(start_date_str, str):
                 return jsonify({"error": "Invalid 'start_date' (must be a string)"}), 400
            try:
                start_datetime = datetime.strptime(start_date_str, "%Y-%m-%d")
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
                update_data['end_date'] = datetime.combine(end_datetime.date(), datetime.min.time(), tzinfo=timezone.utc)
                found_update = True
            except ValueError:
                return jsonify({"error": "Invalid 'end_date' format. Please use YYYY-MM-DD"}), 400

        # Optional: Add cross-validation for dates if both are provided
        # E.g., check if update_data['end_date'] < update_data['start_date']

        # Check if any valid fields were provided for update
        if not found_update:
            return jsonify({"error": "No valid fields provided for update. Allowed fields: title, description, start_date, end_date"}), 400

        # Add a timestamp for the modification
        update_data['last_modified'] = datetime.now(timezone.utc)

        # --- 4. Perform Update ---
        form_ref.update(update_data)

        # --- 5. Return Success Response ---
        return jsonify({"message": f"Form '{form_id}' updated successfully"}), 200

    except Exception as e:
        # Log the error for server-side debugging
        print(f"Error in /editForm for form_id '{form_id if 'form_id' in locals() else 'unknown'}': {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to edit form due to an internal server error", "details": str(e)}), 500

@app.route('/deleteForm', methods=['POST'])
@admin_required 
def delete_form(decoded_token):
    """
    Deletes a specific form document from the 'Forms' collection.
    Requires admin authentication.
    Expects the form_id in the JSON request body: {"form_id": "FORM_ID"}
    """
    try:
        # --- 1. Get form_id from JSON Request Body ---
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')

        # Validate form_id
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 400
        form_id = form_id.strip()
        # --- End form_id retrieval ---

        # --- 2. Get Document Reference and Check Existence ---
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()

        if not form_doc.exists:
             # If the document doesn't exist, return 404 Not Found
             return jsonify({"error": f"Form '{form_id}' not found"}), 404

        # --- 3. Delete the Document ---
        form_ref.delete()

        # --- 4. Return Success Response ---
        # Return 200 OK on successful deletion
        return jsonify({"message": f"Form '{form_id}' deleted successfully"}), 200

    except Exception as e:
        # Log the error for server-side debugging
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /deleteForm for form_id {form_id_local}: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to delete form due to an internal server error", "details": str(e)}), 500

def get_form_statistics(decoded_token):
    #this will show the form statistics, 
    None



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

def update_student_data(uid):
    """
    Parses HTML from the request, extracts student academic info,
    maps the major to English, and updates the student document in Firestore.
    Called by handle_extension_update.
    """
    MAJOR_MAPPING = {
        "تقنية المعلومات": "IT",
        "نظم المعلومات": "IS",
        "علوم الحاسبات": "CS"
    }

    # Access the HTML from the Flask request body
    html = request.data.decode('utf-8')
    if not html:
        raise ValueError("No HTML provided")

    # Reference to the student document in Firestore
    # NOTE: Collection name 'Students' kept as is.
    student_document = db.collection('Students').document(uid)

    # Parse HTML
    soup = BeautifulSoup(html, 'html.parser')

    # General info extraction
    general_info = {}

    # Find the academic info table (using original logic)
    academic_tables = soup.find_all('table', class_='datadisplaytable', attrs={'border': '1', 'width': '800'})
    academic_table = None
    for table in academic_tables:
        prev_elem = table.find_previous('td', class_='pldefault')
        if prev_elem and 'معلومات الطالب الاكاديمية' in prev_elem.text:
            academic_table = table
            break

    if academic_table:
        print("Academic table found, extracting rows...")
        rows = academic_table.find_all('tr')
        for row in rows:
            ths = row.find_all('th', class_='ddheader')
            tds = row.find_all('td', class_='dddefault')
            for i in range(len(ths)):
                key = ths[i].text.strip()
                value = tds[i].text.strip()
                print(f"Extracted: Key='{key}', Value='{value}'")

                # Matching logic for each key (simplified for brevity, use original logic)
                if key == 'رقم الطالب': general_info['Student_ID'] = value
                elif key == 'التخصص': general_info['major'] = value # Keep original Arabic here
                elif key == 'الساعات المسجلة': general_info['hours_registered'] = int(value) if value.isdigit() else 0
                elif key == 'الساعات المجتازة': general_info['hours_completed'] = int(value) if value.isdigit() else 0
                elif key == 'ساعات المعدل': general_info['gpa_hours'] = int(value) if value.isdigit() else 0
                elif key == 'الساعات المحولة': general_info['hours_exchanged'] = int(value) if value.isdigit() else 0
                elif key == 'المعدل':
                    try: general_info['gpa'] = float(value)
                    except ValueError: general_info['gpa'] = 0.0
    else:
        print("Warning: Academic table not found") # Changed to warning

    # Extract finished courses (using original logic)
    finished_courses = []
    # ...(original logic for parsing transcript tables)...
    for table in academic_tables:
        headers = [th.text.strip() for th in table.find_all('th', class_='ddheader')]
        if 'مسجلة' in headers and 'مجتازة' in headers and 'التقدير' in headers:
            print("Found transcript table, extracting courses...")
            rows = table.find_all('tr')[1:]
            for row in rows:
                cols = row.find_all('td', class_='dddefault')
                if len(cols) >= 7:
                    dept = cols[0].text.strip()
                    course_num = cols[1].text.strip()
                    course_code = f"{dept}-{course_num}"
                    try:
                        hours_registered = int(cols[3].text.strip())
                        hours_passed = int(cols[4].text.strip())
                    except ValueError: continue
                    grade = cols[6].text.strip()
                    if hours_registered > 0 and hours_registered == hours_passed and grade not in ['F', 'W','DN']:
                         if course_code not in finished_courses:
                              finished_courses.append(course_code)


    # Extract equivalent courses (using original logic)
    # ...(original logic for parsing equivalent courses table)...
    equivalent_courses_table = None
    for table in academic_tables:
        prev_elem = table.find_previous('td', class_='pldefault')
        if prev_elem and 'المقررات المعادلة' in prev_elem.text:
            equivalent_courses_table = table
            break
    if equivalent_courses_table:
        print("Found equivalent courses table, extracting courses...")
        rows = equivalent_courses_table.find_all('tr')[1:]
        for row in rows:
            cols = row.find_all('td', class_='dddefault')
            if len(cols) >= 2:
                dept = cols[0].text.strip()
                course_num = cols[1].text.strip()
                course_code = f"{dept}-{course_num}"
                if course_code not in finished_courses:
                    finished_courses.append(course_code)


    # --- Apply Major Mapping ---
    arabic_major = general_info.get("major", "") # Get extracted Arabic major
    # Look up in mapping, default to original Arabic name if no mapping found
    english_major = MAJOR_MAPPING.get(arabic_major, arabic_major)
    print(f"Mapping major: '{arabic_major}' -> '{english_major}'")
    # --- End Mapping ---

    # Structure extracted data (using original structure)
    extracted_data = {
        "Student_ID": general_info.get('Student_ID', ''),
        "hours": {
            "registered": general_info.get('hours_registered', 0),
            "completed": general_info.get('hours_completed', 0),
            "gpa": general_info.get('gpa_hours', 0),
            "exchanged": general_info.get('hours_exchanged', 0)
        },
        "gpa": general_info.get('gpa', 0.0),
        # "major": arabic_major, # Store the mapped version below instead
        "Finished_Courses": finished_courses
    }

    # Update Firestore document
    doc = student_document.get()
    if not doc.exists:
        raise ValueError("Student not found")

    existing_data = doc.to_dict()
    name_str = existing_data.get("name", "") # Preserve existing name

    # Prepare final update data
    updated_data = {
        "Student_ID": extracted_data["Student_ID"],
        "hours": extracted_data["hours"],
        "gpa": extracted_data["gpa"],
        "name": name_str, # Keep existing name
        "major": english_major, # Use the mapped English major name
        "Finished_Courses": extracted_data["Finished_Courses"],
        "last_updated": datetime.now(timezone.utc)  # Records the current UTC time
    }

    # Use set with merge=True to update existing fields and add new ones
    student_document.set(updated_data, merge=True)

    print("Extracted Data (before mapping major):", extracted_data)
    print("")
    print("Updated Firestore document with data:", updated_data)

@app.route('/getMyForms', methods=['GET'])
@token_required # Ensures only logged-in users (students/admins) can call this
def get_my_forms(decoded_token): # token_required provides decoded_token
    """
    Retrieves a list of forms relevant to the calling student's major.
    Requires user authentication.
    Filters forms based on matching the student's 'major' field with the form's 'plan_id'.
    Returns a JSON list containing each matching form's ID and its data,
    EXCLUDING the 'Form_Responses' field.
    """
    try:
        # --- 1. Get Student's UID and Major ---
        uid = decoded_token.get('uid')
        if not uid:
             # This shouldn't happen if token_required works correctly, but good practice
             return jsonify({"error": "UID not found in token"}), 400

        # Fetch the student's document
        # NOTE: Assuming 'Students' is the correct collection name
        student_ref = db.collection('Students').document(uid)
        student_doc = student_ref.get()

        if not student_doc.exists:
             # Handle case where user exists in Auth but not in Students collection
             # Or if an admin tries to call this endpoint
             return jsonify({"error": "Student profile not found"}), 404

        student_data = student_doc.to_dict()
        # Get the student's major (assuming it's stored in English, e.g., "IT")
        student_major = student_data.get('major')

        if not student_major:
             # Handle case where student exists but has no major assigned
             print(f"Warning: Student {uid} has no major assigned.")
             # Return empty list as no forms can match
             return jsonify({"forms": []}), 200

        # --- 2. Query All Forms ---
        forms_ref = db.collection('Forms')
        forms_stream = forms_ref.stream()

        # --- 3. Filter Forms by Major and Format Data ---
        relevant_forms_list = []
        for doc in forms_stream:
            form_id = doc.id
            form_data = doc.to_dict()

            # Get the plan_id associated with the form
            form_plan_id = form_data.get('plan_id')

            # --- Check if the form's plan_id matches the student's major ---
            if form_plan_id == student_major:
                # If it matches, exclude responses and add to the list
                form_data.pop('Form_Responses', None) # Exclude responses

                form_entry = {
                    "form_id": form_id,
                    **form_data # Unpack the rest of the form data
                }
                relevant_forms_list.append(form_entry)
            # --- End of check ---

        # --- 4. Return the Response ---
        # Return the filtered list of forms
        return jsonify({"forms": relevant_forms_list}), 200

    except Exception as e:
        # Log the error for server-side debugging
        uid_local = decoded_token.get('uid', 'unknown') # Get uid for logging if available
        print(f"Error in /getMyForms for user {uid_local}: {e}")
        # Return a generic server error message
        return jsonify({"error": "Failed to retrieve student forms due to an internal server error", "details": str(e)}), 500

@app.route('/getFormCourses', methods=['POST'])
@token_required
def get_form_courses(decoded_token):
    """
    Retrieves courses associated with a specific form, filtered for the calling student.
    Requires user authentication. Expects form_id in the JSON request body.
    VALIDATES that the student's record was updated AFTER the form's start date.
    Returns lists of available, unavailable (prereqs not met), unavailable (finished),
    recommended courses, AND the student's previously selected courses for this form, if any.
    Recommendations prioritize 'important' courses (prerequisites for others)
    from the earliest available level. Includes fallback logic.
    """
    form_id = None # Initialize for error logging
    uid = None # Initialize for error logging
    try:
        # --- Get form_id from JSON Body ---
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400
        form_id = data.get('form_id')
        if not form_id or not isinstance(form_id, str) or not form_id.strip():
            return jsonify({"error": "Missing or invalid 'form_id' in request body"}), 400
        form_id = form_id.strip()
        # --- End form_id retrieval ---

        # --- 1. Get Student UID and Data ---
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

        # --- 2. Get Form Data ---
        form_ref = db.collection('Forms').document(form_id)
        form_doc = form_ref.get()
        if not form_doc.exists:
            return jsonify({"error": f"Form '{form_id}' not found"}), 404

        form_data = form_doc.to_dict()
        plan_id = form_data.get('plan_id')
        form_start_date = form_data.get('start_date') # Get form start date

        if not plan_id:
            return jsonify({"error": f"Form '{form_id}' does not have an associated plan_id"}), 400
        # Ensure form_start_date is a datetime object (Timestamp from Firestore)
        if not isinstance(form_start_date, datetime):
            print(f"Warning: Form {form_id} has invalid/missing 'start_date'. Type: {type(form_start_date)}")
            return jsonify({"error": "Form configuration is incomplete or invalid (start_date)."}), 500

        # --- 2b. Validate Student Data Freshness (NEW STEP) ---
        # Ensure student_last_updated is a datetime object
        if not isinstance(student_last_updated, datetime):
            # Student record has never been updated by the extension or has invalid data
            return jsonify({"error": "Please update your academic record using the extension before accessing this form."}), 403 # 403 Forbidden

        # Ensure timestamps are comparable (make them timezone-aware, assuming UTC if missing)
        # Firestore Timestamps are typically already timezone-aware (UTC)
        form_start_date_utc = form_start_date.replace(tzinfo=timezone.utc) if form_start_date.tzinfo is None else form_start_date
        student_last_updated_utc = student_last_updated.replace(tzinfo=timezone.utc) if student_last_updated.tzinfo is None else student_last_updated

        if student_last_updated_utc <= form_start_date_utc:
            # Student data is older than or same time as form start date, require update
            return jsonify({"error": "Your academic record is outdated relative to this form. Please update it using the extension."}), 403 # 403 Forbidden
        # --- End Freshness Check ---


        # --- 3. Get Previous Response ---
        previously_selected_courses = []
        form_responses_map = form_data.get('Form_Responses', {})
        if isinstance(form_responses_map, dict):
            student_previous_response = form_responses_map.get(uid)
            if isinstance(student_previous_response, dict):
                courses = student_previous_response.get('selected_courses', [])
                if isinstance(courses, list):
                     previously_selected_courses = courses


        # --- 4. Get Plan Structure ---
        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()
        if not plan_doc.exists:
             return jsonify({"error": f"Plan '{plan_id}' associated with form '{form_id}' not found"}), 404

        plan_data = plan_doc.to_dict()
        levels_map = plan_data.get('levels', {})
        if not levels_map:
             return jsonify({"error": f"Plan '{plan_id}' has no levels defined"}), 400

        # --- 5. Extract All Courses from Plan & Store Level Info ---
        all_plan_courses_with_level = []
        level_order = {}
        level_counter = 1
        sorted_level_keys = sorted(levels_map.keys(), key=lambda k: int(k.split(' ')[1]) if k.startswith('Level ') and k.split(' ')[1].isdigit() else float('inf'))

        for level_key in sorted_level_keys:
            courses = levels_map[level_key]
            if not isinstance(courses, list): continue
            level_order[level_key] = level_counter
            level_counter += 1
            for course_id in courses:
                 if isinstance(course_id, str):
                      all_plan_courses_with_level.append((course_id, level_key))

        all_plan_course_ids = list(set(c[0] for c in all_plan_courses_with_level))

        # --- 6. Fetch Prerequisites for All Plan Courses ---
        course_prereqs = collections.defaultdict(list)
        if all_plan_course_ids: # Only fetch if there are courses in the plan
             course_refs_to_get = [db.collection('Courses').document(cid) for cid in all_plan_course_ids]
             course_docs = db.get_all(course_refs_to_get)

             for course_doc in course_docs:
                  if course_doc.exists:
                       course_id = course_doc.id
                       course_data = course_doc.to_dict()
                       prereqs = course_data.get('prerequisites', [])
                       if isinstance(prereqs, list):
                            course_prereqs[course_id] = prereqs

        # --- 6b. Calculate Dependency Count ---
        dependency_count = collections.defaultdict(int)
        for course_id in all_plan_course_ids:
            # Check the prerequisites defined FOR OTHER courses in the plan
            for other_course_id in all_plan_course_ids:
                 if other_course_id == course_id: continue # Don't check self
                 prereqs = course_prereqs.get(other_course_id, [])
                 if course_id in prereqs: # If this course_id is a prereq for other_course_id
                      dependency_count[course_id] += 1 # Increment its dependency count

        # --- 7. Filter Courses for the Student ---
        available_courses = []
        unavailable_prereqs = []
        unavailable_finished = []

        for course_id in all_plan_course_ids:
            if course_id in finished_courses_set:
                 unavailable_finished.append(course_id)
                 continue

            prereqs_for_course = set(course_prereqs.get(course_id, []))
            if prereqs_for_course.issubset(finished_courses_set):
                 available_courses.append(course_id)
            else:
                 missing_prereqs = list(prereqs_for_course - finished_courses_set)
                 unavailable_prereqs.append({"course_id": course_id, "missing": missing_prereqs})


        # --- 8. Recommendation Logic with Fallback ---
        recommended_courses = []
        min_level_num = float('inf')
        available_courses_set = set(available_courses)

        if available_courses:
            for course_id, level_key in all_plan_courses_with_level:
                 if course_id in available_courses_set:
                      level_num = level_order.get(level_key, float('inf'))
                      min_level_num = min(min_level_num, level_num)

        if min_level_num != float('inf'):
             for course_id, level_key in all_plan_courses_with_level:
                  if (course_id in available_courses_set and
                          level_order.get(level_key) == min_level_num and
                          dependency_count.get(course_id, 0) > 0):
                       recommended_courses.append(course_id)

        recommended_courses = list(set(recommended_courses))

        if not recommended_courses and available_courses:
            print(f"INFO: No important courses found in earliest level ({min_level_num}). Falling back to highest dependency available courses.")
            available_with_deps = [(c_id, dependency_count.get(c_id, 0)) for c_id in available_courses]
            available_with_deps.sort(key=lambda item: item[1], reverse=True)
            recommended_courses = [item[0] for item in available_with_deps]


        # --- 9. Return Response --- (Renumbered from 8)
        return jsonify({
            "form_id": form_id,
            "plan_id": plan_id,
            "available_courses": available_courses,
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
@token_required # Student needs to be logged in
def add_form_response(decoded_token):
    """
    Adds or updates a student's response (list of selected courses) to a specific form.
    Requires user authentication.
    Expects JSON: {"form_id": "FORM_ID", "selected_courses": ["COURSE-ID-1", ...]}
    Checks if the form exists and is currently active.
    Validates that the total hours of selected courses do not exceed the limit
    (max_hours or max_graduate_hours based on student's progress).
    Stores the response in the form document under Form_Responses.[USER_ID],
    including a flag indicating if the graduate hour limit was applicable.
    """
    try:
        # --- 1. Get Input and User ID ---
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


        # --- 2. Fetch Form, Student, and Plan Data ---
        form_ref = db.collection('Forms').document(form_id)
        student_ref = db.collection('Students').document(uid)

        form_doc = form_ref.get()
        student_doc = student_ref.get()

        if not form_doc.exists:
             return jsonify({"error": f"Form '{form_id}' not found"}), 404
        if not student_doc.exists:
             return jsonify({"error": "Student profile not found"}), 404

        form_data = form_doc.to_dict()
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

        # Fetch Plan's required hours
        plan_ref = db.collection('Plans').document(plan_id)
        plan_doc = plan_ref.get()
        if not plan_doc.exists:
             return jsonify({"error": f"Plan '{plan_id}' associated with form not found"}), 404
        plan_data = plan_doc.to_dict()
        required_hours_for_plan = plan_data.get('required_hours')
        if not isinstance(required_hours_for_plan, int) or required_hours_for_plan <= 0:
             return jsonify({"error": f"Plan '{plan_id}' has invalid 'required_hours'"}), 500

        # --- 3. Check Form Active Status ---
        current_time = datetime.now(timezone.utc)
        # Ensure dates have timezone info (assuming UTC if missing)
        start_date = start_date.replace(tzinfo=timezone.utc) if start_date.tzinfo is None else start_date
        end_date = end_date.replace(tzinfo=timezone.utc) if end_date.tzinfo is None else end_date

        # Check if form is active (adjust end_date comparison if needed for inclusivity)
        if not (start_date <= current_time < end_date):
             return jsonify({"error": f"Form '{form_id}' is not currently active for submissions."}), 403

        # --- 4. Calculate Total Selected Hours ---
        total_selected_hours = 0
        if selected_courses: # Only fetch if courses were selected
            course_refs_to_get = [db.collection('Courses').document(cid) for cid in selected_courses]
            course_docs = db.get_all(course_refs_to_get)
            found_hours_count = 0
            for course_doc in course_docs:
                if course_doc.exists:
                    course_data = course_doc.to_dict()
                    course_hours = course_data.get('hours')
                    if isinstance(course_hours, int) and course_hours >= 0:
                        total_selected_hours += course_hours
                        found_hours_count += 1
                    else:
                        print(f"Warning: Course {course_doc.id} has invalid/missing 'hours'.")
                        return jsonify({"error": f"Configuration error for course '{course_doc.id}' (invalid hours)."}), 500
                else:
                    return jsonify({"error": f"Selected course '{course_doc.id}' not found."}), 400

            if found_hours_count != len(selected_courses):
                 return jsonify({"error": "One or more selected courses could not be verified."}), 400


        # --- 5. Determine Applicable Hour Limit ---
        completed_hours = student_data.get('hours', {}).get('completed', 0)
        exchanged_hours = student_data.get('hours', {}).get('exchanged', 0)
        achieved_hours = completed_hours + exchanged_hours
        remaining_hours = required_hours_for_plan - achieved_hours

        # Check if student is considered graduating for hour limit purposes
        is_graduating = (remaining_hours <= max_graduate_hours) # This boolean is calculated here
        applicable_limit = max_graduate_hours if is_graduating else max_hours
        limit_type = "graduate" if is_graduating else "standard"

        # --- 6. Validate Selected Hours Against Limit ---
        if total_selected_hours > applicable_limit:
            return jsonify({
                "error": f"Selected hours ({total_selected_hours}) exceed the allowed {limit_type} limit ({applicable_limit}) for this form."
            }), 400

        # --- 7. Prepare and Store Response ---
        response_data = {
            "selected_courses": selected_courses,
            "total_hours": total_selected_hours,
            "submitted_at": current_time,
            "is_graduating": is_graduating # *** Added the boolean flag here ***
        }
        update_payload = {
            f'Form_Responses.{uid}': response_data,
            'last_response_at': current_time
        }
        form_ref.update(update_payload)

        # --- 8. Return Success Response ---
        return jsonify({
            "message": f"Your response for form '{form_id}' ({total_selected_hours} hours) has been submitted successfully."
        }), 200

    except Exception as e:
        uid_local = decoded_token.get('uid', 'unknown')
        form_id_local = form_id if 'form_id' in locals() else 'unknown'
        print(f"Error in /addFormResponse for form {form_id_local}, user {uid_local}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to submit form response due to an internal server error", "details": str(e)}), 500

#End Students Functions Section _______________

#Other functions (niche,useless,etc) _______________


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
    

@app.route('/addStudentggg', methods=['POST'])
@admin_required
def add_Student(decoded_token):#Kind of useless
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


#End of Other functions (niche,useless,etc) _______________




if __name__ == '__main__': #this starts the flask application
    app.run(debug=True)

