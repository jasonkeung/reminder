import asyncio
import json
import random
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from firebase_admin import credentials, initialize_app, auth, firestore
from fastapi.middleware.cors import CORSMiddleware

from state.world import Player, World
from user import User
import os

# Initialize Firebase Admin SDK
print("Current directory:", os.getcwd())
print("Directory contents:", os.listdir(os.getcwd()))
cred = credentials.Certificate("./.secrets/firebasekey.json")
initialize_app(cred)

@asynccontextmanager
async def lifespan(app: FastAPI):
    update_world_and_broadcast_task = asyncio.create_task(update_world_and_broadcast())
    yield
    update_world_and_broadcast_task.cancel()

app = FastAPI(lifespan=lifespan)
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

db = firestore.client()
websocket_clients = []
world = World("default")
world.setup()
# Firestore listener to sync player data
# async def listen_to_firestore():
#     player_ref = db.collection('players')
#     loop = asyncio.get_running_loop()  # Get the main event loop
#     def on_snapshot(doc_snapshot, changes, read_time):
#         for change in changes:
#             # Extract the player data from the modified or added document
#             player_data = change.document.to_dict()
#             player_data["id"] = change.document.id
#             data = {
#                 "event": "player-update",
#                 "payload": player_data
#             }

#             # Send this update to all connected clients
#             for client in websocket_clients:
#                 # Use run_coroutine_threadsafe to schedule the coroutine in the main event loop
#                 asyncio.run_coroutine_threadsafe(
#                     client.send_text(json.dumps(data)),
#                     loop
#                 )
    
#     # Listen to changes in the players collection
#     player_ref.on_snapshot(on_snapshot)

#     # Keep the function alive
#     while True:
#         await asyncio.sleep(3600)

# @app.on_event("startup")
# async def startup_event():
#     asyncio.create_task(listen_to_firestore())

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
        print(f"Error verifying token: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token, error: {e}")
    
def verify_firebase_token_ws(token: str) -> User:
    try:
        # Verify the token using Firebase Admin SDK
        decoded_token = auth.verify_id_token(token)
        return User.from_dict(decoded_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

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
    return user.to_dict()

@app.get("/")
def read_root():
    return {"message": "Welcome to jason's backend server!"}

@app.get("/world")
def get_world():
    return world.to_dict()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # Reject if already at max clients
    if len(websocket_clients) >= 10:
        await websocket.close(code=4000, reason="Server full: max 10 clients")
        return

    await websocket.accept()

    websocket_clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            event = message.get("event")

            # Handle ping event
            if event == "ping":
                await websocket.send_text(json.dumps({"event": "pong", "sentAt": time.time()}))

    except WebSocketDisconnect:
        websocket_clients.remove(websocket)
        


async def update_world_and_broadcast():
    while True:
        world.update()

        for client in websocket_clients:
            print(f"Broadcasting world update to {len(websocket_clients)} clients")
            if client.application_state == WebSocketState.CONNECTED:
                await client.send_text(json.dumps({
                    "event": "world-update",
                    "payload": world.to_dict(),
                    "sentAt": time.time()
                }))
        await asyncio.sleep(1)

