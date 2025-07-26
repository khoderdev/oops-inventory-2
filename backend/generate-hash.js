import bcrypt from "bcrypt";

const password = "Etiene@123";

bcrypt
  .hash(password, 12)
  .then(hash => {
    console.log("Password:", password);
    console.log("New hash:", hash);
    console.log("");
    console.log("SQL UPDATE command:");
    console.log(`UPDATE "Users" SET password = '${hash}' WHERE username = 'etiene';`);

    // Verify the hash works
    bcrypt.compare(password, hash).then(isValid => {
      console.log("");
      console.log("Verification:", isValid ? "PASS" : "FAIL");
    });
  })
  .catch(err => {
    console.error("Error:", err);
  });
