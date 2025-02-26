import express from 'express';
import path from 'path';
import pkg from 'pg';
import cookieParser from 'cookie-parser';

const { Pool } = pkg;

const pool = new Pool({
    user: 'TopTTeDHbIu-DeJLbFuH4uk',
    host: 'localhost',
    database: 'tasks',
    password: 'qwerty321',
    port: 5432,
});
pool.connect().then(() => {
    console.log('Connected to PostgreSQL and table "tasks" is accessible');
});

const PORT = 3000;
const app = express();

app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, response) => {
    response.sendFile(path.resolve('public/tasks-tasks.html'));
});
app.get('/task-create', (req, response) => {
    response.sendFile(path.resolve('public/tasks-create.html'));
});
app.get('/task-edit', (req, response) => {
    response.sendFile(path.resolve('public/tasks-create.html'));
});
app.get('/task-details', (req, response) => {
    response.sendFile(path.resolve('public/tasks-task.html'));
});
app.get('/task-entry', (req, response) => {
   response.sendFile(path.resolve('public/tasks-entry.html'));
});

app.get('/tasks', async (req, response) => {
    const {
        offset: offset,
        search: search,
        field: field,
        order: order,
        id: taskId,
    } = req.query;
    const limit = 20;
    let tasks;
    const username = req.cookies.username;

    const getTasksCount = async () => {
        const getTasksCount = `
            SELECT COUNT(*) FROM tasks
        ;`;

        const getTasksCountRes = await pool.query(getTasksCount);
        return getTasksCountRes.rows[0].count;
    };
    // ----------------------------------------------- //
    if (search) {
        const queryString = `
        SELECT 
            title,
            description,
            start_datetime,
            end_datetime
        FROM tasks
            WHERE (title ILIKE $1 OR description ILIKE $1)
            AND username = $2  
            LIMIT $3 OFFSET $4
        ;`;

        const searchResults = await pool.query(queryString, [`%${search}%`, username, limit, offset]);
        tasks = searchResults.rows;
    }
    // ----------------------------------------------- //
    else if (field || order) {
        const allowedFields = ['creation_datetime', 'title', 'description', 'start_datetime', 'end_datetime'];
        const allowedOrders = ['ASC', 'DESC'];

        if (!allowedFields.includes(field)) throw new Error('Invalid sort field');
        const sortOrder = allowedOrders.includes(order?.toUpperCase()) ? order.toUpperCase() : 'ASC';

        const sortQuery = `
        SELECT
            id,
            creation_datetime,
            title,
            description,
            start_datetime,
            end_datetime
        FROM tasks
            WHERE username = $1 
            ORDER BY ${field} ${sortOrder}
            LIMIT $2 OFFSET $3
        ;`;

        const sortedValues = await pool.query(sortQuery, [username, limit, offset]);
        tasks = sortedValues.rows;
    }
    // ----------------------------------------------- //
    if (taskId) {
        const getTask = `
            SELECT 
                id,
                creation_datetime,
                title,
                description,
                start_datetime,
                end_datetime
            FROM tasks
            WHERE id = ($1)
        ;`;

        const getTaskRes = await pool.query(getTask, [ taskId ]);
        const task = getTaskRes.rows[0];

        const res = convertToCamelCase(task);
        return response.status(200).json(res);
    }
    // ----------------------------------------------- //
    const tasksCount = await getTasksCount();
    const res = tasks.map(task => convertToCamelCase(task));
    return response.status(200).json( {tasks: res, tasksCount: tasksCount, portionLength: offset} );
});

app.patch('/tasks', async (req, response) => {
    const taskId = req.query.id;

    const {
        title,
        description,
        startDatetime,
        endDatetime,
    } = req.body.task;

    const updateTask = `
        UPDATE tasks
        SET title = $1,
            description = $2,
            start_datetime = $3,
            end_datetime = $4
        WHERE id = $5;
    ;`;

    await pool.query(updateTask, [
        title,
        description,
        startDatetime,
        endDatetime,
        taskId
    ]);
    response.sendStatus(200);
});

app.post('/tasks', async (req, response) => {
    const {
        title,
        description,
        startDatetime,
        endDatetime
    } = req.body.task;

    const username = req.cookies.username;
    const creationDatetime = new Date().toISOString();

    const createTask = `
        INSERT INTO tasks (
            creation_datetime,
            title,
            description,
            start_datetime,
            end_datetime,
            username
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6
        ) RETURNING id, 
        creation_datetime
    ;`;

    const createTaskRes = await pool.query(createTask, [
        creationDatetime,
        title,
        description,
        startDatetime,
        endDatetime,
        username
    ]);

    const res = {
        id: createTaskRes.rows[0].id,
        creationDatetime: createTaskRes.rows[0].creation_datetime,
    };

    response.status(201).json(res);
});

app.delete('/tasks', async (req, response) => {
    const { selectedTaskIds } = req.body;
    const numericIds = selectedTaskIds.map(selectedTaskId => parseInt(selectedTaskId));

    const query = `
        DELETE
        FROM tasks
        WHERE id = ANY ($1)
    ;`;

    await pool.query(query, [ numericIds ]);
    response.sendStatus(200);
});

const convertToCamelCase = dataObject => {
    const transformedObject = {};

    for (let originalKey in dataObject) {
        const camelCaseKey = originalKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        transformedObject[camelCaseKey] = dataObject[originalKey];
    }
    return transformedObject;
};

app.listen(PORT, () => console.log(`SERVER STARTED ON PORT ${ PORT }`));