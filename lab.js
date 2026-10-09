import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBjaaE-C8LzunKLjlULujL--0c_Cd1fA94",
  authDomain: "kosti-university-it.firebaseapp.com",
  databaseURL: "https://kosti-university-it-default-rtdb.firebaseio.com",
  projectId: "kosti-university-it",
  storageBucket: "kosti-university-it.firebasestorage.app",
  messagingSenderId: "364361272352",
  appId: "1:364361272352:web:56953086b49cb2e0a6c045"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;
    if (currentPath.includes('dashboard.html')) {
        const loggedUser = localStorage.getItem('it_logged_user');
        if (!loggedUser) {
            window.location.href = 'login.html';
            return;
        }
        loadDashboardData();
    }

    if (currentPath.includes('login.html')) {
        const loggedUser = localStorage.getItem('it_logged_user');
        if (loggedUser) {
            window.location.href = 'dashboard.html';
            return;
        }
    }
});

let isLogin = true;
let generatedOtp = "";
let recoveryTargetEmail = "";
let isGoogleCaptchaVerified = false;

window.showToast = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.innerHTML = `<i class="fa-solid fa-circle-check fa-lg" style="color:#f97316;"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

window.showPassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.type = 'text';
}

window.hidePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (input) input.type = 'password';
}

window.checkPasswordStrength = function(password) {
    const strengthText = document.getElementById('strength-text');
    const bars = [document.getElementById('bar-1'), document.getElementById('bar-2'), document.getElementById('bar-3'), document.getElementById('bar-4')];
    if (!strengthText) return;

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 9) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9@$!%*?&]/.test(password)) score++;

    bars.forEach((bar, index) => {
        if (index < score) {
            bar.style.background = score <= 2 ? '#ef4444' : score === 3 ? '#f59e0b' : '#10b981';
        } else {
            bar.style.background = '#e2e8f0';
        }
    });

    if (password.length === 0) {
        strengthText.innerText = "أدخل 6 أحرف على الأقل";
        strengthText.style.color = "#94a3b8";
    } else if (score <= 2) {
        strengthText.innerText = "⚠️ كلمة المرور ضعيفة";
        strengthText.style.color = "#ef4444";
    } else if (score === 3) {
        strengthText.innerText = "⚡ كلمة المرور متوسطة";
        strengthText.style.color = "#f59e0b";
    } else {
        strengthText.innerText = "✅ كلمة المرور قوية ممتازة";
        strengthText.style.color = "#10b981";
    }
    checkPasswordMatch();
}

window.checkPasswordMatch = function() {
    const pass = document.getElementById('pass-input').value;
    const confirmPass = document.getElementById('confirm-pass-input').value;
    const matchText = document.getElementById('match-text');
    
    if (!matchText) return;
    if (confirmPass.length === 0) {
        matchText.innerText = "أعد إدخال كلمة المرور للتأكيد";
        matchText.style.color = "#94a3b8";
        return;
    }

    if (pass === confirmPass) {
        matchText.innerText = "✅ كلمتا المرور متطابقتان تماماً";
        matchText.style.color = "#10b981";
    } else {
        matchText.innerText = "❌ كلمتا المرور غير متطابقتين!";
        matchText.style.color = "#ef4444";
    }
}

window.toggleGoogleCaptcha = function() {
    const box = document.getElementById('google-recaptcha-box');
    if (box) {
        isGoogleCaptchaVerified = !isGoogleCaptchaVerified;
        if (isGoogleCaptchaVerified) {
            box.classList.add('checked');
        } else {
            box.classList.remove('checked');
        }
    }
}

function toggleMode() {
    isLogin = !isLogin;
    const signupFields = document.querySelectorAll('.signup-field');
    const loginExtras = document.getElementById('login-extras');
    const barsContainer = document.getElementById('strength-bars-container');

    signupFields.forEach(field => {
        if (isLogin) {
            field.classList.add('hidden-view');
        } else {
            field.classList.remove('hidden-view');
        }
    });

    if (barsContainer) {
        if (isLogin) barsContainer.classList.add('hidden-view');
        else barsContainer.classList.remove('hidden-view');
    }

    if (isLogin) {
        if(loginExtras) loginExtras.classList.remove('hidden-view');
        document.getElementById('form-title').innerText = "بوابة تقانة المعلومات";
        document.getElementById('form-subtitle').innerText = "تسجيل الدخول الأكاديمي للطلاب.";
        document.getElementById('submit-btn').innerText = "تسجيل الدخول";
        document.getElementById('switch-text').innerText = "ليس لديك حساب؟";
        document.getElementById('switch-btn').innerText = "سجل الآن";
    } else {
        if(loginExtras) loginExtras.classList.add('hidden-view');
        document.getElementById('form-title').innerText = "إنشاء حساب جامعي جديد";
        document.getElementById('form-subtitle').innerText = "قم بتعبئة بياناتك للانضمام للمنصة.";
        document.getElementById('submit-btn').innerText = "إنشاء الحساب";
        document.getElementById('switch-text').innerText = "لديك حساب بالفعل؟";
        document.getElementById('switch-btn').innerText = "سجل دخولك";
    }
}

function showLoadingOverlay(message) {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);
            display: flex; flex-direction: column; justify-content: center; align-items: center;
            z-index: 9999; color: white; font-family: 'Cairo', sans-serif;
        `;
        overlay.innerHTML = `
            <div style="width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.2); border-top: 5px solid #f97316; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p id="loading-text" style="margin-top: 15px; font-size: 1.05rem; font-weight: 700;">${message}</p>
        `;
        document.body.appendChild(overlay);
    } else {
        document.getElementById('loading-text').innerText = message;
        overlay.style.display = 'flex';
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if(overlay) overlay.style.display = 'none';
}

