from flask import Flask, request, make_response, jsonify
from flask_restful import Api, Resource
import jwt
import secrets
import psycopg2
import hashlib
import os
from flask_cors import CORS
from dotenv import load_dotenv
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room
from words import word_list
import random

app = Flask(__name__)
CORS(app, supports_credentials=True)
api = Api(app)

load_dotenv()

secret_key = os.getenv('SECRET_KEY')
database_url = os.getenv('DATABASE_URL')

sio = SocketIO(app, cors_allowed_origins=["http://localhost:3000"])
rooms = {}
results = {}
modes = {}

def generate_words(n):
    words = []
    length = len(word_list)
    for i in range(n):
        words.append(word_list[random.randint(0, length-1)])
    return words

@sio.on("join-room")
def handle_room_join(data):
    room_id = data['roomId']
    username = data['username']
    host = False
    join_room(room_id)
    users = []
    mode = "words"
    limit = 15
    if rooms.get(room_id):
        rooms[room_id].append({"username": username, "host": False, "ready": False})
        users = [[i["username"], i["ready"], i["host"]] for i in rooms[room_id]]
        mode = modes[room_id]["mode"]
        limit = modes[room_id]["limit"]
    else:
        host = True
        rooms[room_id] = [{"username": username, "host": True, "ready": True}]
        users = [[username, True, True]]
        modes[room_id] = {"mode": "words", "limit": 15}
    emit("room-joined", {"message": f"{username} joined the room", "username": username, "host": host, "success": True, "users": users, "mode": mode, "limit": limit}, to=room_id)
    if host:
        emit("room-host", {"message": "You are the host"}, to=request.sid)


@sio.on("change-game-config")
def handle_config_change(data):
    room_id = data['roomId']
    if not rooms.get(room_id):
        emit("room-not-found", {"message": "No room found with the given id"}, to=request.sid)
        return
    emit("game-config-changed", {"mode": data['mode'], "limit": data['limit']}, to=room_id)


@sio.on("leave-room")
def handle_room_leave(data):
    room_id = data['roomId']
    username = data['username']
    if not rooms.get(room_id):
        emit("room-not-found", {"message": "No room found with the given id"}, to=request.sid)
        return
    leave_room(room_id)
    if rooms.get(room_id):
        for i in range(len(rooms[room_id])):
            if rooms[room_id][i]["username"] == username:
                rooms[room_id].pop(i)
                users = [[i["username"], i["ready"], i["host"]] for i in rooms[room_id]]
                emit("room-left", {"message": f"{username} left the room", "username": username, "users": users}, to=room_id)
                return

@sio.on("end-room")
def handle_end_room(data):
    room_id = data["roomId"]
    if not rooms.get(room_id):
        emit("room-not-found", {"message": "No room found with the given id"}, to=request.sid)
        return
    del rooms[room_id]
    emit("room-ended", to=room_id)
    close_room(room_id)

@sio.on("ready")
def user_ready(data):
    room_id = data['roomId']
    username = data['username']
    if rooms.get(room_id):
        for i in range(len(rooms[room_id])):
            if rooms[room_id][i]["username"] == username:
                rooms[room_id][i]["ready"] = True
                users = [[i["username"], i["ready"], i["host"]] for i in rooms[room_id]]
                emit("user-ready", {"message": f"{username} is ready", "username": username, "users": users}, to=room_id)
                return

@sio.on("game-start")
def handle_start(data):
    room_id = data['roomId']
    game_mode = data['mode']
    game_limit = int(data['limit'])
    if game_mode == "words":
        limit = game_limit
    else:
        limit = 100
    all_ready = True
    if rooms.get(room_id):
        for i in rooms[room_id]:
            if not i["ready"]:
                all_ready = False
                break
        if all_ready:
            emit("game-started", {"message": "Game has started", "words": generate_words(limit)}, to=room_id)
        else:
            emit("user-not-ready", {"message": "All users are not ready yet"}, to=request.sid)
    emit("room-not-found", {"message": "No room found with the given id"})

