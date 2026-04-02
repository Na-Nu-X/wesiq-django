@echo off

cd .\swzilina\

start cmd /k "docker compose up -d"
start cmd /k "npm run watch"
start cmd /k "npx sass --watch .:."
start cmd /k "ngrok config add-authtoken 3BiRHm4nENPy49HZVOtJprxcpwj_bG3tnyuBv8sE8PmRNQN5 & ngrok http --domain=delinquently-overdistraught-glynis.ngrok-free.dev 8000"
start cmd /k "docker compose exec web python manage.py makemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR & docker compose exec web python manage.py makemessages -d djangojs -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -e ts -i node_modules & docker compose exec web python manage.py compilemessages"

pause