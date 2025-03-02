# Project Name: LinkShare


**Live Website:** [LinkShare](https://linkshare-979a6.web.app/) 

**LinkShare OverView**  
The LinkShare system allows users to generate, manage, and share links for different types of content (text, images, or files). Users can choose to set these links as public or private, with private links offering secure access through authentication or a password. The system ensures that users have full control over their shared links, including deletion, modification, and setting expiration times. The added bonus of link access analytics allows users to track how many times their links have been accessed.

 ## 🖼 Screenshot  
![LinkShare](src/assets/Screenshot_2-3-2025_23523_linkshare-979a6.web.app.jpeg)

## 📖 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Dependencies used](#dependencies-used)
- [Installation](#installation)


## 🚀Features  

- **Link Creation & Management**: Users can create shareable links for various content types such as text, images, and files.
- **Access Control & Security**: Public Links: Accessible by anyone without any restriction.
  Private Links: Require authentication (login) or a password for access.
  Users can set an expiration time for each link, after which it will no longer be accessible.
- **Real-Time Updates:**: Instantly sync Link changes with the MongoDB database to ensure persistence and data consistency.
- **Authentication & Security**: Implement user authentication and authorization for secure access and personalized experiences.  

---

## 🛠️ Tech Used 

- **Frontend**: React, Tailwind CSS  
- **Backend**: Node.js, Express  
- **Database**: MongoDB  
- **Build Tool**: VS Code 

  ---
## 📦 Dependencies  
The project uses the following npm packages:  
```
"@tailwindcss/vite": "^4.0.7",
  "axios": "^1.7.9",
  "framer-motion": "^12.4.7",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.54.2",
  "react-icons": "^5.5.0",
  "react-router-dom": "^7.2.0",
  "socket.io-client": "^4.8.1",
  "sweetalert2": "^11.17.2",
  "tailwindcss": "^4.0.7",
  "uuid": "^11.1.0" 
  "express": "^4.18.2",
  "mongoose": "^7.2.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
```

##  Installation & Setup  
Follow these steps to run the project locally:  

### 1 Clone the Client Repository  
```
git clone https://github.com/mdimranictiu/sharelink-client-update.git
cd sharelink-client
```

### 3 Install Dependencies
```
npm install
```
### 4 Start the Development Server
```
npm run dev
```

 ## Resources & Links
📖 React Documentation: https://react.dev/
📖 Tailwind CSS Documentation: https://tailwindcss.com/
🔥 Firebase: https://firebase.google.com/

📌 Feel free to contribute, report issues, or share your feedback! 🚀


