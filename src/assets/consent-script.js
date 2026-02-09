// Consent Widget Script - DSCI Event
(function() {
const {
  consentFormId,
  apiUrl,
  submitApiUrl,
  showButtons,
  showLanguageDropdown,
  enableCheckboxes,
  enableRadioButtons,
  enableDropdowns
} = window.consentWidgetConfig;

let createConsentRequestList = [];
let dataPrincipalIdList = [];
let clickEvent = function () {};
let currentConsentData = null;
let currentSelectedLang = 'en';

async function fetchConsentData() {
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consentFormId })
    });
    const result = await res.json();
    const data = result?.[0] || result?.response?.[0];

    if (!data) {
      document.getElementById("consent-root").innerText = "Consent data not found.";
      return;
    }

    currentConsentData = data;
    renderConsent(data, data.languages?.[0]?.toLowerCase() || "en");
  } catch (e) {
    document.getElementById("consent-root").innerText = "Error loading consent.";
  }
}

function setDataPrincipalIdList() {
  dataPrincipalIdList = [];
  // Get email from Angular's window function if available
  const email = window.getRegistrationEmail ? window.getRegistrationEmail() : "";
  dataPrincipalIdList.push({ key: "email", value: email });
}

function showToast(message, type) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.backgroundColor =
    type === "success" ? "#4CAF50" : "#f44336";

  toast.style.visibility = "visible";
  toast.classList.remove("show");
  void toast.offsetHeight;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
    toast.style.visibility = "hidden";
  }, 3000);
}

// Check if at least one consent is selected
function hasSelectedConsent() {
  const consentDiv = document.getElementById("consent-root");
  if (!consentDiv) return false;

  const checkboxes = consentDiv.querySelectorAll('input[type="checkbox"]:checked');
  const radioButtons = consentDiv.querySelectorAll('input[type="radio"]:checked');
  const dropdowns = consentDiv.querySelectorAll("select");

  // Check if any checkbox is checked
  if (checkboxes.length > 0) return true;

  // Check if any radio button is selected
  if (radioButtons.length > 0) return true;

  // Check if any dropdown has a non-empty selection
  for (let drop of dropdowns) {
    if (drop.selectedIndex > 0) return true;
  }

  return false;
}

// Expose function globally for Angular
window.hasSelectedConsent = hasSelectedConsent;

function captureConsentData() {
  setDataPrincipalIdList();
  createConsentRequestList = [];

  const consentDiv = document.getElementById("consent-root");
  if (!consentDiv) {
    return { createConsentRequestList: [], dataPrincipalIdList: [] };
  }

  const checkboxes = consentDiv.querySelectorAll('input[type="checkbox"]:checked');
  const radioButtons = consentDiv.querySelectorAll('input[type="radio"]:checked');
  const dropdowns = consentDiv.querySelectorAll("select");

  const pushConsent = (permissionId, label) => {
    let existing = createConsentRequestList.find(req => req.permissionId === permissionId);
    if (existing) {
      existing.optedFor.push(label);
    } else {
      createConsentRequestList.push({
        dataPrincipalIdList,
        permissionId,
        consentReceivedType: "FORMS",
        optedFor: [label],
        consentLanguage: currentSelectedLang
      });
    }
  };

  checkboxes.forEach(checkbox => {
    if (!enableCheckboxes) return;
    const label = checkbox.closest("label") ? checkbox.closest("label").textContent.trim() : checkbox.value;
    pushConsent(checkbox.name, label);
  });

  radioButtons.forEach(radio => {
    if (!enableRadioButtons) return;
    const label = radio.closest("label") ? radio.closest("label").textContent.trim() : radio.value;
    pushConsent(radio.name, label);
  });

  dropdowns.forEach(drop => {
    if (!enableDropdowns) return;
    const selected = drop.options[drop.selectedIndex];
    if (drop.selectedIndex > 0) {
      pushConsent(drop.name, selected.textContent);
    }
  });

  // Include all permission fields even if not selected (with empty optedFor)
  document.querySelectorAll("#consent-root [name]").forEach(el => {
    if (!createConsentRequestList.some(req => req.permissionId === el.name)) {
      createConsentRequestList.push({
        dataPrincipalIdList,
        permissionId: el.name,
        consentReceivedType: "FORMS",
        optedFor: [],
        consentLanguage: currentSelectedLang
      });
    }
  });

  console.log("Final Consent Payload:", createConsentRequestList);

  return {
    createConsentRequestList,
    dataPrincipalIdList
  };
}

// Expose capture function globally for Angular
window.captureConsentData = captureConsentData;

function setFormDisabled(disabled = true) {
  const root = document.getElementById("consent-root");
  if (!root) return;
  const inputs = root.querySelectorAll("input, select, textarea, button");
  inputs.forEach(input => input.disabled = disabled);
}

