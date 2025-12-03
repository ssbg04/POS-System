// // auth.js - Updated for Field Selection
// import admin from "firebase-admin";
// import fs from "fs";

// // Load service account key
// const serviceAccount = JSON.parse(
//   fs.readFileSync("./src/services/hrmis/service-account-key.json", "utf8")
// );

// // Initialize Admin SDK
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// // Access Firestore
// const db = admin.firestore();

// async function fetchUsers() {
//   try {
//     // 1. Use .select() to only fetch specific fields from Firestore (Saves bandwidth)
//     const snapshot = await db
//       .collection("employees")
//       .select("id", "firstName", "lastName", "email", "position", "status")
//       .get();

//     if (snapshot.empty) {
//       console.log("No documents found.");
//       return;
//     }

//     // 2. Map the results to a clean array of objects containing the ID and the data
//     const employees = snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(), // Spreads firstName, lastName, email, position, status
//     }));

//     console.log("Fetched Employees:", employees);

//     return employees;
//   } catch (err) {
//     console.error("Error fetching documents:", err);
//   }
// }

// fetchUsers();

async function fetchSelectedFields() {
  const url =
    "https://firestore.googleapis.com/v1/projects/hrmis-29ebe/databases/(default)/documents/employees" +
    "?mask.fieldPaths=email" +
    "&mask.fieldPaths=firstName" +
    "&mask.fieldPaths=lastName" +
    "&mask.fieldPaths=position" +
    "&mask.fieldPaths=status";

  const res = await fetch(url);
  const json = await res.json();

  if (!json.documents) {
    console.log("No documents.");
    return [];
  }

  const employees = json.documents.map((doc) => {
    const f = doc.fields;
    return {
      id: doc.name.split("/").pop(),
      email: f?.email?.stringValue ?? null,
      firstName: f?.firstName?.stringValue ?? null,
      lastName: f?.lastName?.stringValue ?? null,
      position: f?.position?.stringValue ?? null,
      status: f?.status?.stringValue ?? null,
    };
  });

  console.log(employees);
  return employees;
}

fetchSelectedFields();
