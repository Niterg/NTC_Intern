from django.urls import path
from .views import login_view, logout_view, dashboard_view, create_user, delete_user

urlpatterns = [
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("create-user/", create_user, name="create_user"),
    path("delete-user/<int:user_id>/", delete_user, name="delete_user"),
]
