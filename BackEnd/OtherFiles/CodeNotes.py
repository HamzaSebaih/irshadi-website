#this is the server program.

from flask import Flask, jsonify, request
import firebase_admin
from firebase_admin import credentials, firestore, auth
from functools import wraps

""" 1- explination for protected route and decorator.
def admin_required(f): #open for explination
    #this is a decorator function that takes another function as input
    
    when decorating function in python, before you define the function 
    you say that this function will be decorated by using the "@ " symbol
    so the interpret now understand that if this function where to be called
    it will call the decorated instead , and pass the function with its aurgements as an input

    okay. then the decorator will be executed, the decorator could literlly do nothing , 
    or he could do some stuff then call the function that it received after its done.
    for instance it log some information then call the input function it received 

    but its called a decorated for a reason, so it will execute some stuff then execute the 
    original function, he can execute them in its own definition , but we instead 
    define another function inside of it , that will do more stuff then , that function calls 
    the input function 

    that function is called the wrapper function , because it wraps the original function 
    in python if you want to define a wrapper function you use the "@wraps(f)" 

    you can do it without , meaning you can just call a function that do some stuff and then this 
    function would just call the original function using f(*args,**kwargs)

    but its not adivisible for many reasons, so just use @wraps

    and since the decorator function already has access to the args of the input function 
    but the wrapper function doesn't since its a local function
    we give the *args, **kwargs to it as parameters 
    then it can call f and pass arguements to it, 
    so:
    @wraps(f) is for perservation of meta data of the original function and for debugging

    *args,**kwargs to the wrapper function is because its a local function and it doens't have access to them
    and if it tried to call the original function and to use them, the interpreter would tell the wrapper
    you are trying to access a variable that is not defined, wtf you talkin about?

    
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        id_token = request.headers.get("Authorization")
        if not id_token:
            return jsonify({"error": "Authorization token is missing"}), 401

        

        decoded_token = verify_firebase_token(id_token)
        if not decoded_token:
            return jsonify({"error": "Invalid or expired token"}), 401

        
        
        user_id = decoded_token["uid"]
        user_ref = db.collection('users').document(user_id)
        user = user_ref.get()
        if not user.exists or user.to_dict().get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        
        

        return f(*args, **kwargs)

    return decorated_function

"""

""" 2- explination of using a function with decorator
@app.route('/addStudent', methods=['POST'])
@admin_required
def add_Student():
    bla bla bla 

#since the above is a function that is decorated , then the decorator will be called and given the original 
#function as input.
"""


"""3- difference between snapshot and document reference

Here’s a short explanation of the difference between a DocumentReference and a DocumentSnapshot, as they relate to your code:

DocumentReference
What it is: A DocumentReference is a pointer or address to a specific document in Firestore. It’s like a URL or path (e.g., Students/StudentID) but doesn’t contain the document’s data yet.
Returned by: db.collection('Students').document(StudentID).
Datatype: firebase.firestore.DocumentReference.
Purpose: You use it to perform operations like .set() (to write data), .get() (to fetch data), or .update() (to modify data). It’s a starting point for interacting with a document.
Key Trait: It’s “lazy”—it doesn’t fetch data until you explicitly ask for it.
DocumentSnapshot
What it is: A DocumentSnapshot is a snapshot of the actual document’s data at a specific point in time, including its fields and metadata (like the ID).
Returned by: tokens_ref[0] (after tokens_ref = db.collection('otp_tokens').where(...).get()), where .get() fetches the data and returns a list of snapshots.
Datatype: firebase.firestore.DocumentSnapshot.
Purpose: It holds the document’s contents (accessible via .to_dict()) and metadata (like .id). It’s the result of a query or fetch operation.
Key Trait: It’s “loaded”—it contains the document’s data (or info that it doesn’t exist) from the moment it was retrieved.
M
ain Differences

Content:
DocumentReference: Just a reference, no data yet.
DocumentSnapshot: Contains the actual data (e.g., {'code': '123456', ...}) and metadata.
How You Get It:
DocumentReference: From specifying a path (e.g., .document(StudentID)).
DocumentSnapshot: From querying or fetching data (e.g., .get()).
Usage:
DocumentReference: Use it to write (set), read (get), or update a document.
DocumentSnapshot: Use it to read the data (.to_dict()) or check the ID (.id).

"""
