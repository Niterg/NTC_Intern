from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages

# Login View


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            # Redirect to map_app after login
            return redirect("map_app:show_towers")
        else:
            messages.error(request, "Invalid username or password.")
    return render(request, "authentication/login.html")

# Logout View


def logout_view(request):
    logout(request)
    return redirect("authentication:login")
