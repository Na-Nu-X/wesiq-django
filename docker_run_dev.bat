@echo off

cd .\wesiq\

:: Docker
start cmd /k "docker compose up -d"

:: NPM watch
start cmd /k "npm run watch"

:: SASS watch
start cmd /k "npx sass --watch .:."

:: Ngrok
:: start cmd /k "ngrok config add-authtoken 3BiRHm4nENPy49HZVOtJprxcpwj_bG3tnyuBv8sE8PmRNQN5 && ngrok http --domain=delinquently-overdistraught-glynis.ngrok-free.dev 8000"

:: Django Translations
:: start cmd /k "docker compose exec web python manage.py makemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de && docker compose exec web python manage.py makemessages -d djangojs -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de -e ts -i node_modules && docker compose exec web python manage.py compilemessages"

pause