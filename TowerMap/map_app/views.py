import json
import os
from django.conf import settings
from django.shortcuts import render
from .models import Tower, UserCell
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import db
# Create your views here.


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


def show_towers(request):
    return render(request, 'map_app/show_towers.html')


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
