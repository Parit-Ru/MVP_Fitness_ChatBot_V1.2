# Project Overview

MVP Fitness ChatBot V1.2 is a simple chatbot application designed to provide basic fitness guidance and workout recommendations.
This project was developed as part of a university course to demonstrate the concept of building a Minimum Viable Product (MVP) using chatbot technology.

The chatbot allows users to interact through text and receive suggestions related to exercise, workouts, and general fitness information.

## Objectives

The objectives of this project are:
To design and develop a simple chatbot for fitness assistance
To apply programming and AI concepts learned in class
To demonstrate how a chatbot can be used to support users in planning workouts
To build a Minimum Viable Product (MVP) for a fitness-related application

## Features

Chat-based interaction with the user
Basic workout recommendations
Fitness-related information and guidance
imple chatbot logic for responding to user input

This project was created for educational purposes as part of a university course.
It focuses on learning the development process of a chatbot-based application and implementing an MVP concept.

## How to run

Once you clone this project you need to
Install dependencies both Frontend/Backend
`npm install`  
you can run backend by go in Backend/ and run
`npm run dev`  
you can run frontend by go in Frontend/ and run
`num run dev`

## .env example

Frontend/.env
you can get most of this from firebaseConfig

```
VITE_FIREBASE_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwx
VITE_FIREBASE_AUTH_DOMAIN=://firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=://appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_MEASUREMENT_ID=G-ABCDEFGHIJ
VITE_API_URL=http://localhost:5000/ #change to your domain once deploy
```

Backend/.env
using Hugging face and Groq API token

```
HUGGINGFACE_TOKEN = your-api-key-here
GROQ_API_KEY = your-api-key-here
```

## View demo here
this is a live demo website using Render(might slow on start up)
[MVP_Fitness_ChatBot](https://parit-ru.github.io/MVP_Fitness_ChatBot_V1.2/)
