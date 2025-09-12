console.log("Signup JS loaded ✅");
// DOM Elements
const signInBtn = document.getElementById('signInBtn');
const createAccountBtn = document.getElementById('createAccountBtn');
const signInModal = document.getElementById('signInModal');
const createAccountModal = document.getElementById('createAccountModal');
const closeSignIn = document.getElementById('closeSignIn');
const closeCreateAccount = document.getElementById('closeCreateAccount');
const switchToSignUp = document.getElementById('switchToSignUp');
const switchToSignIn = document.getElementById('switchToSignIn');
const contactForm = document.getElementById('contactForm');
const signInForm = document.getElementById('signInForm');
const createAccountForm = document.getElementById('createAccountForm');

// Modal Functions
function openModal(modal) {
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    closeModal(signInModal);
    closeModal(createAccountModal);
}

// Event Listeners for Modal Controls
if (signInBtn) {
    signInBtn.addEventListener('click', () => {
        closeAllModals();
        openModal(signInModal);
    });
}

if (createAccountBtn) {
    createAccountBtn.addEventListener('click', () => {
        closeAllModals();
        openModal(createAccountModal);
    });
}

if (closeSignIn) {
    closeSignIn.addEventListener('click', () => {
        closeModal(signInModal);
    });
}

if (closeCreateAccount) {
    closeCreateAccount.addEventListener('click', () => {
        closeModal(createAccountModal);
    });
}

if (switchToSignUp) {
    switchToSignUp.addEventListener('click', () => {
        closeModal(signInModal);
        openModal(createAccountModal);
    });
}

if (switchToSignIn) {
    switchToSignIn.addEventListener('click', () => {
        closeModal(createAccountModal);
        openModal(signInModal);
    });
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === signInModal) {
        closeModal(signInModal);
    }
    if (e.target === createAccountModal) {
        closeModal(createAccountModal);
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// Form Submissions
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        
        // Simulate form submission
        console.log('Contact form submitted:', data);
        
        // Show success message
        alert('Thank you for your message! We\'ll get back to you soon.');
        
        // Reset form
        contactForm.reset();
    });
}



// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to header
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop > lastScrollTop && scrollTop > 100) {
        // Scrolling down
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up
        header.style.transform = 'translateY(0)';
    }
    
    lastScrollTop = scrollTop;
});

// Add animation to elements when they come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.feature-item, .audience-card, .benefit-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Add hover effects to cards
document.querySelectorAll('.feature-item, .audience-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Add typing effect to hero title (optional enhancement)
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Add any initialization code here
    console.log('Project-K website loaded successfully!');
    
    // You can uncomment the line below to add a typing effect to the hero title
    // typeWriter(document.querySelector('.hero-title'), 'Collaborate in Real-Time Like Never Before', 50);
});

// Mobile menu toggle (if you want to add a mobile menu later)
function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    nav.classList.toggle('mobile-active');
}

// Add click handlers for CTA buttons
document.querySelectorAll('.btn-primary').forEach(button => {
    if (!button.id) { // Don't interfere with modal buttons
        button.addEventListener('click', function(e) {
            if (this.textContent.includes('Start') || this.textContent.includes('Trial')) {
                e.preventDefault();
                openModal(createAccountModal);
            } else if (this.textContent.includes('Demo')) {
                e.preventDefault();
                alert('Demo functionality would be implemented here!');
            }
        });
    }
});

// Add click handlers for outline buttons
document.querySelectorAll('.btn-outline').forEach(button => {
    if (!button.id) { // Don't interfere with modal buttons
        button.addEventListener('click', function(e) {
            if (this.textContent.includes('Demo')) {
                e.preventDefault();
                alert('Demo scheduling functionality would be implemented here!');
            }
        });
    }
});

// Add some interactive feedback for form inputs
document.querySelectorAll('.form-input, .form-textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
        if (this.value) {
            this.parentElement.classList.add('filled');
        } else {
            this.parentElement.classList.remove('filled');
        }
    });
});

// Add CSS for focus states
const style = document.createElement('style');
style.textContent = `
    .form-group.focused .form-label {
        color: var(--primary-600);
    }
    
    .form-group.filled .form-label {
        color: var(--gray-700);
    }
    
    .header {
        transition: transform 0.3s ease;
    }
    
    .feature-item, .audience-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
`;
document.head.appendChild(style);







  






document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, setting up event listeners");

  // Store original button text for loading feedback
  const buttons = document.querySelectorAll('button[type="submit"]');
  buttons.forEach(btn => {
    btn.dataset.originalText = btn.textContent;
  });

  // Function: Set loading state
  function setLoading(button, isLoading) {
    if (!button) return;
    button.disabled = isLoading;
    button.textContent = isLoading ? "Loading..." : button.dataset.originalText;
  }

  // Function: Validate email format
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Function: Make API call
  async function makeAPICall(url, data) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return {
        success: response.ok,
        data: result,
        status: response.status
      };
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // SIGN UP HANDLER
  const signupForm = document.getElementById("createAccountForm");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = signupForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);

      const firstName = document.getElementById("signUpFirstName")?.value.trim();
      const lastName = document.getElementById("signUpLastName")?.value.trim();
      const email = document.getElementById("signUpEmail")?.value.trim();
      const password = document.getElementById("signUpPassword")?.value;
      const confirmPassword = document.getElementById("confirmPassword")?.value;

      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        alert("All fields are required");
        return setLoading(submitBtn, false);
      }

      if (!isValidEmail(email)) {
        alert("Please enter a valid email address");
        return setLoading(submitBtn, false);
      }

      if (password.length < 6) {
        alert("Password must be at least 6 characters");
        return setLoading(submitBtn, false);
      }

      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return setLoading(submitBtn, false);
      }

      const result = await makeAPICall("http://localhost:3000/api/signup", {
        firstName,
        lastName,
        email,
        password
      });

      setLoading(submitBtn, false);

      if (result.success) {
        alert(result.data.message || "Account created successfully!");
        signupForm.reset();
      } else {
        alert(result.data?.message || result.error || "Signup failed");
      }
    });
  } else {
    console.error("Signup form not found");
  }

  // LOGIN HANDLER
  const loginForm = document.getElementById("signInForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      setLoading(submitBtn, true);

      const email = document.getElementById("signInEmail")?.value.trim();
      const password = document.getElementById("signInPassword")?.value;

      if (!email || !password) {
        alert("Email and password are required");
        return setLoading(submitBtn, false);
      }

      if (!isValidEmail(email)) {
        alert("Invalid email format");
        return setLoading(submitBtn, false);
      }

      const result = await makeAPICall("http://localhost:3000/api/login", {
        email,
        password
      });

      setLoading(submitBtn, false);

      if (result.success && result.data?.user) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("user", JSON.stringify(result.data.user));
        window.location.href = "dashboard.html";
      } else {
        alert(result.data?.message || result.error || "Login failed");
      }
    });
  } else {
    console.error("Login form not found");
  }
});

