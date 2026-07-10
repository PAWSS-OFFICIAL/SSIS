CREATE TABLE IF NOT EXISTS pylearn_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_number INT NOT NULL,
    task_order INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    starter_code TEXT,
    expected_output TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pylearn_task_completions (
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, task_id)
);

CREATE TABLE IF NOT EXISTS pylearn_module_stars (
    user_id INT NOT NULL,
    module_number INT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, module_number)
);

CREATE TABLE IF NOT EXISTS pylearn_cert_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    text TEXT NOT NULL,
    optionA VARCHAR(255) NOT NULL,
    optionB VARCHAR(255) NOT NULL,
    optionC VARCHAR(255) NOT NULL,
    optionD VARCHAR(255) NOT NULL,
    correct_answer VARCHAR(1) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pylearn_cert_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    certificate_name VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    passed BOOLEAN NOT NULL,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
