from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# In-memory store (data disappears when server restarts)
tours = []

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/tours", methods=["GET"])
def get_tours():
    return jsonify(tours)


@app.route("/api/tours", methods=["POST"])
def add_tour():
    data = request.get_json() if request.is_json else request.form
    tour = {
        "tourId": data["tourId"],
        "name": data["name"],
        "destination": data["destination"],
        "startDate": data["startDate"],
        "endDate": data["endDate"],
        "price": data["price"],
        "tourGuide": data["tourGuide"],
    }
    tours.append(tour)
    return jsonify({"message": "Tour added successfully"}), 201


@app.route("/api/tours/<tour_id>", methods=["PUT"])
def update_tour(tour_id):
    data = request.json
    for tour in tours:
        if str(tour["tourId"]) == str(tour_id):
            tour.update({
                "name": data["name"],
                "destination": data["destination"],
                "startDate": data["startDate"],
                "endDate": data["endDate"],
                "price": data["price"],
                "tourGuide": data["tourGuide"],
            })
            return jsonify({"message": "Tour updated successfully"})
    return jsonify({"error": "Tour not found"}), 404


@app.route("/api/tours/<tour_id>", methods=["DELETE"])
def delete_tour(tour_id):
    global tours
    tours = [t for t in tours if str(t["tourId"]) != str(tour_id)]
    return jsonify({"message": "Tour deleted successfully"})


if __name__ == "__main__":
    app.run()