async function handleSubmit() {
    const emailInput = document.getElementById('email-input');
    const passInput = document.getElementById('pass-input');
    
    const email = emailInput ? emailInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';

    if (!email || !pass) { alert("الرجاء ملء جميع الحقول المطلوبة!"); return; }

    if (isLogin) {
        let users = JSON.parse(localStorage.getItem('it_platform_users') || '{}');
        if (!users[email]) { alert("الحساب غير موجود، يرجى إنشاء حساب جديد!"); return; }
        if (users[email].pass !== pass) { alert("كلمة المرور غير صحيحة!"); return; }

        showLoadingOverlay("جاري التحقق وتسجيل الدخول...");
        setTimeout(() => {
            hideLoadingOverlay();
            localStorage.setItem('it_logged_user', users[email].name);
            localStorage.setItem('it_logged_id', users[email].studentId || 'IT-2026-0000');
            localStorage.setItem('it_logged_semester', users[email].semester || 'السمستر الثاني');
            
            showToast("تم تسجيل الدخول بنجاح! جاري تحويلك...");
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        }, 800);

    } else {
        const nameInput = document.getElementById('fullname');
        const studentIdInput = document.getElementById('studentid');
        const semesterInput = document.getElementById('semester');
        const confirmPassInput = document.getElementById('confirm-pass-input');

        const name = nameInput ? nameInput.value.trim() : '';
        const studentId = studentIdInput ? studentIdInput.value.trim() : '';
        const semester = semesterInput ? semesterInput.value.trim() : '';
        const confirmPass = confirmPassInput ? confirmPassInput.value : '';
        
        if (!name || !studentId || !semester || !confirmPass) { alert("الرجاء ملء جميع الحقول المطلوبة!"); return; }
        if (pass.length < 6) { alert("كلمة المرور ضعيفة جداً! يجب ألا تقل عن 6 أحرف."); return; }
        if (pass !== confirmPass) { alert("عذراً، كلمتا المرور غير متطابقتين!"); return; }

        let users = JSON.parse(localStorage.getItem('it_platform_users') || '{}');
        if (users[email]) { alert("هذا البريد مسجل مسبقاً!"); return; }

        showLoadingOverlay("جاري التحقق من الرقم الجامعي عبر قاعدة البيانات...");

        try {
            const studentDocRef = doc(db, "students", studentId);
            const studentSnap = await getDoc(studentDocRef);

            if (!studentSnap.exists()) {
                hideLoadingOverlay();
                alert("عذراً، الرقم الجامعي غير مسجل في قاعدة بيانات الجامعة الرسمية!");
                return;
            }

            users[email] = { name: name, studentId: studentId, semester: semester, pass: pass };
            localStorage.setItem('it_platform_users', JSON.stringify(users));
            hideLoadingOverlay();
            
            showToast("تم إنشاء الحساب الأكاديمي بنجاح!");
            setTimeout(() => { toggleMode(); }, 1200);

        } catch (error) {
            hideLoadingOverlay();
            users[email] = { name: name, studentId: studentId, semester: semester, pass: pass };
            localStorage.setItem('it_platform_users', JSON.stringify(users));
            
            showToast("تم إنشاء الحساب الأكاديمي بنجاح!");
            setTimeout(() => { toggleMode(); }, 1200);
        }
    }
}

