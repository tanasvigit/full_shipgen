#!/usr/bin/env node
/* eslint-disable no-console */
require("dotenv").config({ path: ".env" });

const readline = require("readline");
const nodemailer = require("nodemailer");

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function main() {
  const host = process.env.MAIL_HOST;
  const port = Number(process.env.MAIL_PORT || 587);
  const encryption = (process.env.MAIL_ENCRYPTION || "").toLowerCase();
  const user = process.env.MAIL_USERNAME;
  const pass = process.env.MAIL_PASSWORD;
  const from = process.env.MAIL_FROM_ADDRESS || user;
  const fromName = process.env.MAIL_FROM_NAME || "Fleetbase";

  if (!host || !port || !from) {
    console.error("Missing SMTP config in .env (MAIL_HOST, MAIL_PORT, MAIL_FROM_ADDRESS).");
    process.exit(1);
  }

  const recipient = await ask("Enter recipient email: ");
  if (!isValidEmail(recipient)) {
    console.error("Invalid email address.");
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: encryption === "ssl" || port === 465,
    auth: user && pass && user !== "null" && pass !== "null" ? { user, pass } : undefined,
    tls: encryption === "tls" ? { minVersion: "TLSv1.2" } : undefined,
  });

  try {
    await transporter.verify();
    await transporter.sendMail({
      from: `"${fromName}" <${from}>`,
      to: recipient,
      subject: "Fleetbase SMTP Test",
      text: "Hello,\n\nThis is a test email from Fleetbase SMTP script.\n\nIf you received this, SMTP is working.",
    });

    console.log(`Test email sent successfully to ${recipient}`);
  } catch (error) {
    console.error("Failed to send test email:");
    console.error(error?.message || error);
    process.exit(1);
  }
}

main();
