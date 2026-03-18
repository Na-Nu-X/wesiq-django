@echo off

cd .\swzilina\

start cmd /k "npm run watch"
start cmd /k "npx sass --watch .:."

pause