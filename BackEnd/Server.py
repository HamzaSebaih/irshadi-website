#this is the server program.

from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import wraps

# Initialize Flask app
app = Flask(__name__)


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
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token  # Contains user info (e.g., uid, email)
    except Exception as e:
        return None  # Token is invalid
    
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
        

        print(decoded_token)     
        #now we get his information to determine if he is an admin.
        # Fetch the user's role from Firestore NOTE WIP

        """ 
        user_id = decoded_token["uid"]
        user_ref = db.collection('users').document(user_id)
        user = user_ref.get()
        if not user.exists or user.to_dict().get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
            
        """
        #if we reach here, the sender is an admin
        #call the original function, process his original request.
        return f(*args, **kwargs)

    return decorated_function



@app.route('/addStudent', methods=['POST'])
@admin_required
def add_Student():
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
def add_Course():
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
def add_Survey():
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
def add_Response():
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




@app.route('/get/<user_id>', methods=['GET'])
def get_data(user_id):
    #route for retrieving a user document  from the users collections
    try:
        # Get a document by ID
        user_ref = db.collection('Students').document(user_id) #this createse a pointer to the document with the specificed user_id
        user = user_ref.get() #here we fetch the document 
        if user.exists:
            return jsonify(user.to_dict()), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/update/<user_id>', methods=['PUT'])
def update_data(user_id):
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
def delete_data(user_id):
     #route for deleting a user document  from the users collections
    try:
        # Delete the document
        db.collection('users').document(user_id).delete()
        return jsonify({"message": "Data deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__': #this starts the flask application
    app.run(debug=True)

