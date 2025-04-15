# rbac/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import ActivityLog, Role, Service, UserRole
import inspect

User = get_user_model()

MODEL_ACTION_MAP = {
    'post_save': 'CREATE' if created else 'UPDATE',
    'post_delete': 'DELETE'
}

@receiver(post_save, sender=User)
@receiver(post_save, sender=Role)
@receiver(post_save, sender=Service)
@receiver(post_save, sender=UserRole)
def log_model_change(sender, instance, created, **kwargs):
    try:
        # Get the request object if available
        request = None
        for frame_record in inspect.stack():
            if frame_record[3] == 'get_response':
                request = frame_record[0].f_locals['request']
                break

        actor = request.user if request and hasattr(request, 'user') and request.user.is_authenticated else None
        
        ActivityLog.objects.create(
            actor=actor,
            action='CREATE' if created else 'UPDATE',
            model_affected=sender.__name__,
            instance_id=str(instance.id),
            details=f"{'Created' if created else 'Updated'} {sender.__name__}: {str(instance)}"
        )
    except Exception as e:
        logger.error(f"Failed to log model change: {str(e)}")

@receiver(post_delete, sender=User)
@receiver(post_delete, sender=Role)
@receiver(post_delete, sender=Service)
@receiver(post_delete, sender=UserRole)
def log_model_deletion(sender, instance, **kwargs):
    try:
        ActivityLog.objects.create(
            actor=None,  # Can't get request in delete signals
            action='DELETE',
            model_affected=sender.__name__,
            instance_id=str(instance.id),
            details=f"Deleted {sender.__name__}: {str(instance)}"
        )
    except Exception as e:
        logger.error(f"Failed to log model deletion: {str(e)}") 