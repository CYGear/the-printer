function sendEmail(data) {
  // Replace with your actual EmailJS credentials
  emailjs.send("your_service_id", "your_template_id", data, "your_public_key")
    .then(() => console.log("✅ Email sent"))
    .catch((error) => console.error("❌ Email error:", error));
}
