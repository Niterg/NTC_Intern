# utils.py
# from django.contrib.auth import get_user_model
# from .models import ActivityLog

# User = get_user_model()


# def log_activity(request, action, model_affected, instance_id, details=''):
#     if not request.user.is_authenticated:
#         return None

#     return ActivityLog.objects.create(
#         actor=request.user,
#         action=action,
#         model_affected=model_affected,
#         instance_id=str(instance_id),
#         details=details
#     )