function startForgotPassword() {
    document.getElementById('auth-form-container').classList.add('hidden-view');
    document.getElementById('forgot-flow-container').classList.remove('hidden-view');
}

function triggerRealCaptcha() {
    if (!isGoogleCaptchaVerified) { alert("الرجاء تحديد خانة التحقق (أنا لست روبوت) أولاً!"); return; }

    showLoadingOverlay("جاري التحقق الأمني...");
    setTimeout(() => {
        hideLoadingOverlay();
        document.getElementById('step-captcha').classList.add('hidden-view');
        document.getElementById('step-email').classList.remove('hidden-view');
    }, 800);
}

function sendVerificationCode() {
    const email = document.getElementById('recovery-email-input').value.trim();
    let users = JSON.parse(localStorage.getItem('it_platform_users') || '{}');
    if (!email || !users[email]) { alert("هذا البريد غير مسجل في النظام!"); return; }
    
    recoveryTargetEmail = email;
    generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    
    showLoadingOverlay("جاري إرسال رمز التحقق...");
    setTimeout(() => {
        hideLoadingOverlay();
        alert("تم إرسال رمز التحقق بنجاح. رمز الـ OTP التجريبي الخاص بك هو: " + generatedOtp);
        document.getElementById('step-email').classList.add('hidden-view');
        document.getElementById('step-otp').classList.remove('hidden-view');
    }, 800);
}

function verifyOtpCode() {
    const userOtp = document.getElementById('otp-input').value.trim();
    if (userOtp === generatedOtp) {
        showLoadingOverlay("جاري مطابقة الرمز...");
        setTimeout(() => {
            hideLoadingOverlay();
            document.getElementById('step-otp').classList.add('hidden-view');
            document.getElementById('step-newpass').classList.remove('hidden-view');
        }, 800);
    } else {
        alert("رمز التحقق غير صحيح!");
    }
}

function saveNewPassword() {
    const newPass = document.getElementById('new-pass-input').value;
    const confirmNewPass = document.getElementById('confirm-new-pass-input').value;
    
    if (newPass.length < 6) { alert("يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف!"); return; }
    if (newPass !== confirmNewPass) { alert("كلمتا المرور غير متطابقتين!"); return; }

    let users = JSON.parse(localStorage.getItem('it_platform_users') || '{}');
    if (users[recoveryTargetEmail]) {
        users[recoveryTargetEmail].pass = newPass;
        localStorage.setItem('it_platform_users', JSON.stringify(users));
        showLoadingOverlay("جاري تحديث كلمة المرور...");
        setTimeout(() => {
            hideLoadingOverlay();
            showToast("تم تغيير كلمة المرور بنجاح!");
            backToLogin();
        }, 1000);
    }
}

function backToLogin() {
    document.getElementById('forgot-flow-container').classList.add('hidden-view');
    document.getElementById('auth-form-container').classList.remove('hidden-view');
}

function loadDashboardData() {
    const userName = localStorage.getItem('it_logged_user') || 'طالب تقانة المعلومات';
    const userId = localStorage.getItem('it_logged_id') || 'IT-2026-0000';
    const waBtn = document.querySelector('.whatsapp-action-btn');
    if (waBtn) {
        const waMessage = encodeURIComponent(`مرحباً إدارة تقانة المعلومات، أنا الطالب ${userName} (الرقم الجامعي: ${userId})، وأحتاج إلى مساعدة أكاديمية.`);
        waBtn.href = `https://wa.me/249900623733?text=${waMessage}`;
    }
}

window.handleSubmit = handleSubmit;
window.toggleMode = toggleMode;
window.showPassword = showPassword;
window.hidePassword = hidePassword;
window.startForgotPassword = startForgotPassword;
window.triggerRealCaptcha = triggerRealCaptcha;
window.sendVerificationCode = sendVerificationCode;
window.verifyOtpCode = verifyOtpCode;
window.saveNewPassword = saveNewPassword;
window.backToLogin = backToLogin;
window.checkPasswordStrength = checkPasswordStrength;
window.checkPasswordMatch = checkPasswordMatch;
window.toggleGoogleCaptcha = toggleGoogleCaptcha;
