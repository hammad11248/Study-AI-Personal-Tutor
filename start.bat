@echo off
title StudyAI Runner
echo ==========================================
echo           Starting StudyAI...
echo ==========================================

echo [1/2] Launching Backend Server in a new window...
start "StudyAI Backend" cmd /k "cd backend && venv\Scripts\activate && python -m uvicorn main:app --reload"

echo [2/2] Launching Frontend Server in a new window...
start "StudyAI Frontend" cmd /k "cd frontend && npm run dev"

echo ==========================================
echo  Servers are starting up! 
echo  Please check the new terminal windows.
echo  Website will be available at: http://localhost:5173
echo ==========================================
pause
