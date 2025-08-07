#from flask import Flask, jsonify
#from Pedir_Token import get_tuya_token_body_only
#from Pedir_valores_sensor import get_device_state
#from flask_cors import CORS
#import time

#app = Flask(__name__)
#CORS(app)
# Variable para cachear último estado
#ultimo_estado = {}

#@app.route('/datos', methods=['GET'])
#def obtener_datos():
    #global ultimo_estado
    #token_body = get_tuya_token_body_only()

    #if token_body and token_body.get("success"):
        #access_token = token_body["result"]["access_token"]
        # Llamar a tu función que obtiene datos del sensor
        #data = get_device_state(access_token, devolver_json=True)  # Ajustamos para devolver JSON
        #if data:
        #    ultimo_estado = data
         #   return jsonify(data)
        #else:
         #   return jsonify({"error": "No se pudieron obtener datos del sensor"}), 500
    #else:
     #   return jsonify({"error": "No se pudo obtener token de Tuya"}), 500

#if __name__ == '__main__':
  #  app.run(host='0.0.0.0', port=5000, debug=True)

################################################################################

from flask import Flask, jsonify
from flask_cors import CORS
from influxdb import InfluxDBClient

app = Flask(__name__)
CORS(app)

# Configuración InfluxDB
INFLUX_HOST = "localhost"
INFLUX_PORT = 8086
INFLUX_DB = "deteccion"

client = InfluxDBClient(host=INFLUX_HOST, port=INFLUX_PORT)
client.switch_database(INFLUX_DB)

@app.route("/datos", methods=["GET"])
def obtener_datos():
    try:
        query = """
        SELECT LAST("value_int") AS value_int, LAST("value_float") AS value_float, LAST("value_str") AS value_str
        FROM sensor_presencia
        GROUP BY "code"
        """
        result = client.query(query)

        datos = []
        for serie in result.raw.get("series", []):
            code = serie["tags"]["code"]
            valores = serie["values"][0]  # Último registro
            value = valores[1] or valores[2] or valores[3]  # int, float o str
            datos.append({"code": code, "value": value})

        return jsonify(datos)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)