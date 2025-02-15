from django.conf import settings
from django.urls import path, include, re_path
from django.views.generic.base import RedirectView
from django.conf.urls.static import static
from authentication import views

app_name = 'authentication'
urlpatterns = [

    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    re_path(r'^$', views.login_view, name='root'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
