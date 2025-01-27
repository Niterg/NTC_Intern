from django.shortcuts import render
from .models import Tower
from django.http import HttpResponse, JsonResponse
# Create your views here.
def maps(request):
    return render(request, 'map_app/maps.html')
def maps_search(request):
    return render(request, 'map_app/maps_search.html')
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