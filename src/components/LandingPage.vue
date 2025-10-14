<template>
  <div class="landing-container">
    <div class="content">
      <img :src="logo" alt="Kaiborg Logo" class="logo" />
      <h1 class="tagline">Stupid simple kanbans for small dev teams</h1>
      <button @click="$emit('sign-in')" class="sign-in-btn">
        <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" class="google-icon" alt="Google" />
        Sign in with Google
      </button>
    </div>
  </div>
</template>

<script>
import logo from '../assets/kaiborg_logo.png';

export default {
  name: 'LandingPage',
  data() {
    return {
      logo,
    };
  },
};
</script>

<style scoped lang="css">
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');

/* ============================================
   BASE STYLES (Mobile First - <576px)
   ============================================ */

.landing-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #1a1a27;
  color: #FFFFFF;
  align-items: center;
  justify-content: center;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
  max-width: 1200px;
  width: 100%;
}

.logo {
  width: 160px;
  height: auto;
  margin-bottom: 2.5rem;
  margin-top: -2rem;
  margin-left: 0;
}

.tagline {
  font-family: 'Poppins', sans-serif;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 600;
  margin-bottom: 2.5rem;
  color: #e6e6e9;
  max-width: 960px;
}

.sign-in-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background-color: #FFFFFF;
  color: #5F6368;
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 4px;
  border: 1px solid #dadce0;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  transition: all 0.2s ease;
  cursor: pointer;
  margin-bottom: 3rem;
}

.sign-in-btn:hover {
  background-color: #f8f9fa;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.google-icon {
  width: 18px;
  height: 18px;
  margin-right: 10px;
}

/* ============================================
   RESPONSIVE BREAKPOINTS (Mobile First)
   ============================================ */

/* Small (≥576px) */
@media (min-width: 576px) {
  .logo {
    width: 200px;
    margin-bottom: 3rem;
  }
  
  .tagline {
    font-size: 2.5rem;
    margin-bottom: 3rem;
  }
  
  .sign-in-btn {
    margin-bottom: 4rem;
  }
}

/* Medium (≥768px) */
@media (min-width: 768px) {
  .content {
    padding: 2rem;
  }
  
  .logo {
    width: 240px;
    margin-bottom: 4rem;
    margin-top: -3rem;
  }
  
  .tagline {
    font-size: 3.5rem;
    margin-bottom: 4rem;
  }
  
  .sign-in-btn {
    margin-bottom: 5rem;
  }
}

/* Large (≥992px) */
@media (min-width: 992px) {
  .logo {
    width: 260px;
    margin-bottom: 5rem;
  }
  
  .tagline {
    font-size: 4.25rem;
    margin-bottom: 5rem;
  }
  
  .sign-in-btn {
    margin-bottom: 5.5rem;
  }
}

/* Extra Large (≥1200px) */
@media (min-width: 1200px) {
  .logo {
    width: 280px;
    margin-bottom: 6rem;
    margin-top: -4rem;
    margin-left: -1rem;
  }
  
  .tagline {
    font-size: 5rem;
    margin-bottom: 6rem;
  }
  
  .sign-in-btn {
    margin-bottom: 6rem;
  }
}
</style>