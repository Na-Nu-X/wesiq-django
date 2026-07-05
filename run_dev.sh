#!/bin/bash

cd ./wesiq/

# Docker
gnome-terminal -- bash -c "docker compose up -d; exec bash"

# NPM Watch
gnome-terminal -- bash -c "npm run watch; exec bash"

# SASS Watch
gnome-terminal -- bash -c "npx sass --watch .:.; exec bash"

# Ngrok
# gnome-terminal -- bash -c "ngrok config add-authtoken 3BiRHm4nENPy49HZVOtJprxcpwj_bG3tnyuBv8sE8PmRNQN5 && ngrok http --domain=delinquently-overdistraught-glynis.ngrok-free.dev 8000; exec bash"

# Django Translations
# gnome-terminal -- bash -c "
# docker compose exec web python manage.py makemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de &&
# docker compose exec web python manage.py makemessages -d djangojs -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de -e ts -i node_modules &&
# docker compose exec web python manage.py compilemessages;
# exec bash"