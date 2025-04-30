from bs4 import BeautifulSoup
from firebase_admin import credentials, firestore, initialize_app

# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/irshadi-auth-firebase-adminsdk-fbsvc-9e96fac39e.json")
initialize_app(cred)
db = firestore.client()