function renderConsent(data, selectedLang) {
  currentSelectedLang = selectedLang;
  const root = document.getElementById("consent-root");
  root.innerHTML = "";
  const branding = data.branding || {};

  let permissions = [];
  if (Array.isArray(data.consentForm)) {
    permissions = data.consentForm.flatMap(cf => cf.permissions || []);
  } else if (Array.isArray(data.permissions)) {
    permissions = data.permissions;
  }

  const logoArea = document.getElementById("logo-area");
  if (logoArea) {
    logoArea.innerHTML = "";
    logoArea.classList.remove("left", "center", "right");

    const align = (branding.logoAlignment || "left").toLowerCase();
    logoArea.classList.add(["left", "center", "right"].includes(align) ? align : "left");

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";

    if (align === "center") {
      wrapper.style.flexDirection = "column";
    } else if (align === "right") {
      wrapper.style.flexDirection = "row-reverse";
    } else {
      wrapper.style.flexDirection = "row";
    }

    wrapper.style.alignItems = "center";
    wrapper.style.gap = "5px";

    if (branding.logo) {
      const img = document.createElement("img");
      img.src = branding.logo;
      img.alt = branding.companyName || "Logo";
      img.className = "branding-logo";
      img.onerror = () => img.classList.add("hidden");
      wrapper.appendChild(img);
    }

    if (branding.companyName) {
      const nameDiv = document.createElement("div");
      nameDiv.innerText = branding.companyName;
      nameDiv.classList.add("company-name");

      if (branding.headerFontColor) nameDiv.style.color = branding.headerFontColor;
      if (branding.headerFontFamily) nameDiv.style.fontFamily = branding.headerFontFamily;
      if (branding.headerFontSize) {
        const sizeMap = { small: "14px", medium: "16px", large: "20px" };
        const sz = String(branding.headerFontSize).toLowerCase();
        nameDiv.style.fontSize = sizeMap[sz] || branding.headerFontSize;
      }
      if (branding.headerFontStyle) {
        const styleLower = String(branding.headerFontStyle).toLowerCase();
        if (styleLower.includes("italic")) nameDiv.style.fontStyle = "italic";
        if (styleLower.includes("bold")) nameDiv.style.fontWeight = "bold";
        if (styleLower.includes("normal")) {
          nameDiv.style.fontStyle = "normal";
          nameDiv.style.fontWeight = "400";
        }
      }

      if (branding.companySubtitle) {
        const subEl = document.createElement("div");
        subEl.className = "company-subtitle";
        subEl.innerText = branding.companySubtitle;
        if (branding.subtitleFontSize) subEl.style.fontSize = branding.subtitleFontSize;
        if (branding.subtitleFontColor) subEl.style.color = branding.subtitleFontColor;
        nameDiv.appendChild(subEl);
      }

      wrapper.appendChild(nameDiv);
    }

    logoArea.appendChild(wrapper);
  }

  const langWrapper = document.getElementById("language-wrapper");
  const langSelect = document.getElementById("langSelect");
  if (showLanguageDropdown && data.languages?.length >= 1 && langWrapper && langSelect) {
    langWrapper.style.display = "block";
    langSelect.innerHTML = "";
    data.languages.forEach(lang => {
      const opt = document.createElement("option");
      opt.value = lang.toLowerCase();
      opt.text = lang;
      if (opt.value === selectedLang) opt.selected = true;
      langSelect.appendChild(opt);
    });
    langSelect.onchange = () => renderConsent(data, langSelect.value);
  } else if (langWrapper) {
    langWrapper.style.display = "none";
  }

  if (!permissions.length) {
    root.innerHTML = "<p>No consent items found.</p>";
    return;
  }

  permissions.forEach(perm => {
    const block = document.createElement("div");
    block.className = "permission-block";

    const tr = perm.permissionTranslation?.find(pt => pt.language.toLowerCase() === selectedLang);
    const htmlString = (tr?.text || perm.text || "").trim();

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;

    const children = Array.from(tempDiv.children);

    if (children.length > 0) {
      children.forEach((child, index) => {
        const el = document.createElement(child.tagName.toLowerCase());
        el.innerHTML = child.innerHTML;

        if (child.getAttribute("style")) {
          el.setAttribute("style", child.getAttribute("style"));
        }

        if (
          /^h[1-6]$/i.test(child.tagName) &&
          !/font-weight/i.test(child.getAttribute("style") || "")
        ) {
          el.style.fontWeight = "normal";
        }

        el.style.display = "block";
        el.style.margin = "2px 0";
        el.style.lineHeight = "1.4";
        el.setAttribute("data-translate-text", perm.id);

        if (perm.mandatory && index === children.length - 1) {
          el.innerHTML += ' <span class="mandatory">*</span>';
        }

        block.appendChild(el);
      });
    } else {
      const p = document.createElement("p");
      p.textContent = htmlString.replace(/<[^>]*>/g, "").trim();
      p.setAttribute("data-translate-text", perm.id);

      if (perm.mandatory) {
        p.innerHTML += ' <span class="mandatory">*</span>';
      }

      block.appendChild(p);
    }

    const options = tr?.options || perm.options || [];

    if (perm.elementType === 'CHECKBOX' && enableCheckboxes) {
      options.forEach(opt => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "checkbox";
        input.name = perm.id;
        input.value = opt;
        label.appendChild(input);
        label.append(" " + opt);
        block.appendChild(label);
      });
    }

    if (perm.elementType === 'RADIOBUTTON' && enableRadioButtons) {
      options.forEach(opt => {
        const label = document.createElement("label");
        const input = document.createElement("input");
        input.type = "radio";
        input.name = perm.id;
        input.value = opt;
        label.appendChild(input);
        label.append(" " + opt);
        block.appendChild(label);
      });
    }

    if (perm.elementType === 'DROPDOWN' && enableDropdowns) {
      const select = document.createElement("select");
      select.name = perm.id;
      // Add empty first option
      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.text = "Select an option";
      select.appendChild(emptyOpt);

      options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.text = opt;
        select.appendChild(option);
      });
      block.appendChild(select);
    }

    root.appendChild(block);
  });

  // Hide the default buttons since Angular handles submission
  const cancelBtn = document.getElementById("cancelBtn");
  const submitBtn = document.getElementById("submitBtn");
  if (cancelBtn) cancelBtn.style.display = "none";
  if (submitBtn) submitBtn.style.display = "none";
}

// Auto-fetch consent data when script loads
fetchConsentData();

})();
