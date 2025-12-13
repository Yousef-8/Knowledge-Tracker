# Knowledge Tracker
Knowledge Tracker is a full-stack web app designed to help people keep track of what they’re learning. Users can log any topic they study, and wuth just a click can  finds useful resources—like YouTube videos, quick explanations from DuckDuckGo, and summaries from Wikipedia using public APIs.


## Overview
Knowledge Tracker allows users to:
- Log topics they are studying
- Receive related YouTube videos, Wikipedia summaries, and DuckDuckGo instant answers
- View their learning progress.
- Sign up using email/password or Google OAuth

This project demonstrates full‑stack development, external API integration and secure authentication

---

## Tech Stack

### **Backend**
- Node.js
- Express.js 
- Axios for API request

### **Database**
- PostgreSQL

### **Frontend**
-EJS
-Bootstrap

### **Authentication**
- bcrypt (password hashing)
- express-session / cookie-session
- Google OAuth 2.0

### **External APIs**
- YouTube Data API – delivers related videos
- DuckDuckGo supplies relevant search result links
- Wikipedia API – about the topic in wikipedia 

---


##  Features
###  **Authentication**
- Registeration and  login 
- Secure hashing with bcrypt
- Session-based authentication with cookies
- Google OAuth login and registration

### **Study Tracking**
- A user can add a study topic
- For each topic ,the user can add study logs that include time and resorces
- View past topics and activity progress.
- Fetched resources are stored
- User can add more resources to existing topics. 

### **Automatic Resource Fetching**
When a user adds a topic, just with a click:
- YouTube API provides related videos
- DuckDuckGo provides related links
- Wikipedia search about that resource is provided

### **Dashboard**
- Shows recent topics and their coreesponding study logs
- A chart that demonstartes how much time is spent one each topic
- Topics and study logs can be deleted by the user.

---

## Installation & Setup
1. Clone the repository
```bash
git clone https://github.com/Yousef-8e/knowledge-tracker.git
cd knowledge-tracker
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
For the APIs and Google OAuth to work you need to visit  https://console.cloud.google.com/ and get your google_client_id, google_client_secret and youtube_key.

For the DATABASE_URL enter your database user, password and name 
```
DATABASE_URL=postgresql://user:password@localhost:5432/your_database_name
SESSION_SECRET=your_session_secret
GOOGLE_CLIENT_ID=google_client_id
GOOGLE_CLIENT_SECRET=google_client_secret
YOUTUBE_API_KEY=youtube_key
```

4.  Start the server
```bash
nodemon app.js
```

Server will run at: http://localhost:3000



## Future Improvements
- Add a summarizer.
- Enhanced Frontend using React.js
- Recommendation system 
- Share topics and study logs with others


## Author
Yousef-8
