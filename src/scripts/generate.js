// https://firestore.googleapis.com/v1/projects/hrmis-29ebe/databases/(default)/documents/employees
// src/scripts/generate_credentials_rest.js
import fs from "fs";
import path from "path";
import axios from "axios";

const API_KEY = "AIzaSyCkd-grdHPEeAUJ_o7WfqA6o2ZRAMOaTQY";

// Firestore REST endpoint
const FIRESTORE_URL =
  "https://firestore.googleapis.com/v1/projects/hrmis-29ebe/databases/(default)/documents/employees";

// Map job position → system role
const mapRole = (position = "") => {
  const lower = position.toLowerCase();
  if (lower.includes("manager") || lower.includes("admin")) return "admin";
  return "pos";
};

// Create password from firstName (first word → lowercase)
const genPassword = (firstName = "") => {
  const firstWord = firstName.trim().split(" ")[0];
  return firstWord.toLowerCase();
};

async function generateCredentials() {
  console.log("Fetching employees from Firestore REST API...");

  // Fetch all employee documents
  const res = await axios.get(`${FIRESTORE_URL}?key=${API_KEY}`);

  if (!res.data.documents) {
    console.log("No employee documents returned.");
    return;
  }

  const docs = res.data.documents;

  // Transform results
  const users = docs
    .map((doc) => {
      const f = doc.fields || {};

      const status = f.status?.stringValue || "";
      if (status !== "Active") return null;

      const firstName = f.firstName?.stringValue || "";
      const lastName = f.lastName?.stringValue || "";
      const email = f.email?.stringValue || "";
      const position = f.position?.stringValue || "";

      return {
        id: doc.name.split("/").pop(),
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: mapRole(position),
        password: genPassword(firstName),
      };
    })
    .filter((x) => x !== null);

  // Build file content
  const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT

export const USERS = ${JSON.stringify(users, null, 2)};
`;

  const outputPath = path.join(
    process.cwd(),
    "src",
    "config",
    "pre_credentials.ts"
  );

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(outputPath, fileContent);

  console.log(`Generated ${users.length} users:`);
  console.log(outputPath);
}

generateCredentials();
