from django.urls import path
from .views import get_towers
from . import views

urlpatterns = [
    path("", views.maps, name="maps"),
    path("maps_search", views.maps_search, name="maps_search"),
    path('get-towers/', get_towers, name='get_towers'),
]


