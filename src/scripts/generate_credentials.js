// src/scripts/generate_credentials.js
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Load service account key
const serviceAccount = JSON.parse(
  fs.readFileSync("./src/services/hrmis/firebaseConfig.json", "utf8")
);

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Helper to map DB position to App Role
const mapRole = (position) => {
  const lower = position.toLowerCase();
  if (lower.includes("manager") || lower.includes("admin")) return "admin";
  return "pos"; // Default to POS for cashiers, etc.
};

async function generateCredentials() {
  try {
    console.log("Fetching employees...");

    // 1. Fetch only necessary fields
    const snapshot = await db
      .collection("employees")
      .select("firstName", "lastName", "email", "position", "status")
      .where("status", "==", "Active") // 2. Filter: Only Active users
      .get();

    if (snapshot.empty) {
      console.log("No active employees found.");
      return;
    }

    // 3. Transform Data
    const users = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: `${data.firstName} ${data.lastName}`, // Concatenate Name
        email: data.email,
        role: mapRole(data.position || ""),
        password: "CHANGE_ME", // Placeholder for manual update
      };
    });

    // 4. Create File Content
    const fileContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY IF RUNNING SCRIPT OFTEN
// Update 'password' fields manually after generation.

export const USERS = ${JSON.stringify(users, null, 2)};
`;

    // 5. Write to src/config/credentials.ts
    const outputPath = path.join(
      process.cwd(),
      "src",
      "config",
      "pre_credentials.ts"
    );

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, fileContent);

    console.log(
      `Successfully generated credentials for ${users.length} users at:`
    );
    console.log(outputPath);
  } catch (err) {
    console.error("Error generating credentials:", err);
  }
}

generateCredentials();
