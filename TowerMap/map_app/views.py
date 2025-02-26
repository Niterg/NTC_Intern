from .firebase_views import get_message_groups  # Adjust import if in views.py
from django.http import JsonResponse
import json
import os
from django.conf import settings
from django.shortcuts import render
from .models import Tower, UserCell
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import db
from django.contrib.auth.decorators import login_required


@login_required(login_url='authentication:login_view')
def show_towers(request):
    message_groups = get_message_groups()
    return render(request, 'map_app/show_towers.html', {'message_groups': message_groups})


@login_required(login_url='authentication:login_view')
def view_messages(request):
    message_groups = get_message_groups()
    return render(request, 'map_app/view_messages.html', {'message_groups': message_groups})


@login_required(login_url='authentication:login_view')
def geojson_map(request):
    # Correct path to the static folder where your GeoJSON files are stored
    geojson_folder = os.path.join(
        settings.BASE_DIR, 'map_app', 'static', 'json')

    # List all GeoJSON files in the folder
    geojson_files = [f for f in os.listdir(
        geojson_folder) if f.endswith('.geojson')]

    return render(request, 'map_app/map.html', {'geojson_files': geojson_files})


def maps(request):
    return render(request, 'map_app/maps.html')


def maps_search(request):
    return render(request, 'map_app/maps_search.html')


@login_required(login_url='authentication:login_view')
def get_towers(request):
    towers = Tower.objects.all()
    tower_data = [
        {
            'id': tower.id,
            'name': tower.name,
            'latitude': tower.latitude,
            'longitude': tower.longitude,
        }
        for tower in towers
    ]
    return JsonResponse({'towers': tower_data})


def firebase_config(request):
    config = {
        "apiKey": os.getenv("FIREBASE_API_KEY"),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN"),
        "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
        "projectId": os.getenv("FIREBASE_PROJECT_ID"),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET"),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
        "appId": os.getenv("FIREBASE_APP_ID"),
    }
    return JsonResponse(config)


# Send messages


@csrf_exempt
def send_message(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        tower_ids = data.get('tower_ids', [])
        message = data.get('message', '')

        # Get all numbers linked to selected towers
        cell_numbers = UserCell.objects.filter(
            tower_id__in=tower_ids).values_list('cell_number', flat=True)

        # Save messages in Firebase
        ref = db.reference('/messages')
        for number in cell_numbers:
            ref.child(number).push({'message': message})

        return JsonResponse({'success': True, 'sent_to': list(cell_numbers)})

    return JsonResponse({'error': 'Invalid request'}, status=400)
