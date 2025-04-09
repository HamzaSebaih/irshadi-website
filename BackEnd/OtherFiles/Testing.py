from bs4 import BeautifulSoup
from firebase_admin import credentials, firestore, initialize_app

# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/irshadi-auth-firebase-adminsdk-fbsvc-9e96fac39e.json")
initialize_app(cred)
db = firestore.client()

def update_student_data(uid):
    # This function doesn't have a route, and its used through the function: 
    #handle_extension_update
    #NOTE Goal: Update the student document with info from the HTML request sent by the extension

        # --- Mapping Dictionary for Majors ---
    # Add more Arabic-to-English mappings here as needed
    MAJOR_MAPPING = {
        "تقنية المعلومات": "IT",
        "نظم المعلومات": "IS",
        "علوم الحاسبات": "CS"
    }
    # --- End Mapping Dictionary ---

    



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
    