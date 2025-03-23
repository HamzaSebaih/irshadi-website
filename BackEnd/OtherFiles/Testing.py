from bs4 import BeautifulSoup
from firebase_admin import credentials, firestore, initialize_app

# Initialize Firestore
cred = credentials.Certificate("BackEnd/OtherFiles/irshadi-auth-firebase-adminsdk-fbsvc-9e96fac39e.json")
initialize_app(cred)
db = firestore.client()

def update_student_data(uid, html_file_path):
    # Goal: Update the student document with info from an HTML file
    
    # Read HTML from the specified file
    try:
        with open(html_file_path, 'r', encoding='utf-8') as file:
            html = file.read()
    except FileNotFoundError:
        raise ValueError(f"HTML file not found at {html_file_path}")
    except Exception as e:
        raise ValueError(f"Error reading HTML file: {str(e)}")
    
    if not html:
        raise ValueError("HTML content is empty")
    
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
                        general_info['hours_total'] = int(value)
                        print("Matched: Total Hours")
                    except ValueError:
                        general_info['hours_total'] = 0
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
                    if hours_registered == hours_passed and grade not in ['F', 'W']:
                        finished_courses.append(course_code)

    # Structure extracted data
    extracted_data = {
        "Student_ID": general_info.get('Student_ID', ''),
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
            "total": extracted_data["hours"]["total"],
            "exchanged": extracted_data["hours"]["exchanged"],
            "completed": extracted_data["hours"]["completed"]
        },
        "gpa": extracted_data["gpa"],
        "name": name_str,
        "major": extracted_data["major"],
        "Finished_Courses": extracted_data["Finished_Courses"]
    }
    
    student_document.set(updated_data, merge=True)
    
    print("Extracted Data:", extracted_data)
    print("")
    print("Updated Firestore document with data:", updated_data)

if __name__ == "__main__":
    try:
        update_student_data(
            "qLvKbegvGjVmIudNqn6I2EfEGbH2",
            r"C:\MyFiles\Second_Desktop\university\current semester\CPIT-499\CPIT-499-Website\irshadi-website\BackEnd\OtherFiles\studentinfoexample.html"
        )
        print("Update completed successfully!")
    except ValueError as e:
        print(f"Error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")