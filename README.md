# Project Structure

MEETINGS/
├── backend/
│ ├── node_modules/
│ ├── src/
│ │ ├── config/
│ │ │ ├── db.js
│ │ │ └── passport.js
│ │ ├── controllers/
│ │ │ └── meetings.js
│ │ ├── middleware/
│ │ │ └── auth.js
│ │ ├── routes/
│ │ │ ├── auth.js
│ │ │ ├── invitations.js
│ │ │ ├── meetings.js
│ │ │ └── notifications.js
│ │ ├── services/
│ │ │ └── google.js
│ │ ├── sockets/
│ │ │ └── io.js
│ │ └── index.js
│ ├── .env
│ ├── package-lock.json
│ ├── package.json
│ └── README.md
├── database/
│ └── schema.sql
├── frontend/
│ ├── node_modules/
│ ├── public/
│ │ ├── favicon.ico
│ │ ├── index.html
│ │ ├── logo192.png
│ │ ├── logo512.png
│ │ ├── manifest.json
│ │ └── robots.txt
│ ├── src/
│ │ ├── api/
│ │ │ └── axios.js
│ │ ├── components/
│ │ │ ├── Login.js
│ │ │ ├── LoginButton.js
│ │ │ └── ProjectedRoute.js
│ │ ├── contexts/
│ │ │ ├── AuthContext.js
│ │ │ └── SocketContext.js
│ │ ├── pages/
│ │ │ ├── AccountSetup.js
│ │ │ ├── Home.js
│ │ │ ├── NewMeeting.js
│ │ │ └── Notifications.js
│ │ ├── styles/
│ │ │ ├── AccountSetup.css
│ │ │ └── Login.css
│ │ ├── App.css
│ │ ├── App.js
│ │ ├── App.test.js
│ │ ├── index.css
│ │ ├── index.js
│ │ ├── logo.svg
│ │ ├── reportWebVitals.js
│ │ └── setupTests.js
│ ├── .gitignore
│ ├── package-lock.json
│ ├── package.json
│ └── README.md
└── README.md

undefined
