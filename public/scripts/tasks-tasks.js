const getCookie = name => {
	const cookies = document.cookie.split('; ');
	for (let cookie of cookies) {
		const [ key, value ] = cookie.split('=');
		if (key === name) {
			return value;
		}
	}
	return null;
};
if (!getCookie('username')) {
	window.location.href = '/task-login';
}

const btnExitEl = document.querySelector('.btn-exit');
btnExitEl.addEventListener('click', () => window.location.href = '/task-login');

const createTaskBtnEl = document.querySelector('.create-task-btn');
createTaskBtnEl.addEventListener('click', () => window.location.href = '/task-create');

const editTaskBtnEl = document.querySelector('.edit-task-btn');
editTaskBtnEl.addEventListener('click', () => {
	const checkboxCheckedEl = document.querySelector('.checkbox:checked');
	const taskId = checkboxCheckedEl.taskId;
	window.location.href = `task-edit?id=${ taskId }`;
});

const deleteTaskBtnEl = document.querySelector('.delete-task-btn');
deleteTaskBtnEl.addEventListener('click', () => {
	const checkboxCheckedEls = [ ...document.querySelectorAll('.checkbox:checked') ];
	if (!checkboxCheckedEls.length) return;

	const selectedTaskIds = checkboxCheckedEls.map(checkboxEl => checkboxEl.taskId);

	fetch('/tasks', {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ selectedTaskIds }),

	}).then(() => {
		checkboxCheckedEls.forEach(checkboxEl => {
			checkboxEl.closest('.table-row').remove();
		});

		getAndRenderTasks();

		const tableRowEls = [ ...document.querySelectorAll('.table-row') ];
		if (!tableRowEls.length) {
			titleEl.innerText = `Задачи`;
			noTasksMessageEl.classList.remove('hidden');
		}

		headerCheckboxEl.checked = false;
		updateActionButtons();
	});
});

const headerCheckboxEl = document.querySelector('.header-checkbox');
headerCheckboxEl.addEventListener('change', () => {
	const checkboxEls = [ ...document.querySelectorAll('.checkbox') ];
	checkboxEls.forEach(checkboxEl => checkboxEl.checked = headerCheckboxEl.checked);
	updateActionButtons();
});

const updateActionButtons = () => {
	const selectedItemsCount = [ ...document.querySelectorAll('.checkbox:checked') ].length;
	deleteTaskBtnEl.disabled = !selectedItemsCount;
	editTaskBtnEl.disabled = selectedItemsCount !== 1;
}

const tableBodyEl = document.querySelector('.table-body');
const tableHeaderCellEls = [ ...document.querySelectorAll('.table-header-cell') ];
const noTasksMessageEl = document.querySelector('.no-tasks-message');
const titleEl = document.querySelector('.title');

const sortOptionsEl = document.querySelector('.sort-options');
sortOptionsEl.addEventListener('change', () => {
	tableBodyEl.innerText = '';
	getAndRenderTasks();
});

const quickSearchEl = document.querySelector('.quick-search');
let searchTimeoutId;
let previousSearchValue = '';
quickSearchEl.addEventListener('input', () => {
	const isPreviousValue = checkPreviousSearchValue();
	if (isPreviousValue) return;

	clearTimeout(searchTimeoutId);

	searchTimeoutId = setTimeout(() => {
		tableBodyEl.innerText = '';
		getAndRenderTasks();
	}, 500);
});
quickSearchEl.addEventListener('keydown', e => {
	const isPreviousValue = checkPreviousSearchValue();
	if (isPreviousValue) return;

	if (e.key === 'Enter') {
		tableBodyEl.innerText = '';
		getAndRenderTasks();
	}
});
quickSearchEl.addEventListener('blur', () => {
	const isPreviousValue = checkPreviousSearchValue();
	if (isPreviousValue) return;

	tableBodyEl.innerText = '';
	getAndRenderTasks();
});

const checkPreviousSearchValue = () => {
	const currentSearchValue = quickSearchEl.value.trim();

	if (currentSearchValue === previousSearchValue) return true;
	previousSearchValue = currentSearchValue;
	return false;
};

const generateQueryString = params => {
	const urlParams = new URLSearchParams;

	Object.entries(params).forEach(([ key, value ]) => {
		if (value != null) urlParams.append(key, value);
	});
	return urlParams.toString();
};

const renderTask = task => {
	const {
		id,
		startDatetime,
		endDatetime,
	} = task;

	const trEl = document.createElement('tr');
	trEl.classList.add('table-row');

	tableHeaderCellEls.forEach((thEl, index) => {
		const tdEl = document.createElement('td');
		tdEl.classList.add('table-cell');

		const spanEl = document.createElement('span');
		spanEl.classList.add('table-content');

		if (index === 0) {
			const inputEl = document.createElement('input');
			inputEl.classList.add('checkbox');
			inputEl.taskId = id;
			inputEl.type = 'checkbox';

			tdEl.append(inputEl);
		} else {
			spanEl.taskId = id;
			spanEl.innerText = (() => {
				switch (thEl.dataset.id) {
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
						return task[thEl.dataset.id];
				}
			})();
		}
		trEl.append(tdEl);
		if (index === 0) return;
		tdEl.append(spanEl);
	});
	tableBodyEl.append(trEl);
}
const renderTasks = tasksObject => {
	const {
		tasks,
		tasksCount,
		portionLength,
	} = tasksObject;

	const tableRowEls = [ ...document.querySelectorAll('.table-row') ];
	if (!tableRowEls.length) {
		noTasksMessageEl.classList.toggle('hidden', tasks?.length);
		titleEl.innerText = 'Задачи';
	}

	if (!tasks?.length) return;

	tasks.forEach(task => {
		renderTask(task);
	});

	titleEl.innerText = `Задачи ${ tasksCount }`;

	const checkboxEls = [ ...document.querySelectorAll('.checkbox') ];
	checkboxEls.forEach(checkboxEl => {
		checkboxEl.addEventListener('change', updateActionButtons);
	});

	const tableContentEls = [ ...document.querySelectorAll('.table-content') ];
	tableContentEls.forEach(tableContentEl => {
		tableContentEl.addEventListener('click', () => {
			const taskId = tableContentEl.taskId;
			window.location.href = `/task-details?id=${ taskId }`;
		});
	});

	if (tasksCount < 20) return;

	if (tasksCount >= parseInt(portionLength)) {
		const tableRowEl = document.querySelector('.table-row:last-child');
		observer.observe(tableRowEl);
	}
};

const observer = new IntersectionObserver(entries => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			observer.unobserve(entry.target);
			getAndRenderTasks();
		}
	});
}, { threshold: 0.5 });

const getAndRenderTasks = () => {
	clearTimeout(searchTimeoutId);

	const search = quickSearchEl.value.trim();
	const [ field, order ] = sortOptionsEl.value.split('|');

	const tableRowEls = [ ...document.querySelectorAll('.table-row') ];
	const offset = tableRowEls.length;

	const sort = { field, order };

	getTasks(search, sort, offset).then(tasks => renderTasks(tasks));
};

const getTasks = (search, sort, offset) => {
	const queryObject = { search, ...sort };
	const queryString = generateQueryString(queryObject);

	return fetch(`/tasks?${ queryString }&offset=${ offset }`, {
		credentials: 'include',
	}).then(response => {
		return response.json();
	});
}
getAndRenderTasks();