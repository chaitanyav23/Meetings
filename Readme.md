```
Refer to the documentation 'Meetings app.pdf' for any doubts

The directory tree of the entire project is as follows:

MEETINGS/
├── backend/
│   ├── node_modules/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── passport.js
│   │   ├── controllers/
│   │   │   └── meetings.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── routes/
│   │   │   ├── webhooks/
│   │   │   │   └── google-calendar.js
│   │   │   ├── auth.js
│   │   │   ├── invitations.js
│   │   │   ├── meetings.js
│   │   │   └── notifications.js
│   │   ├── services/
│   │   │   └── google.js
│   │   ├── sockets/
│   │   │   └── io.js
│   │   └── index.js
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package-lock.json
│   └── package.json
├── database/
│   └── schema.sql
├── frontend/
│   ├── node_modules/
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── Login.js
│   │   │   ├── LoginButton.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   ├── AuthContext.js
│   │   │   └── SocketContext.js
│   │   ├── pages/
│   │   │   ├── Home.js
│   │   │   ├── NewMeeting.js
│   │   │   └── Notifications.js
│   │   ├── styles/
│   │   │   └── Login.css
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   └── setupTests.js
│   ├── .gitignore
│   ├── .env.example
│   ├── package-lock.json
│   └── package.json
├── .gitignore
├── package-lock.json
├── Meetings app.pdf
└── Readme.md
```
