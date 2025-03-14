<template>
  <div class="landing-container">
    <div class="content">
      <img :src="logo" alt="Kaiborg Logo" class="logo" />
      <h1 class="tagline">Stupid simple kanbans for continuous improvement</h1>
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
  padding: 2rem;
  text-align: center;
  max-width: 1200px;
  width: 100%;
}

.logo {
  width: 280px;
  height: auto;
  margin-bottom: 6rem;
  margin-top: -4rem;
  margin-left: -1rem;
}

.tagline {
  font-family: 'Poppins', sans-serif;
  font-size: 5rem;
  line-height: 1.2;
  font-weight: 600;
  margin-bottom: 6rem;
  color: #e6e6e9;
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
  margin-bottom: 6rem;
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

@media (max-width: 768px) {
  .tagline {
    font-size: 2.5rem;
  }
  
  .logo {
    width: 180px;
  }
  
  .logo, .tagline, .sign-in-btn {
    margin-bottom: 3rem;
  }
}
</style>