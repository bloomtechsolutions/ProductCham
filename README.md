# BML Product Champion

A live True/False quiz on BML products and services. 15 questions cover Accounts, Cards, Financing and Business Products.

## How it works
1. **Host** opens `/host` on a projector and clicks **Create game**. A QR code and a 6-digit game code appear.
2. **Players** scan the QR code with their phone, enter a name and wait in the lobby.
3. The host clicks **Start game**. Each question is open for 20 seconds. It closes early once everyone has answered.
4. After each question the screen shows the answer, the explanation, the answer split, the fastest correct players and the top 5.
5. After question 15 the screen shows the podium and the full leaderboard.

### Ranking and draws
- Most correct answers wins.
- **If it's a draw**, the player with the **lowest total answer time across their correct answers** ranks higher. Time is measured on the server, from when the question opens until the answer arrives. Players' phone clocks don't affect it.

## Editing questions
All questions are in `lib/questions.ts`, along with the answer, explanation and category. **Have the product team check them before each event.** You can also change `QUESTION_TIME_MS` there.

## Deploy to Vercel
1. Import this GitHub repo in Vercel (framework: Next.js, no settings needed).
2. In the project, go to **Storage → Create / Connect → Upstash for Redis** (the free plan is fine) and connect it to the project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
   Serverless functions don't share memory, so the game needs this store to work on Vercel.
3. Optional: add a `HOST_PIN` environment variable so only people with the PIN can create games.
4. Redeploy.

## Local development
```bash
npm install
npm run dev
```
Without Redis variables, it uses an in-memory store. That's fine for local testing.
