(() => {
  "use strict";

  const form = document.querySelector("[data-start30-form]");
  const status = document.querySelector("[data-start30-status]");

  if (!form || !status) {
    return;
  }

  const endpoint =
    "https://ruhxyodqhgfkwvwlxaxf.supabase.co/functions/v1/pc777-start30-intake";

  const submitButton = form.querySelector(".start30-application__submit");

  const setStatus = (message, type) => {
    status.textContent = message;
    status.className = "start30-application__status";

    if (type) {
      status.classList.add("is-" + type);
    }
  };

  const getValue = (formData, name) => {
    const value = formData.get(name);
    return value ? String(value).trim() : "";
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const formData = new FormData(form);
    const foundedOn = getValue(formData, "founded_on");

    const foundedDate = new Date(foundedOn + "T00:00:00");
    const todayDate = new Date();

    todayDate.setHours(0, 0, 0, 0);

    const ageInDays = Math.floor(
      (todayDate.getTime() - foundedDate.getTime()) / 86400000
    );

    if (
      Number.isNaN(foundedDate.getTime()) ||
      ageInDays < 0 ||
      ageInDays > 30
    ) {
      setStatus(
        "START 30 važi za firme registrovane najviše 30 dana. Proverite datum osnivanja.",
        "error"
      );
      return;
    }

    const payload = {
      company_name: getValue(formData, "company_name"),
      legal_form: getValue(formData, "legal_form"),
      pib: getValue(formData, "pib"),
      registration_number: getValue(formData, "registration_number"),
      founded_on: foundedOn,
      contact_name: getValue(formData, "contact_name"),
      contact_email: getValue(formData, "contact_email"),
      contact_phone: getValue(formData, "contact_phone"),
      city: getValue(formData, "city"),
      business_activity: getValue(formData, "business_activity"),
      requested_solution: getValue(formData, "requested_solution"),
      payment_mode: getValue(formData, "payment_mode"),
      message: getValue(formData, "message"),
      website: getValue(formData, "website"),
      privacy_consent: formData.get("privacy_consent") === "on",
      contact_consent: formData.get("contact_consent") === "on",
      marketing_consent: formData.get("marketing_consent") === "on",
      source_url: window.location.href
    };

    submitButton.disabled = true;
    setStatus("Prijava se šalje. Molimo sačekajte...", "loading");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      let result = {};

      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          "Prijava trenutno nije mogla da bude poslata."
        );
      }

      const reference =
        result.reference ||
        result.application_reference ||
        "";

      form.reset();

      setStatus(
        reference
          ? "Prijava je primljena. Referenca: " + reference
          : "Prijava je primljena. Javićemo vam se nakon provere.",
        "success"
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Došlo je do greške. Pokušajte ponovo ili pišite na start30@platinumcore777.com.",
        "error"
      );
    } finally {
      submitButton.disabled = false;
    }
  });
})();