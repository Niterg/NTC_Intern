from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rbac.models import UserProfile, Role, UserRole, Service


class Command(BaseCommand):
    help = 'Creates a superadmin user with profile, role, and services'

    def handle(self, *args, **options):
        User = get_user_model()

        # 1. Create or get the superadmin user
        user, created = User.objects.get_or_create(
            username='superadmin',
            defaults={
                'email': 'superadmin@example.com',
                'first_name': 'Super',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )

        if created:
            user.set_password('admin123')  # Change this to a secure password
            user.save()
            self.stdout.write(self.style.SUCCESS(
                'Superadmin user created successfully!'))
        else:
            self.stdout.write('Superadmin user already exists.')
            return

        # 2. Create user profile
        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'middle_name': '',
                'phone_number': '+1234567890',
                'address': 'Superadmin Headquarters'
            }
        )

        # 3. Create or get the superadmin role
        role, role_created = Role.objects.get_or_create(
            name='Super Administrator',
            hierarchy_level=10,
            defaults={
                'description': 'Highest level administrator with all permissions'
            }
        )

        # 4. Create or get services and assign to superadmin role
        services_to_create = [
            {'name': 'Map Show Towers', 'view_name': 'map_app:show_towers',
             'description': 'Access to view towers on map'},
            {'name': 'View Logs', 'view_name': 'rbac:activity_logs',
             'description': 'Access to view logs'},
            {'name': 'Send Messages', 'view_name': 'map_app:send_messages',
             'description': 'Send Messages'},
            {'name': 'View Messages', 'view_name': 'map_app:view_messages',
             'description': 'View Messages'},
            {'name': 'GeoJson Maps', 'view_name': 'map_app:geojson_map',
             'description': 'Get GeojsonMaps'},
            {'name': 'Get Towers', 'view_name': 'map_app:get_towers',
             'description': 'Get Tower Information'},
        ]

        for service_data in services_to_create:
            service, _ = Service.objects.get_or_create(
                view_name=service_data['view_name'],
                defaults={
                    'name': service_data['name'],
                    'description': service_data['description']
                }
            )
            role.services.add(service)

        # 5. Assign role to user
        UserRole.objects.get_or_create(
            user=user,
            role=role
        )

        self.stdout.write(self.style.SUCCESS(
            f"""\nSuperadmin setup complete!
            Username: {user.username}
            
            Assigned Services: {', '.join([s.name for s in role.services.all()])}\n"""
        ))
