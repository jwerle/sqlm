
UPDATE users
   SET username = $1,
       email  = $2,
       password = $3
 WHERE username = $1
    OR email = $2
