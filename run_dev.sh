#!/bin/bash

cd ./wesiq/

# Docker
gnome-terminal --title="Docker" -- bash -c "docker compose up -d; exec bash"

# NPM Watch
gnome-terminal --title="NPM Watch" -- bash -c "npm run watch; exec bash"

# SASS Watch
gnome-terminal --title="SASS Watch" -- bash -c "npx sass --watch .:.; exec bash"

# Ngrok
# NGROK_AUTHTOKEN And NGROK_DOMAIN Are Read From The Root .env (Never Commit The Token)
# export NGROK_AUTHTOKEN="$(grep -E '^NGROK_AUTHTOKEN=' ../.env | cut -d= -f2- | tr -d '"')"
# NGROK_DOMAIN="$(grep -E '^NGROK_DOMAIN=' ../.env | cut -d= -f2- | tr -d '"')"
# gnome-terminal --title="Ngrok" -- bash -c "ngrok http --domain=$NGROK_DOMAIN 8000; exec bash"

# # Django Translations
# gnome-terminal --title="Django Translations" -- bash -c "
# docker compose exec web python manage.py makemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de &&
# docker compose exec web python manage.py makemessages -d djangojs -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de -e ts -i node_modules &&
# docker compose exec web python manage.py compilemessages;
# exec bash"

# Useful Commands:
# docker compose logs -f web
# docker exec -it wesiq_web python manage.py makemigrations
# docker exec -it wesiq_web python manage.py migrate
# docker compose restart
# docker compose down web
# docker compose up web
# docker compose exec web python locale/tools/build_json.py   # Mobile App JSON Catalogs From The .po Files