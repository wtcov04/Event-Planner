# Create database script for event

# Create the database
create database event;
use event;


# Create the database
-- user table create
CREATE TABLE user (
  user_name VARCHAR(50) NOT NULL PRIMARY KEY,
  pwd VARCHAR(100) NOT NULL,
  origin_pwd VARCHAR(100) NOT NULL,
  password_sentence VARCHAR(255) NOT NULL,
  introduce VARCHAR(255)
);


-- event table create
CREATE TABLE event (
  event_id INT AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  view_count INT DEFAULT 0,
  limit_participant INT NOT NULL,
  place VARCHAR(50) NOT NULL,
  held_at VARCHAR(50) NOT NULL,
  FOREIGN KEY (user_name) REFERENCES user(user_name)
);


-- participant table create
CREATE TABLE participant (
    participant_id INT AUTO_INCREMENT PRIMARY KEY,
    user_name VARCHAR(50) NOT NULL,
    event_id INT NOT NULL,
    FOREIGN KEY (user_name) REFERENCES user(user_name),
    FOREIGN KEY (event_id) REFERENCES event(event_id)
    ON DELETE CASCADE
);


CREATE USER IF NOT EXISTS 'appuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'app2027';
GRANT ALL PRIVILEGES ON *.* TO 'appuser' IDENTIFIED BY 'app2027' WITH GRANT OPTION;
FLUSH PRIVILEGES;

