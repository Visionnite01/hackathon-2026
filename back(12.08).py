#ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU5YzI0MjgyMTMzOTRkZDI4MWU5ODg5MjFmN2RjMDYyIiwiaCI6Im11cm11cjY0In0="
#takes input as [lng, lat]

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import requests

app = Flask(__name__)

app.config["SECRET_KEY"] = "change-this"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

login_manager = LoginManager()
login_manager.init_app(app)

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU5YzI0MjgyMTMzOTRkZDI4MWU5ODg5MjFmN2RjMDYyIiwiaCI6Im11cm11cjY0In0"
ORS_URL = "https://api.openrouteservice.org/v2/directions/"



class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    green_score = db.Column(db.Float, default=0)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


with app.app_context():
    db.create_all()


def green_score(distance_m, duration_s, profile):
    emissions_map = {
        "driving-car": 0.192,
        "cycling-regular": 0.0,
        "foot-walking": 0.0
    }

    emissions = distance_m * (emissions_map.get(profile, 0.15) / 1000)
    return (emissions * 0.7) + (duration_s * 0.3), emissions


def get_route(start, end, profile):
    url = ORS_URL + profile

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "coordinates": [start, end],
        "alternative_routes": {"target_count": 2}
    }

    r = requests.post(url, json=body, headers=headers)

    if r.status_code != 200:
        return None

    return r.json()

def geocode_address(address):
    url = "https://api.openrouteservice.org/geocode/search"

    params = {
        "api_key": ORS_API_KEY,
        "text": address,
        "boundary.country": "GB"  # optional but improves accuracy
    }

    response = requests.get(url, params=params)
    data = response.json()

    try:
        coords = data["features"][0]["geometry"]["coordinates"]
        return coords  # [lng, lat]
    except:
        return None




@app.route("/register", methods=["POST"])
def register():
    data = request.json

    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "User exists"}), 400

    hashed = bcrypt.generate_password_hash(data["password"]).decode("utf-8")

    user = User(username=data["username"], password=hashed)
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "registered"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json

    user = User.query.filter_by(username=data["username"]).first()

    if not user or not bcrypt.check_password_hash(user.password, data["password"]):
        return jsonify({"error": "invalid"}), 401

    login_user(user)
    return jsonify({"message": "logged in"})


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "logged out"})


@app.route("/route", methods=["POST"])
@login_required
def route():
    data = request.json

    start_address = data["start"]
    end_address = data["end"]

    start = geocode_address(start_address)
    end = geocode_address(end_address)

    if not start or not end:
        return jsonify({"error": "Invalid address"}), 400

    profiles = ["driving-car", "cycling-regular", "foot-walking"]

    results = []

    for profile in profiles:
        adata = get_route(start, end, profile)
        if not adata:
            continue

        for f in adata["features"]:
            props = f["properties"]["summary"]

            distance = props["distance"]
            duration = props["duration"]

            score, emissions = green_score(distance, duration, profile)

            results.append({
                "profile": profile,
                "distance": distance,
                "duration": duration,
                "emissions": emissions,
                "geometry": f["geometry"],
                "score": score
            })

    if not results:
        return jsonify({"error": "no routes"}), 500

    best = min(results, key=lambda x: x["score"])

    current_user.green_score += best["score"]
    db.session.commit()

    return jsonify({
        "routes": results,
        "best_route": best,
        "user_score": current_user.green_score
    })


@app.route("/leaderboard")
def leaderboard():
    users = User.query.order_by(User.green_score.desc()).limit(10).all()

    return jsonify([
        {"username": u.username, "score": u.green_score}
        for u in users
    ])


@app.route("/")
def home():
    return "Green travel backend running"


if __name__ == "__main__":
    app.run(debug=True)