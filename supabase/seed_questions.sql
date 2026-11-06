-- The 15 questions loaded into the project. Edit them in Supabase → Table Editor → questions.
insert into public.questions(position, category, text, answer, explanation) values
(1,'Accounts','BML customers can open accounts in US Dollars as well as Maldivian Rufiyaa.',true,'BML offers both MVR and USD (foreign currency) accounts.'),
(2,'Accounts','Money in a Fixed Deposit can be withdrawn at any time with no effect on the interest/profit earned.',false,'Fixed Deposits are locked for a term; breaking early affects the return.'),
(3,'Accounts','A Current Account is designed for frequent day-to-day transactions, including cheque payments.',true,'Current accounts are transactional accounts that support cheque books.'),
(4,'Accounts','BML Mobile Banking lets customers transfer funds to other BML accounts 24/7.',true,'Transfers are available any time through the BML Mobile Banking app.'),
(5,'Cards','BML is the issuer of American Express cards in the Maldives.',true,'BML issues American Express cards in the Maldives.'),
(6,'Cards','Paying only the minimum amount due on a credit card clears the full outstanding balance.',false,'The minimum payment only keeps the account in good standing; the remaining balance carries over.'),
(7,'Cards','Purchases made with a debit card are deducted directly from the linked account balance.',true,'Debit cards draw on funds already in the customer''s account.'),
(8,'Cards','It is safe to share your card OTP with a caller who says they are from BML.',false,'BML will never ask for your OTP, PIN or password. Never share them.'),
(9,'Financing','BML Islamic offers Shariah-compliant financing as an alternative to conventional loans.',true,'BML Islamic provides Shariah-compliant products such as home and vehicle financing.'),
(10,'Financing','BML offers financing to help customers purchase a vehicle.',true,'Vehicle financing is part of BML''s personal financing range.'),
(11,'Financing','A customer''s repayment capacity is not considered when assessing a financing application.',false,'Income and repayment capacity are key parts of every credit assessment.'),
(12,'Business Products','Businesses can accept card payments in-store using BML POS terminals.',true,'BML provides POS terminals to merchants for card acceptance.'),
(13,'Business Products','BML offers an online payment gateway so merchants can accept card payments on their websites.',true,'BML''s payment gateway (BML Connect) enables e-commerce card acceptance.'),
(14,'Business Products','Letters of Credit are mainly used to collect payments from local retail customers.',false,'Letters of Credit are trade finance instruments used to secure import/export payments.'),
(15,'Business Products','Business owners must run all company transactions through their personal savings account.',false,'Businesses should use a dedicated business/corporate account.');
