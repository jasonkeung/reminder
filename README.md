# reminder

## Public URLs

Frontend: https://reminder-frontend-349073578254.us-central1.run.app/

Backend:  https://reminder-backend-349073578254.us-central1.run.app/ 

## Development

To run frontend directly locally
npm run start
url: http://localhost:3000/

To run backend directly locally
uvicorn main:app --host 0.0.0.0 --port 8000
url: http://0.0.0.0:8000/

To build and start both docker containers locally
docker-compose up --build

frontend url: http://0.0.0.0:8080/
backend url: http://0.0.0.0:8000/

