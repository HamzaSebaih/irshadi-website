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
            return jsonify(admin_doc.to_dict()), 200

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
        department = data.get('department')#CPIT
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

@app.route('/delete/<user_id>', methods=['DELETE'])
@admin_required
def delete_data(user_id, decoded_token):#WIP
     #NOTE Goal: deleting a user document from the Students/Admins Collection collections
     #NOTE WIP
    try:
        # Delete the document
        
        return jsonify({"message": "Data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
    Expects JSON: {"plan_name": "PLAN_NAME", "levels": NUMBER_OF_LEVELS}
    Initializes the plan with a 'levels' map containing empty lists for each numbered level
    (e.g., "Level 1": [], "Level 2": [], ...) AND an additional "Extra" level.
    """
    try:
        # --- 1. Get and Validate Input ---
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON request body"}), 400

        plan_name = data.get('plan_name')
        num_levels = data.get('levels') # Get the number of levels

        # Basic validation for plan_name
        if not plan_name or not isinstance(plan_name, str) or not plan_name.strip():
            return jsonify({"error": "Missing or invalid 'plan_name' (must be a non-empty string)"}), 400

        # Validation for levels
        if num_levels is None:
             return jsonify({"error": "Missing 'levels' attribute in request body"}), 400
        if not isinstance(num_levels, int) or num_levels <= 0:
             return jsonify({"error": "'levels' must be a positive integer"}), 400

        # Use stripped name as the document ID
        plan_name = plan_name.strip()

        # --- 2. Check for Existing Plan ---
        # Reference the document using the plan name as the ID in the 'Plans' collection
        plan_ref = db.collection('Plans').document(plan_name)

        # Check if a document with this ID already exists
        if plan_ref.get().exists:
            # Return 409 Conflict if the plan name is already taken
            return jsonify({"error": f"Plan '{plan_name}' already exists"}), 409

        # --- 3. Create New Plan Document with Levels + Extra ---
        # Prepare the data for the new document
        plan_data = {
            'last_update_date': datetime.now(timezone.utc),
            'levels': {} # Initialize the map field for levels
            # You could add other fields here if needed, e.g., 'created_by': decoded_token['uid']
        }

        # Populate the levels map based on the num_levels input
        for i in range(1, num_levels + 1):
            level_key = f"Level {i}" # Create keys like "Level 1", "Level 2", etc.
            plan_data['levels'][level_key] = [] # Add each level with an empty list

        # --- Add the 'Extra' level AFTER the numbered levels ---
        plan_data['levels']['Extra'] = []
        # --- End of modification ---

        # Set the data in Firestore, creating the document
        plan_ref.set(plan_data)

        # --- 4. Return Success Response ---
        # Return 201 Created status code for successful resource creation
        return jsonify({
            "message": f"Plan '{plan_name}' created successfully with {num_levels} numbered levels and an 'Extra' level initialized.",
            "plan_id": plan_name # Optionally return the ID
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
    # This function doesn't have a route, and its used through the function: 
    #handle_extension_update
    #NOTE Goal: Update the student document with info from the HTML request sent by the extension
    
    # Access the HTML from the Flask request body
    html = request.data.decode('utf-8')
    if not html:
        raise ValueError("No HTML provided")
    
    
    # Reference to the student document in Firestore
    # Goal: Update the student document with info from an HTML file
    
    # Reference to the student document in Firestore
    student_document = db.collection('Students').document(uid)
    
    # Parse HTML
    soup = BeautifulSoup(html, 'html.parser')
    
    # General info extraction
    general_info = {}
    
    # Find the academic info table
    academic_tables = soup.find_all('table', class_='datadisplaytable', attrs={'border': '1', 'width': '800'})
    academic_table = None
    for table in academic_tables:
        prev_elem = table.find_previous('td', class_='pldefault')
        if prev_elem and 'معلومات الطالب الاكاديمية' in prev_elem.text:
            academic_table = table
            break

    # Assuming academic_table is the BeautifulSoup object for the academic info table
    if academic_table:
        print("Academic table found, extracting rows...")
        rows = academic_table.find_all('tr')
        for row in rows:
            # Find all th and td elements in the row
            ths = row.find_all('th', class_='ddheader')
            tds = row.find_all('td', class_='dddefault')
            # Pair each th with its corresponding td
            for i in range(len(ths)):
                key = ths[i].text.strip()
                value = tds[i].text.strip()
                print(f"Extracted: Key='{key}', Value='{value}'")
                
                # Matching logic for each key
                if key == 'رقم الطالب':  # Student ID
                    general_info['Student_ID'] = value
                    print("Matched: Student ID")
                elif key == 'التخصص':  # Major
                    general_info['major'] = value
                    print("Matched: Major")
                elif key == 'الساعات المسجلة':  # Registered Hours
                    try:
                        general_info['hours_registered'] = int(value)
                        print("Matched: Registered Hours")
                    except ValueError:
                        general_info['hours_registered'] = 0
                elif key == 'الساعات المجتازة':  # Completed Hours
                    try:
                        general_info['hours_completed'] = int(value)
                        print("Matched: Completed Hours")
                    except ValueError:
                        general_info['hours_completed'] = 0
                elif key == 'ساعات المعدل':  # Total Hours
                    try:
                        general_info['gpa_hours'] = int(value)
                        print("Matched: Total Hours")
                    except ValueError:
                        general_info['gpa_hours'] = 0
                elif key == 'الساعات المحولة':  # Exchanged Hours
                    try:
                        general_info['hours_exchanged'] = int(value)
                        print("Matched: Exchanged Hours")
                    except ValueError:
                        general_info['hours_exchanged'] = 0
                elif key == 'المعدل':  # GPA
                    try:
                        general_info['gpa'] = float(value)
                        print("Matched: GPA")
                    except ValueError:
                        general_info['gpa'] = 0.0
    else:
        print("Error: Academic table not found")

    # Extract finished courses from transcript tables
    finished_courses = []
    for table in academic_tables:
        headers = [th.text.strip() for th in table.find_all('th', class_='ddheader')]
        if 'مسجلة' in headers and 'مجتازة' in headers and 'التقدير' in headers:
            print("Found transcript table, extracting courses...")
            rows = table.find_all('tr')[1:]  # Skip header row
            for row in rows:
                cols = row.find_all('td', class_='dddefault')
                if len(cols) >= 7:
                    dept = cols[0].text.strip()
                    course_num = cols[1].text.strip()
                    course_code = f"{dept}-{course_num}"
                    try:
                        hours_registered = int(cols[3].text.strip())
                        hours_passed = int(cols[4].text.strip())
                    except ValueError:
                        continue
                    grade = cols[6].text.strip()
                    if hours_registered == hours_passed and grade not in ['F', 'W','DN']:
                        finished_courses.append(course_code)

    # --- NEW SECTION: Extract equivalent courses from "المقررات المعادلة" table ---
    equivalent_courses_table = None
    for table in academic_tables:
        prev_elem = table.find_previous('td', class_='pldefault')
        if prev_elem and 'المقررات المعادلة' in prev_elem.text:
            equivalent_courses_table = table
            break

    if equivalent_courses_table:
        print("Found equivalent courses table, extracting courses...")
        rows = equivalent_courses_table.find_all('tr')[1:]  # Skip header row
        for row in rows:
            cols = row.find_all('td', class_='dddefault')
            if len(cols) >= 2:  # Ensure at least 2 columns for dept and course number
                dept = cols[0].text.strip()
                course_num = cols[1].text.strip()
                course_code = f"{dept}-{course_num}"
                if course_code not in finished_courses:  # Avoid duplicates
                    finished_courses.append(course_code)
    # --- END OF NEW SECTION ---

    # Structure extracted data
    extracted_data = {
        "Student_ID": general_info.get('Student_ID', ''),
        "hours": {
            "registered": general_info.get('hours_registered', 0),
            "completed": general_info.get('hours_completed', 0),
            "gpa": general_info.get('gpa_hours', 0),
            "exchanged": general_info.get('hours_exchanged', 0)
        },
        "gpa": general_info.get('gpa', 0.0),
        "major": general_info.get('major', ''),
        "Finished_Courses": finished_courses
    }
    
    # Update Firestore document
    doc = student_document.get()
    if not doc.exists:
        raise ValueError("Student not found")
    
    existing_data = doc.to_dict()
    name_str = existing_data.get("name", "")

    updated_data = {
        "Student_ID": extracted_data["Student_ID"],
        "hours": {
            "registered": extracted_data["hours"]["registered"],
            "gpa": extracted_data["hours"]["gpa"],
            "exchanged": extracted_data["hours"]["exchanged"],
            "completed": extracted_data["hours"]["completed"]
        },
        "gpa": extracted_data["gpa"],
        "name": name_str,
        "major": extracted_data["major"],
        "Finished_Courses": extracted_data["Finished_Courses"],
        "last_updated": datetime.now(timezone.utc)  # Records the current UTC time
    }
    
    student_document.set(updated_data, merge=True)
    
    print("Extracted Data:", extracted_data)
    print("")
    print("Updated Firestore document with data:", updated_data)
    
@app.route('/addResponse', methods=['POST'])
@token_required
def add_Response(decoded_token):#WIP, Response Structure WIP
    #NOTE Goal is adding a response document to the SurveyResponses collections, 
    #WIP, Response Structure WIP
    try:
        
        return jsonify({"message": "Data added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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

