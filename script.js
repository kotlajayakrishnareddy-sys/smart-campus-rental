
document.addEventListener("DOMContentLoaded", function () {
  const itemName = document.getElementById("itemName");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const paymentMethod = document.getElementById("paymentMethod");
  const bookingForm = document.getElementById("bookingForm");
  const message = document.getElementById("message");
  const totalAmount = document.getElementById("totalAmount");
  const paymentDetails = document.getElementById("paymentDetails");
  const qrOption = document.getElementById("qrOption");
  const phonePeOption = document.getElementById("phonePeOption");
  const upiOption = document.getElementById("upiOption");
  const upiId = document.getElementById("upiId");

  const prices = {
    "Laptop": 200,
    "Mobile Phone": 100,
    "Calculator": 30
  };

  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  startDate.min = todayString;
  endDate.min = todayString;

  window.selectItem = function (item) {
    itemName.value = item;
    updateTotal();
    document.getElementById("booking").scrollIntoView({
      behavior: "smooth"
    });
  };

  function updateTotal() {
    const days = dateDifference();
    const amount = days > 0 ? days * (prices[itemName.value] || 0) : 0;

    totalAmount.textContent = days > 0
      ? `Estimated Total: ₹${amount} (${days} day(s))`
      : "Estimated Total: ₹0";
  }

  function dateDifference() {
    if (!startDate.value || !endDate.value) return 0;

    return Math.round(
      (Date.parse(endDate.value + "T00:00:00Z") -
       Date.parse(startDate.value + "T00:00:00Z")) / 86400000
    );
  }

  itemName.addEventListener("change", updateTotal);

  startDate.addEventListener("change", function () {
    endDate.min = startDate.value || todayString;

    if (endDate.value && endDate.value <= startDate.value) {
      endDate.value = "";
    }

    updateTotal();
  });

  endDate.addEventListener("change", updateTotal);

  paymentMethod.addEventListener("change", function () {
    paymentDetails.hidden = !paymentMethod.value;
    qrOption.hidden = paymentMethod.value !== "QR";
    phonePeOption.hidden = paymentMethod.value !== "PhonePe";
    upiOption.hidden = paymentMethod.value !== "UPI";

    if (upiId) {
      upiId.required = paymentMethod.value === "UPI";
    }
  });

  bookingForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    message.style.color = "#b91c1c";
    message.textContent = "";

    const days = dateDifference();

    if (days < 1 || days > 365) {
      message.textContent =
        "Please select a valid return date after the start date.";
      return;
    }

    const formData = new FormData(bookingForm);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value.trim();
    }

    // Collect fields whose inputs have IDs but no name attributes
    [
      "ownerName", "ownerPhone", "studentName", "studentPhone",
      "itemName", "startDate", "endDate", "pickupLocation",
      "returnLocation", "paymentMethod"
    ].forEach(function (id) {
      const element = document.getElementById(id);
      data[id] = element.value.trim();
    });

    if (paymentMethod.value === "UPI") {
      data.paymentMethod = "UPI";
    }

    try {
      message.style.color = "#1d4ed8";
      message.textContent = "Saving your booking request...";

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not save booking.");
      }

      message.style.color = "#15803d";
      message.textContent =
        `Booking request saved! Booking ID: ${result.bookingId}. ` +
        `Total: ₹${result.totalAmount}. Payment status: Pending. ` +
        "No payment has been taken.";

    } catch (error) {
      message.style.color = "#b91c1c";
      message.textContent =
        error.message || "Could not connect to the server.";
    }
  });

  updateTotal();
});
