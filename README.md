# Irshadi platform
Irshadi platform is a web application that gathers students' historical data in an easy and convenient way for the students, the data gathered will be useful in implementing many features and functions through the program, such as personalizing students' experience. We will also gather student course selections for upcoming semesters. Our program will make use of the information gathered to provide insights to faculty members to help them plan courses sections effectively to match students demands, through detailed reports and recommendations.




# System Architecture
```mermaid
flowchart LR
    %% Define Styles for different node types
    classDef userStyle fill:#f9f,stroke:#333,stroke-width:2px,color:#333
    classDef frontendStyle fill:#9cf,stroke:#333,stroke-width:2px,color:#333
    classDef backendStyle fill:#fca,stroke:#333,stroke-width:2px,color:#333
    classDef extensionStyle fill:#cf9,stroke:#333,stroke-width:2px,color:#333
    classDef firebaseStyle fill:#ff6,stroke:#333,stroke-width:2px,color:#333,rx:10,ry:10 %% Rounded corners for Firebase

    %% Nodes with icons
    User["fa:fa-user User (Student or Admin)"]:::userStyle
    Frontend["fa:fa-laptop-code Frontend (React, TailwindCSS)"]:::frontendStyle
    Extension["fa:fa-puzzle-piece Extension"]:::extensionStyle
    Backend["fa:fa-server Backend (Python, Flask)"]:::backendStyle
    FirebaseDB["fa:fa-database Firebase (Auth, Firestore)"]:::firebaseStyle

    %% Connections
    User -- "Interacts" --> Frontend
    Frontend -- "Firebase Auth" <--> FirebaseDB
    Frontend -- "Request Information" <--> Backend
    Frontend -- "Extract Student Info" --> Extension
    Extension -- "Send HTML" --> Backend
    Backend -- "Firestore" <--> FirebaseDB

    %% Subgraphs for clarity
    subgraph "Client-Side"
        User
        Frontend
        Extension
    end

    subgraph "Server-Side"
        Backend
        FirebaseDB
    end

```

# Made By

- Hamza Zain Sebaih 

- Abdulaziz Saddig Jastanieh 

- Waleed Awwadh Alsafari 