@sio.on("game-end")
def handle_end(data):
    room_id = data['roomId']
    wpm = data['wpm']
    accuracy = data['accuracy']
    username = data['username']
    if not rooms.get(room_id):
        emit("room-not-found", {"message": "No room found with the given id"})
        return
    if not results.get(room_id):
        results[room_id] = []
    results[room_id].append({"username": username, "wpm": wpm, "accuracy": accuracy})
    emit("leaderboard", {"data": sorted(results[room_id], key=lambda x: x["wpm"], reverse=True)}, to=room_id)
    if len(results[room_id]) == len(rooms[room_id]):
        close_room(room_id)




def connect_to_database():
    try:
        conn = psycopg2.connect(database_url)
        return conn
    except Exception as e:
        print("Error connecting to database:", e)
        return None

class RegisterResource(Resource):
    def post(self):
        # Extract credentials from request body
        name = request.json.get('name')
        password = request.json.get('password')
        email = request.json.get('email')
        if name is None or password is None:
            return {"message": "Name and password are required"}, 400

        # Connect to database
        conn = connect_to_database()
        if conn is None:
            return {"message": "Error connecting to database"}, 500

        # Check if user exists
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE name = %s", (name,))
        user = cursor.fetchone()
        if user is not None:
            return {"message": "Username is already taken"}, 400

        # Hash password
        password = hashlib.sha256(password.encode()).hexdigest()

        # Insert user into database
        cursor.execute("INSERT INTO users (name, pass_hash, email) VALUES (%s, %s, %s)", (name, password, email))
        conn.commit()
        cursor.close()

        # Generate JWT, payload should be name and email
        jwt_payload = {
            "name": name,
            "email": email
        }

        token = jwt.encode(jwt_payload, secret_key, algorithm="HS256")

        # Set JWT as a cookie
        response = make_response({"message": "User registered successfully"})
        response.status_code = 201
        response.set_cookie('Authorization', token, httponly=True, secure=True, samesite='None', max_age=864000)  # Set secure=True in production

        return response

class LoginResource(Resource):
    def post(self):
        # Extract credentials from request body
        name = request.json.get('name')
        password = request.json.get('password')
        if name is None or password is None:
            return {"message": "Name and password are required"}, 400

        # Connect to database
        conn = connect_to_database()
        if conn is None:
            return {"message": "Error connecting to database"}, 500

        # Hash password
        password = hashlib.sha256(password.encode()).hexdigest()

        # Check if user exists and credentials match
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE name = %s AND pass_hash = %s", (name, password))
        user = cursor.fetchone()
        if user is None:
            return {"message": "Invalid credentials"}, 401

        # Generate JWT, payload should be name and email
        jwt_payload = {
            "name": name,
            "email": user[2]  # assuming email is at index 2 in the user tuple
        }

        token = jwt.encode(jwt_payload, secret_key, algorithm="HS256")

        # Set JWT as a cookie
        response = make_response({"message": "User logged in successfully"})
        response.status_code = 200
        response.set_cookie('Authorization', token, httponly=True, secure=True, samesite='None', max_age=864000)

        return response

class StatsResource(Resource):
    def post(self):
        data = request.get_json()
        jwt_token = request.cookies.get("Authorization")
        if not jwt_token:
            return {"message": "Invalid Authorization token"}, 401
        jwt_data = None
        try:
            jwt_data = jwt.decode(jwt_token, secret_key, algorithms=["HS256"])
        except:
            return {"message": "Invalid Authorization token"}, 401
        name = jwt_data["name"]
        test_mode = data.get('test_mode')
        test_limit = data.get('test_limit')
        wpm = data.get('wpm')
        accuracy = data.get('accuracy')
        test_time = data.get('test_time')
        md5_hash = data.get('md5_hash')

        # we will also receive a hash of Current timestamp + " " + mode (words/time) + " " + limit(15,30,60,90)
        # so we have to create this hash and compare it with the hash we receive to verify the data

        md5_hash_check = hashlib.md5(f"{test_time} {test_mode} {test_limit}".encode()).hexdigest()
        if md5_hash != md5_hash_check:
            return {"message": "Invalid data"}, 400

        conn = connect_to_database()
        if conn is None:
            return {"message": "Error connecting to database"}, 500

        cursor = conn.cursor()

        try:
            # Inserting data into the stats table and returning the UID of the inserted row
            cursor.execute("INSERT INTO stats (username, test_mode, test_limit, wpm, accuracy, test_time) VALUES (%s, %s, %s, %s, %s, %s) RETURNING UID", (name, test_mode, test_limit, wpm, accuracy, test_time))
            uid = cursor.fetchone()[0]  # Fetching the returned UID
            conn.commit()
            return {"UID": uid, "message": "Result saved successfully"}, 201  # Return the UID as a JSON response
        except psycopg2.Error as e:
            # Handling database errors
            conn.rollback()
            return {"message": "Database error: {}".format(e)}, 500
        finally:
            # Closing cursor and connection
            cursor.close()
            conn.close()

