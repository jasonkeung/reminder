import asyncio
import json
import time
from fastapi import FastAPI, Depends, HTTPException, Header, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
from firebase_admin import credentials, initialize_app, auth, firestore
from fastapi.middleware.cors import CORSMiddleware

from state.world import Player, World
from user import User

# Initialize Firebase Admin SDK
cred = credentials.Certificate("./.secrets/firebasekey.json")
initialize_app(cred)

app = FastAPI()
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
players = {}

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

@app.get("/login-count")
def login_count(user: User = Depends(verify_firebase_token)):
    doc = db.collection("counts").document(user.user_id).get()
    if doc.exists:
        return {"count": doc.get("count")}
    else:
        return {"count": 0}

@app.get("/")
def read_root():
    return {"message": "Welcome to jason's backend server!"}

@app.get("/test")
def read_root_test():
    return {"message": "Welcome to jason's backend server test!"}

@app.get("/world")
def get_world():
    if world.map_name == "default": # type: ignore
        print("Setting up world...")
        world.set_map_name("map2")
        world.set_world_width(30)
        world.set_world_height(20)
        players["p1"] = Player("p1", 2, 2, Player.FacingDirection.DOWN)
        world.add_player(players["p1"])
        print(f"Just set up world, returning {world.to_dict()}")
    return world.to_dict()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, user: User = Depends(verify_firebase_token_ws)):
    await websocket.accept()

    user_id = user.user_id  # Extract the user ID from the decoded token
    websocket_clients.append(websocket)
    
    try:
        while True:
            # Receive data from the client (player movement)
            data = await websocket.receive_text()
            message = json.loads(data)
            event = message.get("event")

            # Handle ping event
            if event == "ping":
                print(f"Ping received from {user_id}")
                # await websocket.send_text(json.dumps({"event": "pong"}))
                await websocket.send_text(json.dumps({
                    "event": "world-update", 
                    "payload": world.to_dict()
                }))
            elif event == "player-move":
                # Optionally, broadcast to other players
                for client in websocket_clients:
                    if client != websocket and client.application_state == WebSocketState.CONNECTED:
                        await client.send_text(data)

                # Persist player data in Firestore (if applicable)
                player_data = json.loads(data)["payload"]  # Assuming the data is in JSON format
                player_ref = db.collection('players').document(user_id)
                player_ref.set({
                    'x': player_data['x'],
                    'y': player_data['y']
                })

    except WebSocketDisconnect:
        # Remove the client from the list of connected clients
        websocket_clients.remove(websocket)
        

# setup_world()
