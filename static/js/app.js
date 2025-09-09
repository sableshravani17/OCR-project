document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("upload-form");
  const extractBtn = document.getElementById("extract-btn");
  const resultSection = document.getElementById("result");
  const outputDiv = document.getElementById("output");
  const resetBtn = document.getElementById("reset-btn");
  const imageInput = document.getElementById("image");
  const previewContainer = document.getElementById("preview-container");
  const previewImg = document.getElementById("preview-img");
  const loader = document.getElementById("loader");

  // Show image preview when user selects a file
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      previewImg.src = url;
      previewContainer.classList.remove("hidden");
    } else {
      previewImg.src = "";
      previewContainer.classList.add("hidden");
    }
  });

  // Handle form submit for extraction
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!imageInput.files.length) {
      alert("Please select an image file to upload.");
      return;
    }

    extractBtn.disabled = true;
    extractBtn.textContent = "Extracting...";
    loader.classList.remove("hidden");
    outputDiv.innerHTML = "";

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      extractBtn.disabled = false;
      extractBtn.textContent = "Extract Details";
      loader.classList.add("hidden");

      if (!response.ok) {
        outputDiv.innerHTML = `<p id="error">${data.error || "An error occurred during extraction."}</p>`;
        showResult();
        return;
      }

      if (data.error) {
        outputDiv.innerHTML = `<p id="error">${data.error}</p>`;
      } else {
        let html = "";
        if (data.date_of_birth && data.date_of_birth !== "Not found") {
          html += `<p><strong>Date of Birth:</strong> ${data.date_of_birth}</p>`;
        } else {
          html += `<p><strong>Date of Birth:</strong> Not found</p>`;
        }

        if (data.aadhaar_number) {
          html += `<p><strong>Aadhaar Number:</strong> ${data.aadhaar_number}</p>`;
        } else if (data.pan_number) {
          html += `<p><strong>PAN Number:</strong> ${data.pan_number}</p>`;
        }

        outputDiv.innerHTML = html;
      }

      showResult();
    } catch (error) {
      extractBtn.disabled = false;
      extractBtn.textContent = "Extract Details";
      loader.classList.add("hidden");
      outputDiv.innerHTML = `<p id="error">Unexpected error: ${error.message}</p>`;
      showResult();
    }
  });

  resetBtn.addEventListener("click", () => {
    outputDiv.innerHTML = "";
    resultSection.classList.add("hidden");
    form.classList.remove("hidden");
    form.reset();
    previewContainer.classList.add("hidden");
    previewImg.src = "";
  });

  function showResult() {
    resultSection.classList.remove("hidden");
    form.classList.add("hidden");
  }
});

