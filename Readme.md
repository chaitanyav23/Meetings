```
This project is a full-stack meeting scheduling platform that I built to seamlessly integrate with Google Calendar. Users can sign in with their Google accounts, create and manage meetings, and instantly send invitations to both registered users and external guests. For registered users, events sync directly to their Google Calendars, and real-time notifications keep everyone updated via in-app messages. Unregistered invitees receive email invitations, with Gmail users benefiting from additional Google Calendar integration after accepting an invite.

The system is built with a modern tech stack:  
- **Frontend:** React (with Context API, React Router), Axios, and Socket.IO-client for real-time communication.
- **Backend:** Node.js, Express.js, PostgreSQL for data storage, Passport.js for Google OAuth authentication, and Socket.IO for real-time notification delivery.
- **API Integration & Services:** Google Calendar API for event management, Nodemailer (or similar) for sending emails, and robust Webhook endpoints for external calendar updates.

I designed the infrastructure for reliability, real-time collaboration, secure authentication (OAuth 2.0 + JWT-based sessions), and smooth cross-platform integration. My primary goal was to deliver a user-friendly, flexible scheduling solution that automates calendar synchronization and ensures timely notifications—leveraging a powerful JavaScript and PostgreSQL-based stack.

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
