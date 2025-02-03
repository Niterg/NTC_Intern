# MapUI
- Create web interface using `django`
- Use `leaflet` for implementing the mapGUI
- Create a polygonal area to fetch  `lattitude` and `longitude`  
    - The polygon's area within should include the data as the list of Tower within the created area 
- Create a database with dummy towerdata (`longitude`, `lattitude`, `provincename`, `region`)
- Upon selection or polygon creation on the map, it should show list of Tower's within it

## Web Interface in `Django`

- Download the above file as ``zip`` and extract them into a directory, then perform following commands
    - Create a virtual environment as
    ```ps
    python -v venv myenv 
    myenv/Scripts/activate
    ```
    - Open the ``downloaded folder`` as 
    ```ps
    cd MapUI
    cd mapui
    ```
    - Create a database named ``mapdata`` in ``PostgresSQL``, the name and password can be found in ``settings.py``
      - Insert the ``dummy_towers.sql`` into the table named ``map_app_tower``
    - To run the ``django file`` run the command
    ```ps
    python manage.py runserver
    ```
    - The ``Towers`` may not be seen as it is imported from local database from ``postgres``
