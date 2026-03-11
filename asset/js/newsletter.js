document.getElementById("newsletter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const statusEl = document.getElementById("newsletter-message");
  statusEl.innerText = "⏳ Sending...";

  emailjs.sendForm("service_ju38v7u", "template_fwmkrnd", this, "0pPC6AV7WTn72bXWt") 
    .then(() => {
      statusEl.innerText = "✅ Subscribed successfully!";
      this.reset();
    }, (error) => {
      statusEl.innerText = "❌ Failed. Check console.";
      console.error("Newsletter error:", error);
    });
});