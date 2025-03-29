function sendToGoogleSheet(data) {
  fetch("https://script.google.com/macros/s/AKfycbyfuLfinj21-FQjjaFACPb7MNb3e4lhH-jSNh4mUOgVu9gbkx56bUsCJ5bMYVvKhzBf4A/exec", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  })
  .then(res => res.text())
  .then(response => console.log("✅ Sent to Google Sheet:", response))
  .catch(err => console.error("❌ Google Sheet Error:", err));
}
