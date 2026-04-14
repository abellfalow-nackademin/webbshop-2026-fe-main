document.addEventListener("DOMContentLoaded", initRegister);

function initRegister() {
  const registerForm = document.getElementById("registerForm");

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleRegister();
  });
}

async function handleRegister() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // TODO: Call register API when backend is ready
  try {
    const response = await fetch('https://plot-twist-neon.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        email,
        password
      })
    })
    const data = await response.json();
    if (data.success === true) {
      alert("Account Created!")
    } else {
      alert(data.message)
    }
  } catch (error) {
    console.log(error);
  }

  console.log("Register:", { name, email, password });
}
