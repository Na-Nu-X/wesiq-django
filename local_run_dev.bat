@echo off

cd .\wesiq\

call .\.venv\Scripts\activate
start cmd /k "call .\.venv\Scripts\activate && python manage.py runserver"
start cmd /k "npm run watch"
start cmd /k "npx sass --watch .:."

pause