const usernameInputEl = document.querySelector('.username-input');
const loginBtnEl = document.querySelector('.login-btn');
const maxAgeCookie = 31536000; // 1 Год

const login = () => {
	if (!usernameInputEl.value) return;
	const inputValue = usernameInputEl.value;
	document.cookie = `username=${ inputValue }; path=/; max-age=${ maxAgeCookie }`;
	window.location.href = '/';
};

loginBtnEl.addEventListener('click', () => login());
usernameInputEl.addEventListener('keydown', e => {
	if (e.key === 'Enter') login();
});