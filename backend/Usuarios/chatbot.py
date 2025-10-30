import openai
from dotenv import load_dotenv
import os

load_dotenv()  # Cargar API Key desde el archivo .env

openai.api_key = os.getenv("OPENAI_API_KEY")

def obtener_respuesta(mensaje_usuario):
    respuesta = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "Eres un asistente virtual que ayuda a levantar requerimientos de software."},
            {"role": "user", "content": mensaje_usuario}
        ]
    )
    return respuesta.choices[0].message.content
