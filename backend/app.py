from flask import Flask, request, make_response, jsonify
from flask_restful import Api, Resource
import jwt
import secrets
import psycopg2
import hashlib
import os
from flask_cors import CORS
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app, supports_credentials=True)
api = Api(app)

load_dotenv()

secret_key = os.getenv('SECRET_KEY')
database_url = os.getenv('DATABASE_URL')

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
        cursor.execute("INSERT INTO stats (username, test_mode, test_limit, wpm, accuracy, test_time) VALUES (%s, %s, %s, %s, %s, %s)", (name, test_mode, test_limit, wpm, accuracy, test_time))
        conn.commit()
        cursor.close()

        return {"message": "Result saved successfully"}, 201

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

api.add_resource(RegisterResource, '/register')
api.add_resource(LoginResource, '/login')
api.add_resource(StatsResource, '/stats')
api.add_resource(ProfileResource, '/profile')
api.add_resource(LeaderboardResource, '/leaderboard')

if __name__ == '__main__':
    app.run()