class ProfileResource(Resource):
    def get(self):
        jwt_token = request.cookies.get('Authorization')
        if jwt_token is None:
            return {"message": "Unauthorized"}, 401
        
        try:
            payload = jwt.decode(jwt_token, secret_key, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return {"message": "Token has expired"}, 401
        except jwt.InvalidTokenError:
            return {"message": "Invalid token"}, 401
        
        username = payload.get('name')
        email = payload.get('email')

        conn = connect_to_database()
        if conn is None:
            return {"message": "Error connecting to database"}, 500

        cursor = conn.cursor()

        # recent 4 tests

        cursor.execute("SELECT * FROM stats WHERE username = %s ORDER BY test_time DESC LIMIT 4", (username,))
        _recent_tests = cursor.fetchall()

        # best wpm in each mode , fetch whole row with max wpm

        
        cursor.execute("""
            SELECT *
            FROM (
                SELECT 
                    *,
                    ROW_NUMBER() OVER (PARTITION BY test_mode ORDER BY wpm DESC) AS rank
                FROM stats
                WHERE username = %s
            ) AS ranked_stats
            WHERE rank = 1
            AND username = %s
        """, (username, username))

        _best_wpm = cursor.fetchall()
        recent_tests = []
        best_wpm = []

        for test in _recent_tests:
            recent_tests.append([test[0], test[1], test[2], float(test[3]), float(test[4])])

        for test in _best_wpm:
            best_wpm.append([test[0], test[1], test[2], float(test[3]), float(test[4])])

        return {
            "recent_tests": recent_tests,
            "best_wpm": best_wpm,
            "username": username,
            "email": email
        }, 200

        

class LeaderboardResource(Resource):
    def post(self):
        test_mode = request.json.get('test_mode')
        test_limit = request.json.get("test_limit")

        conn = connect_to_database()
        if conn is None:
            return {"message": "Error connecting to database"}, 500

        cursor = conn.cursor()

        # max wpm in given mode

        cursor.execute("SELECT * FROM stats WHERE test_mode = %s AND wpm = (SELECT MAX(wpm) FROM stats WHERE test_mode = %s AND test_limit = %s)", (test_mode, test_mode, test_limit))
        _max_wpm = cursor.fetchall()
        max_wpm = []
        for test in _max_wpm:
            max_wpm.append([test[0], test[1], test[2], float(test[3]), float(test[4]), test[5]])
        return {
            "max_wpm": max_wpm
        }, 200

class ResultResource(Resource):
    def get(self):
        result_id = request.args.get("id")
        if not result_id:
            return {"message": "Result id is required"}, 400
        conn = connect_to_database()
        if conn is None:
            return {"message": "Error connecting to database"}, 500

        cursor = conn.cursor()
        cursor.execute("SELECT * FROM stats WHERE UID = %s", result_id)
        _result_data = cursor.fetchone()
        if not _result_data:
            return {"message": "Invalid result id"}, 400
        result_data = [[_result_data[0], _result_data[1], _result_data[2], float(_result_data[3]), float(_result_data[4]), _result_data[5]]]
        return {"message": "Result fetched successfully", "result": result_data}, 200




api.add_resource(RegisterResource, '/register')
api.add_resource(LoginResource, '/login')
api.add_resource(StatsResource, '/stats')
api.add_resource(ProfileResource, '/profile')
api.add_resource(LeaderboardResource, '/leaderboard')
api.add_resource(ResultResource, "/result")

if __name__ == '__main__':
<<<<<<< HEAD
    sio.run(app, allow_unsafe_werkzeug=True, debug=True)
=======
    app.run()
>>>>>>> 944b2322fe1023a964a2d613bf4be83e41ce2064
