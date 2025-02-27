const descriptionEls = [ ...document.querySelectorAll('.description') ];

const params = new URLSearchParams(window.location.search);
const taskId = params.get('id');

const getTask = () => {
	return fetch(`/tasks/?id=${ taskId }`).then(response => {
		return response.json();
	});
};
getTask().then(task => {
	const {
		id,
		creationDatetime,
		title,
		description,
		startDatetime,
		endDatetime,
	} = task;

	descriptionEls.forEach(descriptionEl => {
		descriptionEl.innerText = (() => {
			switch (descriptionEl.dataset.id) {
				case 'startDatetime':
					return new Intl.DateTimeFormat(navigator.language, {
						year: 'numeric',
						month: 'short',
						weekday: 'short',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
					}).format(new Date(startDatetime));
				case 'endDatetime':
					return new Intl.DateTimeFormat(navigator.language, {
						year: 'numeric',
						month: 'short',
						weekday: 'short',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
					}).format(new Date(endDatetime));
				default:
					return descriptionEl.innerText = task[descriptionEl.dataset.id];
			}
		})();
	});
});

const btnEdit = document.querySelector('.btn-edit');
btnEdit.addEventListener('click', () => window.location.href = `/task-edit?id=${ taskId }`);

const btnBackEl = document.querySelector('.btn-back');
btnBackEl.addEventListener('click', () => history.back());

const btnCloseEl = document.querySelector('.btn-close');
btnCloseEl.addEventListener('click', () => window.location.href='/');