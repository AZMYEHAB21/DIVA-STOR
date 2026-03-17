// ==================== Offers Management ==================== //
// Set this to true to show offers, false to hide them
let OFFERS_AVAILABLE = false;

document.addEventListener('DOMContentLoaded', function() {
    const offersSection = document.getElementById('offers');
    const noOffersMessage = document.getElementById('noOffersMessage');
    
    if (!OFFERS_AVAILABLE && offersSection && noOffersMessage) {
        // Add blur effect to entire section
        offersSection.classList.add('offers-disabled');
        // Show no offers message
        noOffersMessage.classList.remove('hidden');
    } else if (noOffersMessage) {
        // Hide the no offers message
        noOffersMessage.classList.add('hidden');
    }
});

// Function to enable offers (call this from console when ready)
function enableOffers() {
    const offersSection = document.getElementById('offers');
    const noOffersMessage = document.getElementById('noOffersMessage');
    
    OFFERS_AVAILABLE = true;
    
    if (offersSection) {
        offersSection.classList.remove('offers-disabled');
    }
    
    if (noOffersMessage) {
        noOffersMessage.classList.add('hidden');
    }
    
    console.log('✓ تم تفعيل العروض بنجاح!');
}

// Function to disable offers (call this from console if needed)
function disableOffers() {
    const offersSection = document.getElementById('offers');
    const noOffersMessage = document.getElementById('noOffersMessage');
    
    OFFERS_AVAILABLE = false;
    
    if (offersSection) {
        offersSection.classList.add('offers-disabled');
    }
    
    if (noOffersMessage) {
        noOffersMessage.classList.remove('hidden');
    }
    
    console.log('✗ تم تعطيل العروض!');
}

// ==================== Hamburger Menu ==================== //
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
    }
});

// ==================== Form Validation ==================== //
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (input.type === 'email') {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(input.value)) {
                isValid = false;
                input.style.borderColor = '#ff0000';
            } else {
                input.style.borderColor = '#000';
            }
        } else if (input.value.trim() === '') {
            isValid = false;
            input.style.borderColor = '#ff0000';
        } else {
            input.style.borderColor = '#000';
        }
    });

    return isValid;
}

// ==================== Contact Form Handler ==================== //
if (document.getElementById('contactForm')) {
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();

        if (validateForm(this)) {
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            // Here you would normally send this data to a server
            console.log('Form submitted:', formData);

            // Show success message
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            successMsg.textContent = 'شكراً لتواصلك معنا! سنرد عليك قريباً';
            document.body.appendChild(successMsg);

            // Remove success message after 3 seconds
            setTimeout(() => {
                successMsg.remove();
            }, 3000);

            // Reset form
            this.reset();
        } else {
            alert('الرجاء ملء جميع الحقول بشكل صحيح');
        }
    });
}

// ==================== Newsletter Form Handler ==================== //
if (document.getElementById('newsletterForm')) {
    document.getElementById('newsletterForm').addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;

        if (email && email.includes('@')) {
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background-color: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            `;
            successMsg.textContent = 'شكراً للاشتراك! تحققي من بريدك الإلكتروني';
            document.body.appendChild(successMsg);

            setTimeout(() => {
                successMsg.remove();
            }, 3000);

            this.reset();
        } else {
            alert('الرجاء إدخال بريد إلكتروني صحيح');
        }
    });
}

// ==================== Smooth Scrolling Animation ==================== //
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements on page load
document.addEventListener('DOMContentLoaded', function() {
    const elementsToObserve = document.querySelectorAll('.feature-card, .offer-card, .info-card, .stat-box, .about-text');
    elementsToObserve.forEach(el => {
        observer.observe(el);
    });
});

// ==================== Add Animations ==================== //
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideInLeft {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ==================== Scroll to Top Button ==================== //
const scrollToTopBtn = document.createElement('button');
scrollToTopBtn.innerHTML = '↑';
scrollToTopBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background-color: #000;
    color: white;
    border: 2px solid white;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    cursor: pointer;
    display: none;
    z-index: 999;
    transition: all 0.3s ease;
    font-weight: bold;
`;

scrollToTopBtn.addEventListener('mouseenter', function() {
    this.style.backgroundColor = 'white';
    this.style.color = '#000';
    this.style.transform = 'scale(1.1)';
});

scrollToTopBtn.addEventListener('mouseleave', function() {
    this.style.backgroundColor = '#000';
    this.style.color = 'white';
    this.style.transform = 'scale(1)';
});

document.body.appendChild(scrollToTopBtn);

// Show/hide scroll to top button with animation
window.addEventListener('scroll', function() {
    if (window.pageYOffset > 300) {
        scrollToTopBtn.style.display = 'block';
        scrollToTopBtn.style.animation = 'fadeInUp 0.3s ease';
    } else {
        scrollToTopBtn.style.display = 'none';
    }
});

// Scroll to top when button is clicked
scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// ==================== Active Link Highlighting ==================== //
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.style.borderBottomColor = 'white';
            link.style.borderBottomWidth = '2px';
        }
    });
});

// ==================== Lazy Loading Images ==================== //
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ==================== Back to Top on Page Load ==================== //
if (window.location.hash === '') {
    window.scrollTo(0, 0);
}

// ==================== Advanced Hover Effects ==================== //
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.feature-card, .offer-card, .info-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.3s ease';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.25)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)';
        });
    });
});

// ==================== Parallax Scrolling ==================== //
document.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const hero = document.querySelector('.hero');
    
    if (hero) {
        hero.style.backgroundPosition = `0 ${scrollPosition * 0.5}px`;
    }
});

// ==================== Counter Animation ==================== //
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + '+';
            clearInterval(interval);
        } else {
            element.textContent = Math.floor(current) + '+';
        }
    }, 16);
}

document.addEventListener('DOMContentLoaded', function() {
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                statNumbers.forEach(stat => {
                    const number = parseInt(stat.textContent);
                    animateCounter(stat, number);
                });
            }
        });
    }, { threshold: 0.5 });
    
    if (statNumbers.length > 0) {
        observer.observe(statNumbers[0].closest('.stat-box'));
    }
});

// ==================== Dynamic Navbar Background ==================== //
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

// ==================== Form Input Effects ==================== //
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
            this.style.borderColor = '#000';
        });
        
        input.addEventListener('blur', function() {
            this.style.boxShadow = 'none';
        });
    });
});

// ==================== Button Ripple Effect ==================== //
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                animation: rippleEffect 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });
});

// ==================== Add Ripple Animation to CSS ==================== //
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes rippleEffect {
        to {
            width: 300px;
            height: 300px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// ==================== Page Load Animation ==================== //
window.addEventListener('load', function() {
    const elements = document.querySelectorAll('.nav-link, .hero-title, .hero-subtitle, .feature-card');
    elements.forEach((el, index) => {
        el.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;
    });
});

console.log('DIVA Website - Script loaded successfully with advanced animations');
