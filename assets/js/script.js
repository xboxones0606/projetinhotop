const menuButton = document.getElementById("menuButton");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const formModal = document.getElementById("formModal");
const profileForm = document.getElementById("profileForm");
const sideMenuName = document.querySelector(".side-menu-name");
const sideMenuDocument = document.querySelector(".side-menu-document");
const preferencesButton = document.getElementById("preferencesButton")?.closest(".side-menu-item");
const closeModalButton = document.getElementById("closeModalButton");
const cpfInput = document.getElementById("cpf");
const rgInput = document.getElementById("rg");
const codigoInput = document.getElementById("codigo");
const profilePhotoInput = document.getElementById("profilePhoto");
const signaturePhotoInput = document.getElementById("signaturePhoto");
const profilePhotoPreview = document.getElementById("profilePhotoPreview");
const signaturePhotoPreview = document.getElementById("signaturePhotoPreview");
const appTitle = document.querySelector(".app-title");
const userButton = document.querySelector(".user-button");

function openMenu() {
  sideMenu.classList.add("active");
  overlay.classList.add("active");
}

function closeMenu() {
  sideMenu.classList.remove("active");
  overlay.classList.remove("active");
}

function openModal() {
  formModal.classList.add("active");
  overlay.classList.add("active");
}

function closeModal() {
  formModal.classList.remove("active");
  overlay.classList.remove("active");
}

function normalizeName(value) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function maskName(value) {
  return normalizeName(value)
    .split(" ")
    .map((word) => word.charAt(0) + "*".repeat(Math.max(word.length - 1, 0)))
    .join(" ");
}

