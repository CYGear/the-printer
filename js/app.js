function switchTab(tabId) {
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));

  document.getElementById(tabId).classList.add("active");
  event.target.classList.add("active");
}

function processOrder() {
  const printTime = 7; // Placeholder, eventually estimate from STL
  const grams = 50;
  const filamentCost = grams * 0.02;
  const electricityCost = printTime * 0.2 * 0.14;

  let markup = 0;
  if (printTime <= 5) markup = 3;
  else if (printTime <= 9) markup = 5;
  else markup = 6;

  const total = (filamentCost + electricityCost + markup).toFixed(2);

  const now = new Date();
  const finishHour = now.getHours() + printTime;
  const delivery = (now.getHours() < 6.5 && finishHour <= 6.5) || finishHour < 6.5 ? "1 day" : "2 days";

  document.getElementById("result").innerHTML = `
    <strong>Final Price:</strong> $${total}<br>
    <strong>Estimated Delivery:</strong> ${delivery}<br><br>
    <em>Please check daily — it might arrive earlier!</em><br><br>
    <button onclick="submitOrder('${total}', '${delivery}')">Confirm Order</button>
  `;
}

function submitOrder(total, delivery) {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const filename = document.getElementById("file").files[0]?.name || "No file";

  const topColor = document.getElementById("topColor").value;
  const bottomColor = document.getElementById("bottomColor").value;
  const cutSlider = document.getElementById("slider").value;

  const orderData = {
    name,
    email,
    type: "Custom",
    filename,
    price: `$${total}`,
    deliveryTime: delivery,
    colorTop: topColor,
    colorBottom: bottomColor,
    cutAtPercent: cutSlider + "%",
  };

  sendToGoogleSheet(orderData);
  alert("✅ Custom order sent successfully!");
}

function orderProduct(productName) {
  const firstName = document.querySelector("#home input[placeholder='First Name']").value;
  const lastName = document.querySelector("#home input[placeholder='Last Name']").value;
  const grade = document.querySelector("#home input[placeholder='Grade']").value;
  const className = document.querySelector("#home input[placeholder='Class/Teacher']").value;

  const fullName = `${firstName} ${lastName}`;

  const orderData = {
    name: fullName,
    email: "N/A",
    type: "Pre-Printed",
    productName: productName,
    price: "Set price (TBD)",
    deliveryTime: "1–2 days",
    colorTop: "N/A",
    colorBottom: "N/A",
    cutAtPercent: "N/A",
    grade,
    className
  };

  sendToGoogleSheet(orderData);
  alert(`✅ Order for "${productName}" submitted successfully!`);
}
