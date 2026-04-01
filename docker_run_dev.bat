@echo off

cd .\swzilina\

start cmd /k "npm run watch"
start cmd /k "npx sass --watch .:."
start cmd /k "ngrok config add-authtoken 3BiRHm4nENPy49HZVOtJprxcpwj_bG3tnyuBv8sE8PmRNQN5 & ngrok http --domain=delinquently-overdistraught-glynis.ngrok-free.dev 8000"

pause