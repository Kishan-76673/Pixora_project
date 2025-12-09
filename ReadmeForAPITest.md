Email: robinsay78@gmail.com
Username: Robin
Password: Robin@76673
python manage.py changepassword Robin

POST:  http://localhost:8000/api/auth/login/

{
  "email": "robinsay78@gmail.com",
  "password": "Robin@76673"
}

get the response: {
    "message": "Login successful",
    "user": {
        "id": "b80d0eb1-6b81-40a6-868c-7275ab857220",
        "username": "Robin",
        "email": "robinsay78@gmail.com",
        "full_name": null,
        "bio": null,
        "avatar_url": null,
        "role": "admin",
        "is_verified": false,
        "created_at": "2025-12-05T06:50:22.108285Z"
    },
    "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY0OTUzNTU5LCJpYXQiOjE3NjQ5NDk5NTksImp0aSI6IjE1NDc5ODdhYWVkNjRmM2ZiNDA1NmFjYTUxOWI1MjljIiwidXNlcl9pZCI6ImI4MGQwZWIxLTZiODEtNDBhNi04NjhjLTcyNzVhYjg1NzIyMCJ9.ZSLM_tBv5QNfwoQJciQl2IYj-tS6zW8hrCPRBFAF6Q4",
    "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc2NTU1NDc1OSwiaWF0IjoxNzY0OTQ5OTU5LCJqdGkiOiI0ZjQzYTUxZjQxNTU0Y2E1YmM3NmJjODA1NzlhOTRhMiIsInVzZXJfaWQiOiJiODBkMGViMS02YjgxLTQwYTYtODY4Yy03Mjc1YWI4NTcyMjAifQ.hJl9pUbZzpW0i7tdyV3AS_Az1_osSEqM6lE9C5db7QE"
}


#################################################################################################################################################################

Create a POSTMAN request to create a new post
Request:
POST http://localhost:8000/api/posts/

STEP 2.1 — Add Authorization Header

In POSTMAN → Go to Headers tab
Add:

Key	Value
Authorization	Bearer YOUR_ACCESS_TOKEN

Example:

Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

🟦 STEP 2.2 — Set Body to form-data

Go to the Body tab → choose form-data
Then add two fields:

KEY	VALUE	TYPE
caption	Looks nice!	Text
media	Select file from your PC	File

👉 Click on the “Type” dropdown → choose File for “media”.

Do not use JSON.
Do not use raw.
You must use form-data.




get this response: {
    "caption": "very sweeet!",
    "media": "http://localhost:8000/media/posts/suji-ka-halwa-recipe-1024x1536_WBb3bst.jpg",
    "media_type": "image"
}