# pixora
for learning only

Step 1: Check your Python version: python --version

Step 2: Create Virtual Environment: python -m venv venv

activate: venv\Scripts\activate
or source venv/bin/activate

Step 3: Install Django and Essential Packages
```
# Upgrade pip first
pip install --upgrade pip

# Install Django
pip install django

# Install Django REST Framework (for API)
pip install djangorestframework

# Install additional packages
pip install pillow              # Image handling
pip install django-cors-headers # CORS support for frontend
pip install python-decouple     # Environment variables
pip install psycopg2-binary     # PostgreSQL driver (we'll use later)
pip install djangorestframework-simplejwt  # JWT authentication

# For development
pip install black               # Code formatter
pip install flake8             # Linter

# For Google Drive integration (alternative to AWS S3)
pip install google-auth google-auth-oauthlib google-auth-httplib2
pip install google-api-python-client

```

# Create requirements.txt: pip freeze > requirements.txt

Step 4: Create Django Project: django-admin startproject pixora_backend .

Step 5: Test Django Installation: python manage.py runserver

Step 6: Create Django Apps:
# Create apps
python manage.py startapp accounts    # User management
python manage.py startapp posts       # Posts, likes, comments
python manage.py startapp social      # Follow, feed
python manage.py startapp notifications  # Notifications
python manage.py startapp analytics   # Admin analytics

Step 8: Create .env File for Secrets
touch .env

Step 11: Create Initial Migrations:
python manage.py makemigrations
python manage.py migrate 

Step 12: Create Superuser (Admin): python manage.py createsuperuser 

Email: robinsay78@gmail.com
Username: Robin
Password: Robin@76673
python manage.py changepassword Robin



########################################################################################################################################################

# Pixora - Frontend Setup Guide
Technology Stack

Framework: React 18
Build Tool: Vite (faster than Create React App)
Styling: Tailwind CSS
Routing: React Router v6
State Management: React Context + Hooks
HTTP Client: Axios
Forms: React Hook Form
Icons: Lucide React


Step 1: Create Frontend Project:
npm create vite@latest pixora-frontend -- --template react

Step 2: Install Dependencies:
# Install base dependencies
npm install
# Install additional packages
npm install react-router-dom axios
npm install bootstrap bootstrap-icons
npm install lucide-react
npm install react-hook-form
npm install zustand  # Lightweight state management


#########################################################################################################


How to Freeze Dependencies
- Install dependencies normally
: npm install react-router-dom axios bootstrap bootstrap-icons lucide-react react-hook-form zustand

- Commit both package.json and package-lock.json to version control
- These files together ensure reproducible installs.
- Reinstall exact versions later
: npm ci

# To run this application from FE: npm run dev -- --port=3000( for custom port)

####################################################################################




these are the api that I have build:
http://127.0.0.1:8000/api/auth/register/
{
  "email": "demo@gmail.com",
  "username": "demo",
  "full_name": "Demo User",
  "password": "demo1234"
}


http://127.0.0.1:8000/api/auth/login/

{
  "email": "demo@gmail.com",
  "password": "demo1234"
}

# for checking the user in db
python manage.py shell

from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.filter(username="John").delete()
User.objects.all()


📌 NEXT STEP — I NEED THIS FROM YOU

Please send:

📥 The registration request payload

(open DevTools → Network → click the register request → Payload)

📤 The response JSON

(error returned by backend)

Only then I can pinpoint the exact missing/wrong field.




<!-- ################################################################ -->



Debugging:

Test API manually (VERY IMPORTANT)

Run: python manage.py runserver

Then test using Postman / Thunder Client:

REGISTER

POST → http://127.0.0.1:8000/api/auth/register/

{
  "email": "demo@gmail.com",
  "username": "demo",
  "full_name": "Demo User",
  "password": "demo1234"
}


If this succeeds → backend is fixed.

LOGIN

POST → http://127.0.0.1:8000/api/auth/login/

{
  "email": "demo@gmail.com",
  "password": "demo1234"
}


You should get: {
  "message": "Login successful",
  "access": "...",
  "refresh": "...",
  "user": {...}
}


################################################################################################################################################################

✔️ To confirm:

Open Browser → DevTools → Network → register request
Send me:

🔹 Request payload (JSON)
🔹 Response JSON error

This will let me tell you EXACTLY what is missing.

But I already know the most common frontend issue 👇 


####################################################################################################################################################################

Perfect!  Here's the plan for the next 5 major features:
Next 5 Features to Build:

Follow/Unfollow System - Follow users, see followers/following lists, personalized feed showing only followed users' posts
User Profile Page - View any user's profile with their posts grid, follower/following counts, edit your own profile (bio, avatar)
Search & Explore - Search users by username, discover new users, trending posts page
Notifications System - Real-time notifications for likes, comments, and new followers with badge count
Stories Feature - 24-hour disappearing stories with image/video upload (Instagram-like)