from fastapi import FastAPI, Depends, HTTPException, Header
from firebase_admin import credentials, initialize_app, auth, firestore
from fastapi.middleware.cors import CORSMiddleware

from user import User

# Initialize Firebase Admin SDK
cred = credentials.Certificate("./.secrets/firebasekey.json")
initialize_app(cred)

app = FastAPI()
db = firestore.client()

app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "https://reminder-frontend-349073578254.us-central1.run.app",
        "http://0.0.0.0:8080",
        "http://localhost:8080",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/test")
async def preflight():
    return {"message": "Preflight request accepted"}

def verify_firebase_token(authorization: str = Header(None)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authorization header")
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return User.from_dict(decoded_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token, error: {e}")

@app.get("/secure-data")
def secure_data(user: User = Depends(verify_firebase_token)):
    user_id = user.user_id
    return {"message": "Secure data access granted"}

def increment_login_count(user_id: str):
    doc = db.collection("counts").document(user_id).get()
    if doc.exists:
        db.collection("counts").document(user_id).set({
            "count": doc.get("count") + 1
        })
    else:
        db.collection("counts").document(user_id).set({
            "count": 1
        })

def create_user(user: User):
    try:
        firebase_user = auth.get_user(user.user_id)
    except auth.UserNotFoundError:
        firebase_user = auth.create_user(
            uid=user.user_id,
            email=user.email,
            display_name=user.name,
            photo_url=user.picture
        )
    increment_login_count(user.user_id)

@app.post("/login")
def login(user: User = Depends(verify_firebase_token)):
    create_user(user)
    return {"message": "login success!"}

@app.get("/login-count")
def login(user: User = Depends(verify_firebase_token)):
    doc = db.collection("counts").document(user.user_id).get()
    if doc.exists:
        return {"count": doc.get("count")}
    else:
        return {"count": 0}

@app.get("/")
def read_root():
    return {"message": "Welcome to jason's backend server 1!"}

@app.get("/test")
def read_root():
    return {"message": "Welcome to jason's backend server test!"}
