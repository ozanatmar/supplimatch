// moderation.js
//
// Complete moderation layer for SuppliMatch
// Used inside createRequest() to validate user product text

const bannedSubstances = [
  "cocaine",
  "heroin",
  "mdma",
  "meth",
  "amphetamine",
  "weed",
  "marijuana",
  "cannabis",
  "lsd",
  "shrooms",
  "steroids",
  "sarms",
  "clenbuterol",
  "tramadol",
  "fentanyl",
];

const bannedCategories = [
  "car",
  "auto",
  "bmw",
  "mercedes",
  "toyota",
  "phone",
  "iphone",
  "samsung",
  "laptop",
  "computer",
  "pc",
  "holiday",
  "vacation",
  "hotel",
  "crypto",
  "bitcoin",
  "ethereum",
  "weapon",
  "gun",
  "knife",
  "rifle",
];

const marketingWords = [
  "whatsapp",
  "telegram",
  "viber",
  "sell",
  "selling",
  "wholesale",
  "bulk offer",
  "discount",
  "cheap price",
  "dealer",
];

const brandIndicators = [
  "™",
  "®",
  "brand",
  "from",
  "by ",
  "company",
  "inc",
  "ltd",
  "solgar",
  "goli",
  "now foods",
  "optimum nutrition",
  "myprotein",
  "nature made",
  "blackmores",
  "centrum",
  "ostrovit",
  "swanson",
  "puritans pride",
  "garden of life",
];

const personalInfoPatterns = [
  /\b(?:\+?\d[\d\s-]{6,}\d)\b/i, // phone numbers
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // emails
  /(https?:\/\/[^\s]+)/i, // URLs
];

const openai = require("openai");

/**
 * Runs OpenAI moderation (free).
 * @param {string} text
 * @return {Promise<{flagged: boolean, categories: object}>}
 */
async function runOpenAIModeration(text) {
  try {
    const client = new openai.OpenAI();
    const result = await client.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    let flagged = false;
    let categories = {};

    if (
      result &&
      result.results &&
      Array.isArray(result.results) &&
      result.results[0]
    ) {
      flagged = !!result.results[0].flagged;
      categories = result.results[0].categories || {};
    }

    return {flagged, categories};
  } catch (err) {
    console.error("OpenAI moderation error:", err);
    return {flagged: false, categories: {}}; // fail-open
  }
}

/**
 * Classifies the product using gpt-5-nano.
 * @param {string} productText
 * @return {Promise<boolean>}
 */
async function classifyWithGPT(productText) {
  const client = new openai.OpenAI();

  const prompt = `
You are an AI moderator for SuppliMatch.

Your task is to decide if the text is a valid GENERIC supplement product name.
A valid name clearly describes an ingestible dietary supplement ingredient or
formulation, such as: "magnesium citrate powder" or "vitamin D3 5000 IU".

REJECT the text if it includes:
- brand names or trademarks
- marketing language or sales terms
- illegal drugs or controlled substances
- pharmaceutical medicines
- unrelated product categories
- electronics, machines, tools, cosmetics, chemicals
- food, beverages, pet products, household items
- weapons, vehicles, crypto, or services
- spam, nonsense, gibberish, random characters
- mixed or unrelated items

APPROVE only if it is clearly a generic supplement ingredient, vitamin,
mineral, amino acid, herb, botanical extract, or ingestible compound.

Respond with exactly one word:
APPROVE
or
REJECT
`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-5-nano",
      max_tokens: 5,
      messages: [
        {role: "system", content: prompt},
        {role: "user", content: productText},
      ],
    });

    const answer = res.choices[0].message.content.trim().toUpperCase();
    return answer === "APPROVE";
  } catch (err) {
    console.error("GPT-5-nano error:", err);
    return true; // fail-open
  }
}

/**
 * Runs regex-based safety rules.
 * @param {string} text
 * @return {string|null}
 */
function testRegexFilters(text) {
  const lower = text.toLowerCase();

  // illegal substances
  for (const s of bannedSubstances) {
    if (lower.includes(s)) return `Contains illegal substance: ${s}`;
  }

  // irrelevant categories
  for (const c of bannedCategories) {
    if (lower.includes(c)) return `Contains irrelevant content: ${c}`;
  }

  // marketing spam
  for (const m of marketingWords) {
    if (lower.includes(m)) return `Marketing content not allowed: ${m}`;
  }

  // brand indicators
  for (const b of brandIndicators) {
    if (lower.includes(b)) {
      return `Brand name or brand indicator detected: ${b}`;
    }
  }

  // personal data
  for (const pattern of personalInfoPatterns) {
    if (pattern.test(text)) return "Contains personal contact information.";
  }

  return null;
}

/**
 * Main moderation function used by createRequest().
 * @param {string} productText
 * @return {Promise<{passed: boolean, reason: string}>}
 */
exports.moderateProduct = async function(productText) {
  const text = productText.trim();

  // 1. regex filters
  const regexFail = testRegexFilters(text);
  if (regexFail) {
    return {passed: false, reason: regexFail};
  }

  // 2. OpenAI moderation (FREE)
  const mod = await runOpenAIModeration(text);
  if (mod.flagged) {
    return {passed: false, reason: "OpenAI moderation flagged content."};
  }

  // 3. gpt-5-nano semantic classification
  const approved = await classifyWithGPT(text);
  if (!approved) {
    return {passed: false, reason: "Semantic filter rejected product name."};
  }

  // If all pass:
  return {passed: true, reason: "OK"};
};
