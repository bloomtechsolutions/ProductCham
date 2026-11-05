export type Category = "Accounts" | "Cards" | "Financing" | "Business Products";

export interface Question {
  category: Category;
  text: string;
  answer: boolean;
  explanation: string;
}

// 15 True/False questions on BML products & services.
// Edit this list to update the quiz — please have the product team verify before each event.
export const QUESTIONS: Question[] = [
  // ---- Accounts ----
  {
    category: "Accounts",
    text: "BML customers can open accounts in US Dollars as well as Maldivian Rufiyaa.",
    answer: true,
    explanation: "BML offers both MVR and USD (foreign currency) accounts.",
  },
  {
    category: "Accounts",
    text: "Money in a Fixed Deposit can be withdrawn at any time with no effect on the interest/profit earned.",
    answer: false,
    explanation: "Fixed Deposits are locked for a term; breaking early affects the return.",
  },
  {
    category: "Accounts",
    text: "A Current Account is designed for frequent day-to-day transactions, including cheque payments.",
    answer: true,
    explanation: "Current accounts are transactional accounts that support cheque books.",
  },
  {
    category: "Accounts",
    text: "BML Mobile Banking lets customers transfer funds to other BML accounts 24/7.",
    answer: true,
    explanation: "Transfers are available any time through the BML Mobile Banking app.",
  },
  // ---- Cards ----
  {
    category: "Cards",
    text: "BML is the issuer of American Express cards in the Maldives.",
    answer: true,
    explanation: "BML issues American Express cards in the Maldives.",
  },
  {
    category: "Cards",
    text: "Paying only the minimum amount due on a credit card clears the full outstanding balance.",
    answer: false,
    explanation: "The minimum payment only keeps the account in good standing; the remaining balance carries over.",
  },
  {
    category: "Cards",
    text: "Purchases made with a debit card are deducted directly from the linked account balance.",
    answer: true,
    explanation: "Debit cards draw on funds already in the customer's account.",
  },
  {
    category: "Cards",
    text: "It is safe to share your card OTP with a caller who says they are from BML.",
    answer: false,
    explanation: "BML will never ask for your OTP, PIN or password. Never share them.",
  },
  // ---- Financing ----
  {
    category: "Financing",
    text: "BML Islamic offers Shariah-compliant financing as an alternative to conventional loans.",
    answer: true,
    explanation: "BML Islamic provides Shariah-compliant products such as home and vehicle financing.",
  },
  {
    category: "Financing",
    text: "BML offers financing to help customers purchase a vehicle.",
    answer: true,
    explanation: "Vehicle financing is part of BML's personal financing range.",
  },
  {
    category: "Financing",
    text: "A customer's repayment capacity is not considered when assessing a financing application.",
    answer: false,
    explanation: "Income and repayment capacity are key parts of every credit assessment.",
  },
  // ---- Business Products ----
  {
    category: "Business Products",
    text: "Businesses can accept card payments in-store using BML POS terminals.",
    answer: true,
    explanation: "BML provides POS terminals to merchants for card acceptance.",
  },
  {
    category: "Business Products",
    text: "BML offers an online payment gateway so merchants can accept card payments on their websites.",
    answer: true,
    explanation: "BML's payment gateway (BML Connect) enables e-commerce card acceptance.",
  },
  {
    category: "Business Products",
    text: "Letters of Credit are mainly used to collect payments from local retail customers.",
    answer: false,
    explanation: "Letters of Credit are trade finance instruments used to secure import/export payments.",
  },
  {
    category: "Business Products",
    text: "Business owners must run all company transactions through their personal savings account.",
    answer: false,
    explanation: "Businesses should use a dedicated business/corporate account.",
  },
];

export const QUESTION_TIME_MS = 20_000;
