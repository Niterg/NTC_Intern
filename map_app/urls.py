from django.urls import path
from .views import get_towers
from . import views
from django.conf import settings
from django.conf.urls.static import static
app_name = 'map_app'
urlpatterns = [
    # path("", views.maps, name="maps"),
    # path("maps_search", views.maps_search, name="maps_search"),
    path("show_towers/", views.show_towers, name="show_towers"),
    path('get-towers/', views.get_towers, name='get_towers'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
