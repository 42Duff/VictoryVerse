document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/getCurrentUser');
    if (!res.ok) throw new Error('Not logged in');

    const user = await res.json();
    const profileImg = document.querySelector('.profilepicture img');
    if (user.profile_picture) {
      profileImg.src = 'images/profiles/' + user.profile_picture;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
      logoutBtn.onclick = async () => {
        await fetch('/logout', { method: 'POST' });
        window.location.href = 'welcome.html';
      };
    }

    const loginDiv = document.querySelector('.login');
    if (loginDiv) loginDiv.style.display = 'none';

  } catch (err) {
    console.log('Not logged in');
  }
});