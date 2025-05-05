# TowerMap/management/commands/load_sql.py
from django.core.management.base import BaseCommand
from django.db import connection
import re


class Command(BaseCommand):
    help = 'Loads SQL file with INSERT statements into database'

    def handle(self, *args, **options):
        sql_file = '/app/dummy_towers.sql'

        try:
            with open(sql_file, 'r') as f:
                # Read entire file and split into individual statements
                sql_content = f.read()
                # Remove comments and split by semicolons
                statements = [stmt.strip() for stmt in
                              re.split(r';\s*\n', sql_content)
                              if stmt.strip() and not stmt.strip().startswith('--')]

                with connection.cursor() as cursor:
                    for statement in statements:
                        if statement:  # Skip empty statements
                            try:
                                cursor.execute(statement)
                            except Exception as e:
                                self.stdout.write(self.style.WARNING(
                                    f"Warning: Could not execute statement - {e}"))
                                continue

            self.stdout.write(self.style.SUCCESS(
                f'Successfully executed {len(statements)} SQL statements'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading SQL: {e}'))
            raise
