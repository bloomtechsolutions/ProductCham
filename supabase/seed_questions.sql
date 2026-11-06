-- Question bank: 28 questions based on bankofmaldives.com.mv (Personal, Business & SME).
-- Each game draws a random 15 (app_settings.questions_per_game), balanced across categories.
-- Edit in Supabase → Table Editor → questions. Set active = false to retire a question.
-- (The original 15 questions, positions 1–15, are kept in the table with active = false.)
insert into public.questions(position, category, text, answer, explanation) values
-- Accounts (personal accounts + digital banking)
(101,'Accounts','If you break a BML Fixed Deposit early, BML still pays interest for the days your money was held.',false,'No interest is paid on early withdrawal, and early withdrawal is at the Bank''s discretion.'),
(102,'Accounts','BML''s Kids'' Saver account is for children under 18 and needs a lower minimum balance than a regular Savings Account.',true,'Kids'' Saver is for under-18s with a minimum balance of MVR 100, versus MVR 200 for a Savings Account.'),
(103,'Accounts','The BML Islamic Investment Account is based on the Mudarabah profit-sharing contract.',false,'It is based on Wakalah bil Istithmar, not Mudarabah.'),
(104,'Accounts','A BML Savings Account needs a minimum balance of MVR 200 or USD 50.',true,'The minimum balance is MVR 200 or USD 50.'),
(105,'Accounts','The BML Expatriate Account is a savings account that earns interest.',false,'It is a current account with a monthly maintenance fee.'),
(106,'Accounts','Registering for BML Internet Banking also registers you for the BML Mobile Banking app automatically.',true,'One registration covers both Internet Banking and the Mobile Banking app.'),
(107,'Accounts','BML charges a monthly fee for using Internet Banking.',false,'BML Internet Banking and Mobile Banking are free to use; only some transfers are charged.'),
(108,'Accounts','BML Pay "Send Money" sends funds to a mobile number, and they land on the recipient''s BML Prepaid Card.',true,'Send Money credits the Mastercard Prepaid Card linked to the recipient''s registered mobile number.'),
(109,'Accounts','You can register for BML Internet Banking without having an active debit card.',false,'Registration requires an active account and an active debit card.'),
-- Cards
(110,'Cards','BML credit cards give up to 51 days interest-free on purchases, but only if the full balance is paid every month.',true,'Up to 51 days interest-free applies only when the full balance is paid each month.'),
(111,'Cards','Visa Platinum at BML is available only as a credit card.',false,'BML also offers a Visa Platinum Debit card.'),
(112,'Cards','Every BML account comes with a physical prepaid Mastercard for BML Pay.',false,'Each account gets a virtual prepaid Mastercard for the BML Pay wallet.'),
(113,'Cards','The BML Masveriyaa prepaid card is designed for tourism workers.',false,'Masveriyaa is designed for people working in the fishing industry.'),
(114,'Cards','Each reload of a BML prepaid card is charged a fee.',false,'Prepaid card reloads are free; only a joining fee applies.'),
(115,'Cards','Withdrawing cash on a BML credit card is free if you repay it within the interest-free period.',false,'Cash advances carry a cash advance fee; the interest-free period applies to purchases.'),
-- Financing
(116,'Financing','The BML Home Purchase Loan can be repaid over up to 25 years with a minimum equity of 5%.',true,'Up to 25 years to repay, with a minimum equity contribution of 5%.'),
(117,'Financing','BML''s Kiyavaa education financing covers study at institutions in the Maldives only.',false,'Kiyavaa covers further education anywhere in the world.'),
(118,'Financing','BML Islamic Home Purchase Financing uses a diminishing musharakah structure.',true,'Home Purchase Financing is structured as a diminishing musharakah.'),
(119,'Financing','BML Islamic personal cash financing is structured using Ijarah.',false,'Personal cash financing uses Tawarruq.'),
-- Business Products (Business & SME)
(120,'Business Products','BML POS terminals have a one-time setup fee but no monthly fee.',false,'BML POS terminals have free set-up and no monthly fee.'),
(121,'Business Products','Payments made with BML-issued cards on BML POS terminals and the Payment Gateway are settled to the merchant within 24 hours.',true,'Settlements for BML-issued card payments are credited within 24 hours.'),
(122,'Business Products','Only registered companies, not sole traders, can apply for BML''s Merchant Portal and mPOS.',false,'Any registered business can apply, including sole traders.'),
(123,'Business Products','BML Islamic Retailers'' Financing requires property as security.',false,'No security or deposit is required; financing is up to 3 times monthly average POS sales.'),
(124,'Business Products','BML Islamic Advance Merchant Settlement is repaid automatically from the merchant''s daily card settlements.',true,'Repayments are deducted automatically from daily merchant settlements.'),
(125,'Business Products','BML Islamic Advance Merchant Settlement is open to any SME, even one that doesn''t use BML POS terminals.',false,'It is only for existing SMEs that take card payments through BML POS terminals.'),
(126,'Business Products','BML Working Capital Finance overdrafts can run for up to 36 months.',false,'Overdrafts run up to 12 months; 36 months is the limit for term loans.'),
(127,'Business Products','BML describes its Payment Gateway as the only 3D-Secure payment gateway in the Maldives.',true,'BML markets it as the only 3D-Secure gateway in the Maldives (Visa, Mastercard, Amex).'),
(128,'Business Products','BML merchant terminals accept Alipay and WeChat Pay as well as cards.',true,'BML merchant terminals accept digital wallets including Alipay and WeChat Pay.');
