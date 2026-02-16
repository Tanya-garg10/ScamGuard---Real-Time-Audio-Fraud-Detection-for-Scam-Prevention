## 📄 README.md – Detailed Guidelines

## Problem Statement
Voice-based scams are increasing rapidly, where fraudsters manipulate users during live phone calls using impersonation, urgency, and emotional pressure. Vulnerable groups such as elderly individuals, digitally unaware users, and first-time internet adopters are most affected. Existing fraud detection systems work post-transaction or rely on text-based signals, providing little to no protection during live calls where most financial and emotional damage occurs. This project addresses this problem by developing an AI-powered, real-time audio fraud detection system that monitors live phone calls, identifies scam patterns, and alerts users immediately to prevent financial and emotional harm.

## Project Name
ScamGuard - Real-Time Audio Fraud Detection for Scam Prevention

## Team Name
Team TechnoMinds 

## Deployed Link

🔗 https://gfgbq-team-technominds-27dv.vercel.app/

## PPT Link

📊 https://drive.google.com/file/d/150yBjQFfEYRVym1a3hvFY7SoZP7hJZ4S/view?usp=drive_link

## 📌 Project Overview
This project is a web-based application that leverages AI to detect scam calls in real time. The system analyzes live audio (from microphone or uploaded recordings) to detect indicators such as impersonation, urgency, emotional manipulation, authority pressure, repeated OTP/money requests, and suspicious voice patterns (tone, stress, pitch). Users receive immediate alerts and guidance during calls, helping prevent fraud before damage occurs. The application is especially designed for elderly and digitally unaware users with a simple, user-friendly interface.

## Key Features:
- Real-time audio analysis of phone calls
- Scam risk score (Low / Medium / High)
- Instant alerts and guidance during suspicious calls
- Multilingual support and adaptive learning
- Privacy-preserving on-device or encrypted processing
- Emergency contact notifications

## Setup and Installation Instructions

   ## Prerequisites:
   - Node.js (if using React frontend)
   - Browser with microphone access

   ## Steps to Run Locally:

   1. **Clone the Repository** 
       ```bash
      git clone https://github.com/your-repo-name.git
      cd your-repo-name

   2. **Install dependencies**
         ```bash
      npm install
      # or
      yarn install

   3. **Run the App**
      ```bash
      npm run dev
   Open the local URL shown in console (usually http://localhost:5173 or similar)

  4. **Test the App**
  - Click “Start Listening” for live audio
  - Or upload a sample audio file (scam_call_sample.wav / normal_call_sample.wav)
  - Check the scam risk score and alerts

## Usage Instructions
1. Open the web app in your browser
2. Allow microphone access
3. Click “Start Listening” for live audio or upload a recorded call
4. Speak or play scam audio
5. View real-time scam risk level and alerts
5. Follow guidance (e.g., do not share OTP, end call)

## Screenshots

**Home Page**:

![Screenshot_4-1-2026_95859_technominds-five vercel app](https://github.com/user-attachments/assets/61d709a4-2ab5-4822-8865-2b2e4d6ffa20)

**History of Audio Detection**:

![Screenshot_4-1-2026_10147_technominds-five vercel app](https://github.com/user-attachments/assets/1e9b5ec0-e99b-4e7a-8375-86b2d7e0972d)

**Scam Alert & Guidance**:

![Screenshot_4-1-2026_1039_technominds-five vercel app](https://github.com/user-attachments/assets/07a41330-9d52-4f9b-bd0f-bd392e603d96)

## Technology Stack
-  Frontend: HTML, CSS, JavaScript, TypeScript, Tailwind CSS
-  Configuration: JSON files for settings / scam patterns
-  Real-Time: Web Audio API / Browser microphone access
-  AI/ML: WebAssembly or Cloud API (optional for real-time analysis)

## Privacy & Ethics
1. Audio is processed only with user consent
2. No permanent storage of call recordings without permission
3. Encrypted communication for all data transmissions

## Future Enhancements
- Integration with telecom providers for live call detection
- Female/male voice models for better accuracy
- Deepfake and voice-clone scam detection
- Offline AI processing for low-end devices


## 🔧 Latest Technical Improvements

### Real-Time Speech-to-Text Integration
- Integrated Web Speech API for live transcription during calls
- Transcript updates continuously as conversation progresses
- Added visual transcript display component

### AI-Powered Analysis
- Connected live transcript to Gemini 2.5 Flash AI model
- Periodic analysis every 5 seconds during recording
- Final comprehensive analysis when call ends
- Context-aware scam pattern detection

## 🧪 Testing the Scam Detection

To properly test the scam detection system, try speaking these phrases during recording:

### Normal Call (Expected: Low Risk 0-30%)
```
"Hi, how are you doing today?"
"I'm calling to check on our meeting tomorrow"
"Can we discuss the project details?"
"Let's schedule a time to talk about this"
```

### Suspicious Call (Expected: Medium Risk 31-60%)
```
"This is urgent, you need to act quickly"
"Your account has some issues that need immediate attention"
"We need to verify your information right away"
```

### Scam Call (Expected: High Risk 61-100%)
```
"I'm calling from your bank, we've detected suspicious activity"
"You need to share your OTP immediately or your account will be blocked"
"Transfer money now or face legal action"
"This is the police, you're under investigation"
"Your account will be suspended unless you provide your PIN"
"Send gift cards to resolve this issue"
```

## 🎯 How It Works

1. **Audio Capture**: Web Audio API captures microphone input
2. **Speech Recognition**: Browser's Speech Recognition API converts speech to text
3. **Real-Time Analysis**: Every 5 seconds, accumulated transcript is sent to AI
4. **Pattern Detection**: AI analyzes for 7 scam indicators:
   - Impersonation (bank, government, police)
   - Urgency pressure
   - Emotional manipulation
   - Authority threats
   - OTP/PIN requests
   - Money requests
   - Suspicious voice patterns
5. **Risk Scoring**: AI assigns confidence scores and overall risk level
6. **User Alerts**: Visual indicators and guidance displayed immediately

## 🌐 Browser Compatibility

- Chrome/Edge: Full support (recommended)
- Safari: Requires webkit prefix for Speech Recognition
- Firefox: Limited speech recognition support
- Mobile browsers: Varies by platform

**Note**: For best results, use Chrome or Edge browsers with a good quality microphone.
