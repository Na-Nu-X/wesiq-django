@echo off

cd .\wesiq\

:: Docker
start cmd /k "docker compose up -d"

:: NPM Watch
start cmd /k "npm run watch"

:: SASS Watch
start cmd /k "npx sass --watch .:."

:: Ngrok
:: NGROK_AUTHTOKEN And NGROK_DOMAIN Are Read From The Root .env (Never Commit The Token)
:: for /f "usebackq tokens=1,* delims==" %%A in ("..\.env") do (if "%%A"=="NGROK_AUTHTOKEN" set "NGROK_AUTHTOKEN=%%~B") & (if "%%A"=="NGROK_DOMAIN" set "NGROK_DOMAIN=%%~B")
:: start cmd /k "ngrok http --domain=%NGROK_DOMAIN% 8000"

:: Django Translations
:: start cmd /k "docker compose exec web python manage.py makemessages -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de && docker compose exec web python manage.py makemessages -d djangojs -l sk -l cs -l en -l es -l fr -l uk -l ru -l pt_BR -l de -e ts -i node_modules && docker compose exec web python manage.py compilemessages"

pause