from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib.auth.models import User, Group
from django.http import HttpResponseForbidden

# Function to check if user is a root user
def is_root_user(user):
    return user.groups.filter(name="Root Users").exists()

# User Login View
def login_view(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect("dashboard") if is_root_user(user) else redirect("map_home")
        else:
            return render(request, "authentication/login.html", {"error": "Invalid credentials"})
    return render(request, "authentication/login.html")

# User Logout View
@login_required
def logout_view(request):
    logout(request)
    return redirect("login")

# Dashboard for Root Users
@login_required
@user_passes_test(is_root_user)
def dashboard_view(request):
    users = User.objects.all()
    return render(request, "authentication/dashboard.html", {"users": users})

# Create User (Only Root Users)
@login_required
@user_passes_test(is_root_user)
def create_user(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        is_root = request.POST.get("is_root") == "on"
        user = User.objects.create_user(username=username, password=password)
        if is_root:
            root_group = Group.objects.get(name="Root Users")
            user.groups.add(root_group)
        return redirect("dashboard")
    return render(request, "authentication/create_user.html")

# Delete User (Only Root Users)
@login_required
@user_passes_test(is_root_user)
def delete_user(request, user_id):
    if request.user.id == user_id:  # Prevent self-deletion
        return HttpResponseForbidden("You cannot delete yourself.")
    
    user = User.objects.get(id=user_id)
    user.delete()
    return redirect("dashboard")
