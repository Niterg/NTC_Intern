from django.db import models
from django.conf import settings
from django.contrib.auth.models import User, Group
from django.core.exceptions import ValidationError

from django.contrib.auth import get_user_model

User = get_user_model()


class Service(models.Model):
    """Represents a function/view that can be accessed"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    # e.g., 'map_app:show_towers'
    view_name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Role(models.Model):
    """Represents a role in the hierarchy"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    hierarchy_level = models.PositiveIntegerField(unique=True)  # 1 is highest
    parent = models.ForeignKey(
        'self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    services = models.ManyToManyField(
        Service, blank=True, related_name='roles')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['hierarchy_level']

    def __str__(self):
        return f"{self.name} (Level {self.hierarchy_level})"

    def clean(self):
        # Ensure hierarchy_level is unique
        if Role.objects.filter(hierarchy_level=self.hierarchy_level).exclude(pk=self.pk).exists():
            raise ValidationError(
                f"A role with hierarchy level {self.hierarchy_level} already exists.")

        # Validate parent hierarchy
        if self.parent and self.parent.hierarchy_level <= self.hierarchy_level:
            raise ValidationError(
                "Parent role must have a higher hierarchy level (lower number) than child.")


class UserRole(models.Model):
    """Links users to roles"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # Changed from User
        on_delete=models.CASCADE,
        related_name='role_assignment'
    )
    role = models.ForeignKey(
        'Role',
        on_delete=models.CASCADE,
        related_name='user_assignments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.role.name}"


# class ActivityLog(models.Model):
#     ACTION_CHOICES = [
#         ('CREATE', 'Create'),          # 6 chars
#         ('UPDATE', 'Update'),          # 6 chars
#         ('DELETE', 'Delete'),          # 6 chars
#         ('ASSIGN', 'Assign'),          # 6 chars
#         ('REVOKE', 'Revoke'),          # 6 chars
#         ('LOGIN', 'Login'),            # 5 chars
#         ('LOGOUT', 'Logout'),          # 6 chars
#         ('UNAUTHORIZED', 'Unauthorized'),  # 12 chars
#     ]

#     # Increase max_length to at least 12

#     actor = models.ForeignKey(
#         User, on_delete=models.SET_NULL, null=True, related_name='actions')
#     action = models.CharField(max_length=20, choices=ACTION_CHOICES)
#     model_affected = models.CharField(max_length=50)
#     instance_id = models.CharField(max_length=20)
#     details = models.TextField(blank=True)
#     timestamp = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return f"{self.actor} {self.action} {self.model_affected} {self.timestamp}"

#     class Meta:
#         ordering = ['-timestamp']
