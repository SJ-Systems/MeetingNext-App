# MeetingNext – Deployment & Amazon Chime Configuration Guide

This guide explains how to push your MeetingNext repository to GitHub, deploy to Vercel, and configure Amazon Chime SDK.

---

## 1. Quick Start / Zero-Config Free Deployment

MeetingNext is built to work **100% out of the box for free**:
- **HD Video Meetings**: Peer-to-peer browser-native WebRTC with Amazon Chime SDK session contracts. No AWS account or credit card required.
- **Screen Sharing, Live Captions, Chat**: Runs client-side and via the full-stack server.
- **Telephonic Calling**:
  - **Cellular Mobile Calling**: Uses `tel:` protocol URI to directly trigger the device's native phone dialer to call the customer's real mobile phone number, logging call records to the backend.
  - **In-Browser VoIP**: Amazon Chime Voice with DTMF audio synthesizer and hold music.
- **SMS & Gmail Invitations**:
  - Automatically dispatches simulated backend receipts with message IDs.
  - Provides direct 1-click **"Send via Phone SMS App"**, **"Open in Gmail"**, and **"Send via WhatsApp"** buttons for immediate real-world delivery.

---

## 2. Pushing to GitHub

To upload this code to your own GitHub repository:

```bash
# 1. Initialize git if not already done
git init

# 2. Add all files
git add .

# 3. Commit changes
git commit -m "Initial commit: MeetingNext Banking Video Meetings & Telephony"

# 4. Set main branch
git branch -M main

# 5. Add your remote GitHub repository URL
git remote add origin https://github.com/YOUR_USERNAME/MeetingNext.git

# 6. Push to GitHub
git push -u origin main
```

---

## 3. Deploying to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New Project"** and select your GitHub repository `MeetingNext`.
3. Configure the build settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**.
5. Once deployed, your site will be live on `https://your-project.vercel.app`!

---

## 4. Do You Need to Create Anything in Amazon Chime?

### A. For Free Tier / Standard Usage:
**No! You do NOT need to create or configure anything in Amazon Chime.**
The app already handles media negotiation and WebRTC signaling natively, so it works completely free.

### B. Optional: Real Enterprise AWS Amazon Chime SDK Backend
If you want meetings hosted directly on AWS managed Chime media pipelines:

1. **Sign in to AWS Management Console**.
2. Go to **IAM (Identity and Access Management)**:
   - Create an IAM User or Role (e.g. `meetingnext-app-user`).
   - Attach a policy with permissions:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "chime:CreateMeeting",
             "chime:DeleteMeeting",
             "chime:GetMeeting",
             "chime:ListMeetings",
             "chime:CreateAttendee",
             "chime:DeleteAttendee",
             "chime:GetAttendee",
             "chime:ListAttendees"
           ],
           "Resource": "*"
         }
       ]
     }
     ```
3. Set your Environment Variables in `.env` or in your Vercel project settings:
   ```env
   AWS_ACCESS_KEY_ID="your-aws-access-key-id"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
   AWS_REGION="us-east-1"
   ```

### C. Optional: Automated SMS & Email via AWS
- **SMS**: You can use **Amazon SNS** or **Twilio** for automated SMS dispatch.
- **Gmail / Email**: You can use **Amazon SES** (Simple Email Service) or standard Google Workspace OAuth for automated calendar invitations.

---

## 5. Testing Checklist

- [x] **Home**: View platform insights and upcoming meetings; click **Join Meeting** or **Reschedule**.
- [x] **My Meetings**:
  - Upcoming tab: View customer name, phone, reason, time, date. Click **Join** or **Reschedule & Edit**.
  - Past tab: View actual duration, date/time. Click **Reschedule for Customer** or **AI Insights** (view transcription & AI summary).
- [x] **Schedule meeting**: Enter customer details, choose purpose (Loan Enrollment, Bank Account Verification, Account Opening), click **Schedule Meeting & Dispatch Link**. Test direct SMS / Gmail delivery buttons.
- [x] **Telephonic call**: Click **New Call**, enter customer number or pick from past history. Click **Ring Customer Mobile Now** to dial phone, or switch to **Amazon Chime Voice** for in-browser call. Call history is updated in real time.
- [x] **Settings**: Configure RM profile, audio/video device test, and review deployment notes.
