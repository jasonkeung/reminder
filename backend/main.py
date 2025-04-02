from fastapi import FastAPI, Depends, HTTPException, Header
from firebase_admin import credentials, initialize_app, auth
from fastapi.middleware.cors import CORSMiddleware

# Initialize Firebase Admin SDK
cred = credentials.Certificate("./.secrets/firebasekey.json")
initialize_app(cred)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
     allow_origins=[
        "https://reminder-frontend-349073578254.us-central1.run.app/",
        "http://0.0.0.0:8080",
        "http://localhost:8080",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def verify_firebase_token(authorization: str = Header(None)):
    print("Authorization Header:", authorization)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authorization header")
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token, error: {e}")

@app.get("/secure-data")
def secure_data(user=Depends(verify_firebase_token)):
    return {"message": "Secure data access granted"}

@app.get("/")
def read_root():
    return {"message": "Welcome to jason's backend server 1!"}

@app.get("/test")
def read_root():
    return {"message": "Welcome to jason's backend server test!"}
