CREATE TABLE students (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL
);

INSERT INTO students (name) VALUES ('Amina'), ('Samir');

SELECT * FROM students;