# PrepShala

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)

**PrepShala** is a comprehensive online platform designed to help JEE aspirants prepare effectively through structured mock tests, topic-wise practice, and personalized analytics.

## 🚀 Features

- **Subject-specific Mock Tests**: Take tests based on Physics, Chemistry, and Mathematics
- **Customizable Test Experience**:
  - Choose between chapterwise, subcategory-wise, or complete subject tests
  - Select specific topics and difficulty levels (Easy, Medium, Hard)
  - Set custom test durations
- **Interactive Test Interface**:
  - Question navigation palette
  - Mark questions for review
  - Track test progress in real-time
  - Built-in scientific calculator for complex problems
- **Anti-cheating Mechanisms**:
  - Tab switch detection
  - Full-screen mode
  - Copy-paste prevention
- **User Authentication**: Secure login and registration system
- **Dark Mode Support**: Toggle between light and dark themes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 💻 Technologies Used

- **Frontend**: React.js with Hooks
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Authentication
- **Routing**: React Router
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context API

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PrepShala.git
cd PrepShala
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## 📚 Project Structure

```
PrepShala/
├── public/
└── src/
    ├── App.jsx               # Main application component
    ├── main.jsx              # Entry point
    ├── Auth/                 # Firebase authentication
    ├── assets/               # Images and static assets
    ├── components/           # Reusable UI components
    │   ├── Calculator.jsx    # Scientific calculator component
    │   ├── Footer.jsx        # Application footer
    │   ├── Layout.jsx        # Main layout wrapper
    │   └── Navbar.jsx        # Navigation bar
    ├── context/              # React context providers
    │   ├── AuthContext.jsx   # Authentication context
    │   └── ThemeContext.jsx  # Dark/light mode context
    ├── data/                 # Mock data and content
    │   ├── HomeContent.js    # Homepage content
    │   ├── MockTestContent.js# Test configuration data
    │   └── questions.json    # Question bank
    └── pages/                # Application pages
        ├── Dashboard.jsx     # User dashboard
        ├── Home.jsx          # Landing page
        ├── Login.jsx         # Authentication page
        ├── MockTest.jsx      # Test selection/configuration
        └── TestScreen.jsx    # Active test interface
```

## 📱 Screenshots

![Home Page](https://example.com/screenshots/home.png)
![Test Configuration](https://example.com/screenshots/config.png)
![Test Interface](https://example.com/screenshots/test.png)

## 🚦 Usage

1. **Home Page**:
   - Learn about the platform features
   - Navigate to mock test selection

2. **Login/Signup**:
   - Create an account or login with existing credentials
   - Access saved test results and progress tracking

3. **Test Selection**:
   - Choose subject, topics, and difficulty level
   - Configure test duration and format
   - Start your personalized test

4. **Test Interface**:
   - Answer questions within the allocated time
   - Use the navigation palette to move between questions
   - Mark uncertain questions for review
   - Access the built-in calculator for calculations
   - Submit when ready or let the timer auto-submit

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📧 Contact

Your Name - [Ayush Kumar](mailto:ayushkumar2205@gmail.com)

Project Link: [https://github.com/yourusername/PrepShala](https://github.com/yourusername/PrepShala)

---

Built with ❤️ for Aspirants