function getFirstName(value) {
  return (value || "").trim().replace(/\s+/g, " ").split(" ")[0] || "";
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function normalizeCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length !== 11) {
    return value.trim();
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskCpf(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 11) {
    return value.trim();
  }

  return `**${digits[2]}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

function clearValidation() {
  profileForm.querySelectorAll(".field-error").forEach((error) => error.remove());
  profileForm.querySelectorAll(".form-group.error").forEach((group) => {
    group.classList.remove("error");
  });
}

function setFieldError(field, message) {
  const group = field.closest(".form-group");
  const error = document.createElement("span");

  group.classList.add("error");
  error.className = "field-error";
  error.textContent = message;
  group.appendChild(error);
}

function validateProfileForm() {
  clearValidation();

  const fields = Array.from(profileForm.elements).filter((field) => field.name);
  let firstInvalidField = null;

  fields.forEach((field) => {
    const isFile = field.type === "file";
    const value = isFile ? field.files[0] : field.value.trim();
    const savedData = JSON.parse(localStorage.getItem("userProfileData") || "{}");

    if (!value && !(isFile && savedData[field.name])) {
      setFieldError(field, "Campo obrigatorio.");
      firstInvalidField = firstInvalidField || field;
    }
  });

  const fullNameInput = profileForm.elements.fullName;
  const fullNameParts = fullNameInput.value.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (fullNameInput.value.trim() && fullNameParts.length < 2) {
    setFieldError(fullNameInput, "Informe nome e sobrenome.");
    firstInvalidField = firstInvalidField || fullNameInput;
  }

  if (cpfInput.value.trim() && onlyDigits(cpfInput.value).length !== 11) {
    setFieldError(cpfInput, "Informe um CPF com 11 digitos.");
    firstInvalidField = firstInvalidField || cpfInput;
  }

  if (rgInput.value.trim() && onlyDigits(rgInput.value).length < 7) {
    setFieldError(rgInput, "Informe um RG com no minimo 7 digitos.");
    firstInvalidField = firstInvalidField || rgInput;
  }

  if (codigoInput.value.trim() && onlyDigits(codigoInput.value).length !== 10) {
    setFieldError(codigoInput, "Informe um codigo com exatamente 10 digitos.");
    firstInvalidField = firstInvalidField || codigoInput;
  }

  [profilePhotoInput, signaturePhotoInput].forEach((field) => {
    const file = field.files[0];
    if (file && !file.type.startsWith("image/")) {
      setFieldError(field, "Escolha uma imagem valida.");
      firstInvalidField = firstInvalidField || field;
    }
  });

  const birthDate = profileForm.elements.birthDate;
  const licenseDate = profileForm.elements.licenseDate;
  const today = new Date().toISOString().split("T")[0];

  if (birthDate.value && birthDate.value > today) {
    setFieldError(birthDate, "A data de nascimento nao pode ser futura.");
    firstInvalidField = firstInvalidField || birthDate;
  }

  if (licenseDate.value && licenseDate.value > today) {
    setFieldError(licenseDate, "A data de habilitacao nao pode ser futura.");
    firstInvalidField = firstInvalidField || licenseDate;
  }

  if (birthDate.value && licenseDate.value && licenseDate.value < birthDate.value) {
    setFieldError(licenseDate, "A data de habilitacao deve ser posterior ao nascimento.");
    firstInvalidField = firstInvalidField || licenseDate;
  }

  if (firstInvalidField) {
    firstInvalidField.focus();
    return false;
  }

  return true;
}

function updateImagePreview(input, preview) {
  const file = input.files[0];

  preview.removeAttribute("src");
  preview.classList.remove("active");

  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;
    preview.classList.add("active");
  };
  reader.readAsDataURL(file);
}

function setSavedImagePreview(preview, value) {
  preview.removeAttribute("src");
  preview.classList.remove("active");

  if (!value) {
    return;
  }

  preview.src = value;
  preview.classList.add("active");
}

function fillProfileForm(userData) {
  Object.entries(userData).forEach(([key, value]) => {
    const field = profileForm.elements[key];
    if (!field || field.type === "file") {
      return;
    }

    field.value = value;
  });

  setSavedImagePreview(profilePhotoPreview, userData.profilePhoto);
  setSavedImagePreview(signaturePhotoPreview, userData.signaturePhoto);
}

// Atualiza o perfil no side-menu com os dados salvos
function updateSideMenuProfile(userData) {
  const fullName = userData.fullName || userData.nome || "";
  const firstName = getFirstName(fullName);

  sideMenuName.textContent = fullName || "sem nome";
  sideMenuDocument.textContent = userData.cpf || "000.005.437-00";

  if (appTitle && firstName) {
    appTitle.textContent = firstName.toUpperCase();
  }

  if (userButton && firstName) {
    userButton.textContent = firstName.charAt(0).toUpperCase();
    userButton.setAttribute("aria-label", `Perfil de ${firstName}`);
  }
}

// Verifica se é a primeira vez que o usuário acessa
function checkFirstVisit() {
  const userDataSaved = localStorage.getItem("userProfileData");
  
  if (userDataSaved) {
    // Se há dados salvos, atualiza o side-menu
    const userData = JSON.parse(userDataSaved);
    updateSideMenuProfile(userData);
    fillProfileForm(userData);
  } else {
    // Cadastro disponivel apenas pelo item Preferencias.
    return;
  }
}

// Função para converter arquivo em base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Salva os dados do formulário
profileForm.addEventListener("submit", async function(e) {
  e.preventDefault();

  if (!validateProfileForm()) {
    return;
  }
  
  const formData = new FormData(profileForm);
  const existingData = JSON.parse(localStorage.getItem("userProfileData") || "{}");
  const userData = { ...existingData };
  const imageFields = ["profilePhoto", "signaturePhoto"];
  
  // Processa campos de texto
  for (let [key, value] of formData.entries()) {
    if (!imageFields.includes(key)) {
      userData[key] = value.trim();
    }
  }
  
  // Processa imagens de forma assíncrona
  try {
    for (let fieldName of imageFields) {
      const file = formData.get(fieldName);
      if (file) {
        userData[fieldName] = await fileToBase64(file);
      }
    }
    
    userData.fullName = normalizeName(userData.fullName);
    userData.nome = userData.fullName;
    userData.nomehash = maskName(userData.fullName);
    userData.cpf = normalizeCpf(userData.cpf);
    userData.cpfhash = maskCpf(userData.cpf);

    // Salva os dados completos
    localStorage.setItem("userProfileData", JSON.stringify(userData));
    
    // Atualiza o side-menu com os novos dados
    updateSideMenuProfile(userData);
    
    closeModal();
    alert("Informações salvas com sucesso!");
    
    // Redireciona para a página do condutor após 1 segundo
    setTimeout(() => {
      window.location.href = "./condutor.html";
    }, 1000);
  } catch (error) {
    console.error("Erro ao processar imagens:", error);
    alert("Erro ao salvar as imagens. Tente novamente.");
  }
});

// Fecha o modal se clicar no overlay (apenas para menu)
overlay.addEventListener("click", function(e) {
  if (e.target === overlay && sideMenu.classList.contains("active")) {
    closeMenu();
  } else if (e.target === overlay && formModal.classList.contains("active")) {
    closeModal();
  }
});

menuButton.addEventListener("click", openMenu);

cpfInput.addEventListener("input", function() {
  cpfInput.value = normalizeCpf(cpfInput.value);
});

rgInput.addEventListener("input", function() {
  rgInput.value = onlyDigits(rgInput.value);
});

codigoInput.addEventListener("input", function() {
  codigoInput.value = onlyDigits(codigoInput.value).slice(0, 10);
});

profilePhotoInput.addEventListener("change", function() {
  updateImagePreview(profilePhotoInput, profilePhotoPreview);
});

signaturePhotoInput.addEventListener("change", function() {
  updateImagePreview(signaturePhotoInput, signaturePhotoPreview);
});

preferencesButton.addEventListener("click", function(e) {
  e.preventDefault();
  closeMenu();
  openModal();
});

// Verifica se é primeira visita quando a página carrega
closeModalButton.addEventListener("click", closeModal);

document.addEventListener("dragstart", function(e) {
  e.preventDefault();
});

document.addEventListener("DOMContentLoaded", checkFirstVisit);
