const titleEl = document.querySelector('.title');
const btnSaveEl = document.querySelector('.btn-save');
const btnCancelEl = document.querySelector('.btn-cancel');
const btnCloseEl = document.querySelector('.btn-close');
const startDateEl = document.querySelector('.start-date');
const startTimeEl = document.querySelector('.start-time');
const endDateEl = document.querySelector('.end-date');
const inputEls = [ ...document.querySelectorAll('.input') ];

btnCancelEl.addEventListener('click', () => history.back());
btnCloseEl.addEventListener('click', () => window.location.href='/');

startDateEl.valueAsDate = new Date();
const now = new Date();
const hours = now.getHours().toString().padStart(2, '0');
const minutes = now.getMinutes().toString().padStart(2, '0');
startTimeEl.value = `${ hours }:${ minutes }`;

startDateEl.addEventListener('blur', () => {
	const selectedDate = new Date(startDateEl.value);
	const selectedYear = selectedDate.getFullYear();

	if (selectedYear < 2000 || selectedYear > 2100 || !startDateEl.value) {
		startDateEl.value = new Date().toISOString().slice(0, 10);
	}
});
endDateEl.addEventListener('blur', () => {
	const selectedDate = new Date(endDateEl.value);
	const selectedYear = selectedDate.getFullYear();

	const starSelectedDate = new Date(startDateEl.value);
	const startYear = starSelectedDate.getFullYear();

	if (selectedYear < startYear) {
		endDateEl.value = startDateEl.value;
	}
	if (selectedYear > 2100) {
		endDateEl.value = new Date().toISOString().slice(0, 10);
	}
});

const params = new URLSearchParams(window.location.search);
const taskId = params.get('id');

const createTask = task => {
	return fetch('/tasks', {
		method: 'POST',
		headers: {
			'Content-type': 'application/json',
		},
		body: JSON.stringify({ task }),
	});
};

const updateTask = task => {
	return fetch(`/tasks/?id=${ taskId }`, {
		method: 'PATCH',
		headers: {
			'Content-type': 'application/json',
		},
		body: JSON.stringify({ task }),
	});
};

const validate = () => {
	const requiredInputEls = [ ...document.querySelectorAll('.input:required') ];

	requiredInputEls.forEach(requiredInputEl => {
		if (!requiredInputEl.value) {
			requiredInputEl.classList.add('invalid');
		} else {
			requiredInputEl.classList.remove('invalid');
		}
	});
	return requiredInputEls.some(requiredInputEl => requiredInputEl.classList.contains('invalid'));
};

btnSaveEl.addEventListener('click', () => {
	const isInvalid = validate();
	if (isInvalid) return;

	btnSaveEl.disabled = true;
	const task = {};

	inputEls.forEach(inputEl => {
		task[inputEl.id] = inputEl.value;
	});

	const startDatetime = new Date(`${ task.startDate } ${ task.startTime }`).toISOString();
	const endDatetime = new Date(`${ task.endDate } ${ task.endTime }`).toISOString();

	const newTask = {
		title: task.title,
		description: task.description,
		startDatetime,
		endDatetime,
	};

	if (taskId) {
		updateTask(newTask).then(() => window.location.href = '/');
	} else {
		createTask(newTask).then(response => {
			return response.json();
		}).then(response => {
			const newTask = {
				...response,
				...task,
			};
			window.location.href = '/';
		});
	}
});

if (taskId) {
	titleEl.innerText = 'Редактирование задачи';
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

		inputEls.forEach(inputEl => {
			inputEl.value = (() => {
				switch (inputEl.id) {
					case 'startDate':
						return new Date(startDatetime).toISOString().split('T')[0];
					case 'startTime':
						return new Date(startDatetime).toISOString().split('T')[1].slice(0, 8);
					case 'endDate':
						return new Date(endDatetime).toISOString().split('T')[0];
					case 'endTime':
						return new Date(endDatetime).toISOString().split('T')[1].slice(0, 8)
					default:
						return task[inputEl.id];
				}
			})();
		});
	});
}