from django.urls import path
from .views import get_towers
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # path("", views.map_search, name="mao_search"),
    path("", views.show_towers, name="show_towers"),
    path('get-towers/', views.get_towers, name='get_towers'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
