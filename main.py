from fastapi import FastAPI, Depends, HTTPException, Header
from firebase_admin import credentials, initialize_app, auth
from fastapi.responses import JSONResponse

# Initialize Firebase Admin SDK
cred = credentials.Certificate("/app/.secrets/firebasekey.json")
initialize_app(cred)

app = FastAPI()

def verify_firebase_token(authorization: str = Header(None)):
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
    return {"message": "Secure data access granted", "user": user}

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI Firebase Auth service!"}
