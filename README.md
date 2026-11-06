# BML Product Champion

A live True/False quiz on BML products and services: Accounts, Cards, Financing and Business Products.
It's a Next.js app on Vercel and stores its data in Supabase.

**Refresher Training 2026 · Product Champion**

## Screens
| Page | Use it on | What it shows |
|---|---|---|
| `/screen/<code>` | Projector or TV | The presentation: lobby with QR code, questions with a countdown ring, answer reveals, and the podium. Click **Fullscreen** (bottom-right) or press **F**. |
| `/host` | Host laptop or tablet | The same view plus the controls (Start, Reveal, Next, End) and full results with staff IDs. |
| `/join`, `/play/<code>` | Players' phones | Registration, True/False buttons and personal results. |

## How it works
1. **Host** opens `/host` and clicks **Create game**, then **Open presentation screen**. Drag that window to the projector and press **F** to go fullscreen.
2. **Players** scan the QR code and register with their **full name, staff ID** and (optionally) **department/branch**.
3. The host clicks **Start game**. Each question is open for 20 seconds. It closes early once everyone has answered.
4. After each question the screen shows the answer, the explanation, the answer split, the fastest correct players and the top 5.
5. At the end, the screen shows the podium and the full leaderboard with staff ID and department.

### Ranking and draws
- Most correct answers wins.
- **If it's a draw**, the player with the **lowest total answer time across their correct answers** ranks higher.
  Time is measured inside the database, from when the question opens until the answer arrives. Phone clocks don't affect it.

## Supabase (project `mmyqdefiixeqbjazufkt`)
| Table / view | What it holds |
|---|---|
| `questions` | Quiz questions (`position`, `category`, `text`, `answer`, `explanation`, `active`) |
| `registrations` | Every player who registered: name, staff ID, department, game |
| `games` | Each game session and its current state |
| `answers` | Every answer, whether it was correct, and the response time in ms |
| `game_results` (view) | Final ranking per game, including staff ID, score and time |
| `app_settings` | `host_pin`: set a value to require a PIN to create games |

**Questions:** the `questions` table is a question bank (28 active questions based on bankofmaldives.com.mv). Each new game draws a **random 15**, spread evenly across Accounts, Cards, Financing and Business Products, in shuffled order, so every game is different. Edit questions in Supabase → Table Editor → `questions`. Set `active` to false to retire one. To change how many each game uses:
```sql
update app_settings set value = '20' where key = 'questions_per_game';
```

**Exporting registrations and results:** open `game_results` or `registrations` in the Table Editor and export as CSV, or run:
```sql
select * from game_results where game_code = '123456' order by rank;
```

**Requiring a host PIN:**
```sql
update app_settings set value = '1234' where key = 'host_pin';
```

**Security:** all tables have RLS enabled and the public key can't read them. The app can only call six Postgres functions (`create_game`, `join_game`, `submit_answer`, `host_control`, `game_state`, `pin_required`), and these check host and player tokens. The correct answer is only sent to screens after it has been revealed.

The full schema is in `supabase/schema.sql` and the questions are in `supabase/seed_questions.sql`, so you can recreate everything in a new project.

## Vercel environment variables
```
SUPABASE_URL=https://mmyqdefiixeqbjazufkt.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Local development
```bash
npm install
cp .env.example .env.local   # fill in the key
npm run dev
```
