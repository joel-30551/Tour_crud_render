from flask import Flask, render_template, request, jsonify
import mysql.connector

app = Flask(__name__)


db = mysql.connector.connect(
    host="localhost",
    user="root",          
    password="Ajoel25",  
    database="tour_manager"
)
cursor = db.cursor(dictionary=True)


@app.route("/")
def home():
    return render_template("index.html")



@app.route("/api/tours", methods=["GET"])
def get_tours():
    cursor.execute("SELECT * FROM tours")
    return jsonify(cursor.fetchall())



@app.route("/api/tours", methods=["POST"])
def add_tour():
    data = request.get_json() if request.is_json else request.form
    query = """
        INSERT INTO tours (tour_id, name, destination, start_date, end_date, price, tour_guide)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    values = (
        data["tourId"],
        data["name"],
        data["destination"],
        data["startDate"],
        data["endDate"],
        data["price"],
        data["tourGuide"]
    )
    cursor.execute(query, values)
    db.commit()
    return jsonify({"message": "Tour added successfully"}), 201



@app.route("/api/tours/<tour_id>", methods=["PUT"])
def update_tour(tour_id):
    data = request.json
    query = """
        UPDATE tours
        SET name=%s, destination=%s, start_date=%s, end_date=%s, price=%s, tour_guide=%s
        WHERE tour_id=%s
    """
    values = (
        data["name"], data["destination"], data["startDate"],
        data["endDate"], data["price"], data["tourGuide"], tour_id
    )
    cursor.execute(query, values)
    db.commit()
    return jsonify({"message": "Tour updated successfully"})



@app.route("/api/tours/<tour_id>", methods=["DELETE"])
def delete_tour(tour_id):
    cursor.execute("DELETE FROM tours WHERE tour_id=%s", (tour_id,))
    db.commit()
    return jsonify({"message": "Tour deleted successfully"})



if __name__ == "__main__":
    app.run()